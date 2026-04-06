from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Query
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from utils.auth import get_current_user
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import os
import uuid
import logging
import requests
import base64
import json
import re

router = APIRouter(prefix="/transactions", tags=["Transactions"])

logger = logging.getLogger(__name__)

# Get database connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Storage configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "financial-advisory-pro"
storage_key = None

# Allowed file types for receipts
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png", 
    "image/webp": "webp",
    "application/pdf": "pdf"
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def init_storage():
    """Initialize storage connection. Call once at startup."""
    global storage_key
    if storage_key:
        return storage_key
    
    if not EMERGENT_KEY:
        logger.error("EMERGENT_LLM_KEY not configured")
        raise Exception("Storage not configured")
    
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Failed to initialize storage: {e}")
        raise


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to object storage."""
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    """Download file from object storage."""
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


async def analyze_receipt_with_ocr(image_content: bytes, content_type: str, voice_description: str = None) -> dict:
    """
    Use AI vision to extract data from receipt image.
    Returns dict with: amount, date, merchant, category, description
    Optionally enhanced with voice_description for dual-context parsing.
    """
    # Only analyze images, not PDFs
    if not content_type.startswith("image/"):
        return None
    
    try:
        # Convert to base64
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        # Build context-aware system message
        voice_context = ""
        if voice_description:
            voice_context = f"\n\nThe user also described this receipt verbally: \"{voice_description}\"\nUse this as additional context to improve accuracy — especially for category, description, and any values that may be hard to read."

        system_message = f"""You are a receipt/invoice OCR assistant. Analyze the receipt image and extract:
1. Total amount (the final amount paid)
2. Date (in YYYY-MM-DD format)
3. Merchant/Store name
4. Suggested category (one of: housing, transport, food, utilities, communication, education, healthcare, entertainment, travel, shopping, business, other)
5. Brief description{voice_context}

Respond ONLY with valid JSON in this exact format:
{{
  "amount": 123.45,
  "date": "2026-03-27",
  "merchant": "Store Name",
  "category": "food",
  "description": "Brief description of purchase"
}}

If you cannot determine a value, use null. Always try to extract the total/final amount, not subtotals."""
        
        # Initialize chat with vision model
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"ocr-{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Create message with image
        image = ImageContent(image_base64=image_base64)
        analyze_text = "Please analyze this receipt/invoice and extract the relevant information."
        if voice_description:
            analyze_text = f"Analyze this receipt. The user described it as: \"{voice_description}\""
        
        user_message = UserMessage(
            text=analyze_text,
            file_contents=[image]
        )
        
        # Get response
        response = await chat.send_message(user_message)
        logger.info(f"OCR response: {response}")
        
        # Parse JSON from response
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            extracted_data = json.loads(json_match.group())
            logger.info(f"Extracted receipt data: {extracted_data}")
            return extracted_data
        
        return None
        
    except Exception as e:
        logger.error(f"OCR analysis failed: {e}")
        return None


# Pydantic models
class TransactionCreate(BaseModel):
    type: str = Field(..., description="'income' or 'expense'")
    amount: float = Field(..., gt=0)
    category: str
    description: Optional[str] = ""
    date: str  # ISO date string YYYY-MM-DD
    is_recurring: bool = False
    tax_deductible: bool = False


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    is_recurring: Optional[bool] = None
    tax_deductible: Optional[bool] = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    amount: float
    category: str
    description: str
    date: str
    is_recurring: bool
    tax_deductible: bool
    receipt_id: Optional[str] = None
    receipt_filename: Optional[str] = None
    created_at: str


class ReceiptResponse(BaseModel):
    id: str
    transaction_id: str
    filename: str
    content_type: str
    size: int
    created_at: str


@router.get("")
async def get_transactions(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all transactions for the current user, optionally filtered by month."""
    query = {"user_id": current_user["id"], "is_deleted": {"$ne": True}}
    
    if month:
        # Filter by month (YYYY-MM format)
        query["date"] = {"$regex": f"^{month}"}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return {"transactions": transactions}


@router.post("")
async def create_transaction(
    transaction: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new transaction."""
    transaction_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    transaction_doc = {
        "id": transaction_id,
        "user_id": current_user["id"],
        "type": transaction.type,
        "amount": transaction.amount,
        "category": transaction.category,
        "description": transaction.description or "",
        "date": transaction.date,
        "is_recurring": transaction.is_recurring,
        "tax_deductible": transaction.tax_deductible,
        "receipt_id": None,
        "receipt_filename": None,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    # Remove MongoDB _id before returning
    transaction_doc.pop("_id", None)
    return transaction_doc


@router.put("/{transaction_id}")
async def update_transaction(
    transaction_id: str,
    transaction: TransactionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing transaction."""
    existing = await db.transactions.find_one({
        "id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = {k: v for k, v in transaction.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": update_data}
    )
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    return updated


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a transaction."""
    existing = await db.transactions.find_one({
        "id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    })
    
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Transaction deleted"}


@router.post("/{transaction_id}/receipt")
async def upload_receipt(
    transaction_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a receipt for a transaction."""
    # Verify transaction exists and belongs to user
    transaction = await db.transactions.find_one({
        "id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Validate content type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES.keys())}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Generate storage path
    ext = ALLOWED_CONTENT_TYPES.get(content_type, "bin")
    receipt_id = str(uuid.uuid4())
    storage_path = f"{APP_NAME}/receipts/{current_user['id']}/{receipt_id}.{ext}"
    
    try:
        # Upload to object storage
        result = put_object(storage_path, content, content_type)
        logger.info(f"Receipt uploaded: {result['path']}")
        
        # Run OCR analysis on images
        ocr_data = None
        if content_type.startswith("image/"):
            ocr_data = await analyze_receipt_with_ocr(content, content_type)
        
        # Store receipt reference in database
        now = datetime.now(timezone.utc).isoformat()
        receipt_doc = {
            "id": receipt_id,
            "transaction_id": transaction_id,
            "user_id": current_user["id"],
            "storage_path": result["path"],
            "original_filename": file.filename,
            "content_type": content_type,
            "size": result.get("size", len(content)),
            "ocr_data": ocr_data,
            "is_deleted": False,
            "created_at": now
        }
        
        await db.receipts.insert_one(receipt_doc)
        
        # Update transaction with receipt reference
        await db.transactions.update_one(
            {"id": transaction_id},
            {"$set": {
                "receipt_id": receipt_id,
                "receipt_filename": file.filename,
                "updated_at": now
            }}
        )
        
        response_data = {
            "message": "Receipt uploaded successfully",
            "receipt_id": receipt_id,
            "filename": file.filename
        }
        
        # Include OCR data if available
        if ocr_data:
            response_data["ocr_data"] = ocr_data
            response_data["message"] = "Receipt uploaded and analyzed successfully"
        
        return response_data
        
    except Exception as e:
        logger.error(f"Failed to upload receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload receipt")


@router.get("/{transaction_id}/receipt")
async def get_receipt(
    transaction_id: str,
    auth: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Download a receipt for a transaction."""
    # Find the receipt
    receipt = await db.receipts.find_one({
        "transaction_id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    })
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    try:
        # Get from object storage
        content, content_type = get_object(receipt["storage_path"])
        
        return Response(
            content=content,
            media_type=receipt.get("content_type", content_type),
            headers={
                "Content-Disposition": f'inline; filename="{receipt["original_filename"]}"'
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to retrieve receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve receipt")


@router.delete("/{transaction_id}/receipt")
async def delete_receipt(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a receipt (storage has no delete API)."""
    receipt = await db.receipts.find_one({
        "transaction_id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    })
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Soft delete the receipt
    await db.receipts.update_one(
        {"id": receipt["id"]},
        {"$set": {"is_deleted": True, "deleted_at": now}}
    )
    
    # Remove receipt reference from transaction
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {"receipt_id": None, "receipt_filename": None, "updated_at": now}}
    )
    
    return {"message": "Receipt deleted"}


@router.get("/receipts/all")
async def get_all_receipts(
    current_user: dict = Depends(get_current_user)
):
    """Get all receipts for the current user."""
    receipts = await db.receipts.find(
        {"user_id": current_user["id"], "is_deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return {"receipts": receipts}


@router.post("/{transaction_id}/receipt/analyze")
async def analyze_receipt(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Re-analyze an existing receipt with OCR."""
    # Find the receipt
    receipt = await db.receipts.find_one({
        "transaction_id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    })
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Only analyze images
    if not receipt.get("content_type", "").startswith("image/"):
        raise HTTPException(status_code=400, detail="OCR only available for image files")
    
    try:
        # Get the image from storage
        content, content_type = get_object(receipt["storage_path"])
        
        # Run OCR analysis
        ocr_data = await analyze_receipt_with_ocr(content, content_type)
        
        if ocr_data:
            # Update receipt with OCR data
            await db.receipts.update_one(
                {"id": receipt["id"]},
                {"$set": {"ocr_data": ocr_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            return {
                "message": "Receipt analyzed successfully",
                "ocr_data": ocr_data
            }
        else:
            return {
                "message": "Could not extract data from receipt",
                "ocr_data": None
            }
            
    except Exception as e:
        logger.error(f"Failed to analyze receipt: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze receipt")


@router.get("/{transaction_id}/receipt/ocr")
async def get_receipt_ocr_data(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get OCR data for a receipt."""
    receipt = await db.receipts.find_one({
        "transaction_id": transaction_id,
        "user_id": current_user["id"],
        "is_deleted": {"$ne": True}
    }, {"_id": 0})
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return {
        "transaction_id": transaction_id,
        "receipt_id": receipt.get("id"),
        "ocr_data": receipt.get("ocr_data"),
        "has_ocr": receipt.get("ocr_data") is not None
    }

