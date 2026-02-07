"""
AI Document Reader - Analyzes financial documents using GPT Vision
Supports: Investment statements, Bank statements, Pension statements, IRP5 certificates
"""
import os
import base64
import uuid
import io
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import fitz  # PyMuPDF for PDF handling
from PIL import Image

from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/documents", tags=["Documents"])

# Supported file types
ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.webp'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB for PDFs


def convert_pdf_to_images(pdf_content: bytes, max_pages: int = 3) -> List[bytes]:
    """
    Convert PDF pages to PNG images.
    Returns list of image bytes (PNG format).
    """
    images = []
    try:
        # Open PDF from bytes
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
        
        # Process up to max_pages
        num_pages = min(len(pdf_document), max_pages)
        
        for page_num in range(num_pages):
            page = pdf_document[page_num]
            
            # Render page to image with good resolution
            # zoom = 2 gives us 144 DPI (72 * 2)
            zoom = 2
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image then to bytes
            img_data = pix.tobytes("png")
            images.append(img_data)
        
        pdf_document.close()
        return images
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

# Document analysis system prompt
DOCUMENT_ANALYSIS_PROMPT = """You are a financial document analyzer for South African financial advisors. 
Analyze the uploaded document and extract ALL relevant information in a structured format.

For each document, identify and extract:

1. **Document Type**: (Investment Statement, Bank Statement, Pension Statement, IRP5 Certificate, Other)

2. **Personal Details**:
   - Full Name
   - ID Number (if visible)
   - Account Number(s)
   - Contact details (if any)

3. **Account Summary**:
   - Total Value/Balance
   - Statement Date/Period
   - Previous Balance (if shown)
   - Account Type

4. **Holdings/Assets** (for investment statements):
   - Fund names and values
   - Number of units
   - Unit prices
   - Asset allocation percentages

5. **Transactions** (list recent transactions if shown):
   - Date
   - Description
   - Amount
   - Running balance

6. **Fees & Charges**:
   - Management fees
   - Admin fees
   - Other charges
   - Fee percentages

7. **Tax Information** (especially for IRP5):
   - Gross income
   - PAYE deducted
   - Tax year
   - Medical aid contributions
   - Pension/RA contributions
   - UIF contributions

8. **Key Insights**:
   - Any notable observations
   - Potential concerns
   - Recommendations for the advisor

Format your response as a structured JSON object with these categories.
If a field is not visible or not applicable, use null.
Always use South African Rand (ZAR/R) for monetary values."""


class DocumentAnalysis(BaseModel):
    id: str
    client_id: Optional[str] = None
    document_type: str
    file_name: str
    analysis: dict
    raw_text: Optional[str] = None
    created_at: str
    created_by: str


class SaveToClientRequest(BaseModel):
    analysis_id: str
    client_id: str


@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    client_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and analyze a financial document using AI.
    Supports PDF, PNG, JPG, JPEG, WEBP files.
    PDFs are automatically converted to images for analysis.
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 20MB")
    
    # Prepare image(s) for analysis
    images_base64 = []
    
    if file_ext == '.pdf':
        # Convert PDF pages to images
        try:
            pdf_images = convert_pdf_to_images(content, max_pages=5)
            for img_data in pdf_images:
                images_base64.append({
                    'data': base64.b64encode(img_data).decode('utf-8'),
                    'mime': 'image/png'
                })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
    else:
        # Single image file
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp'
        }
        images_base64.append({
            'data': base64.b64encode(content).decode('utf-8'),
            'mime': mime_types.get(file_ext, 'image/jpeg')
        })
    
    try:
        # Initialize LLM chat with vision capability
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        session_id = f"doc-analysis-{uuid.uuid4()}"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=DOCUMENT_ANALYSIS_PROMPT
        ).with_model("openai", "gpt-4o")  # Using GPT-4o for vision
        
        # Create image content(s) - support multiple pages from PDF
        image_contents = []
        for img in images_base64:
            image_contents.append(ImageContent(image_base64=img['data']))
        
        # Build message based on number of pages
        if len(images_base64) > 1:
            msg_text = f"Please analyze this financial document ({len(images_base64)} pages) and extract all relevant information as structured JSON. Combine information from all pages into a single comprehensive analysis."
        else:
            msg_text = "Please analyze this financial document and extract all relevant information as structured JSON."
        
        # Send message with image(s)
        user_message = UserMessage(
            text=msg_text,
            image_contents=image_contents
        )
        
        response = await chat.send_message(user_message)
        
        # Try to parse response as JSON
        import json
        try:
            # Clean response if it has markdown code blocks
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.startswith('```'):
                clean_response = clean_response[3:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            
            analysis_data = json.loads(clean_response.strip())
        except json.JSONDecodeError:
            # If not valid JSON, wrap in a structure
            analysis_data = {
                "raw_analysis": response,
                "parsing_note": "Response was not in JSON format"
            }
        
        # Create document analysis record
        doc_id = str(uuid.uuid4())
        document = {
            "id": doc_id,
            "client_id": client_id,
            "document_type": analysis_data.get("document_type", "Unknown"),
            "file_name": file.filename,
            "analysis": analysis_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user["id"],
            "advisor_id": current_user["id"]
        }
        
        # Save to database
        await db.document_analyses.insert_one(document)
        
        # Return without _id
        document.pop("_id", None)
        
        return {
            "success": True,
            "message": "Document analyzed successfully",
            "document": document
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")


@router.get("/analyses")
async def get_analyses(
    client_id: Optional[str] = None,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get document analyses for the current user, optionally filtered by client."""
    query = {"advisor_id": current_user["id"]}
    if client_id:
        query["client_id"] = client_id
    
    cursor = db.document_analyses.find(
        query, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    
    analyses = await cursor.to_list(length=limit)
    
    return {
        "analyses": analyses,
        "total": len(analyses)
    }


@router.get("/analyses/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific document analysis."""
    analysis = await db.document_analyses.find_one(
        {"id": analysis_id, "advisor_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis


@router.post("/save-to-client")
async def save_analysis_to_client(
    request: SaveToClientRequest,
    current_user: dict = Depends(get_current_user)
):
    """Link a document analysis to a specific client."""
    # Verify analysis exists and belongs to user
    analysis = await db.document_analyses.find_one({
        "id": request.analysis_id,
        "advisor_id": current_user["id"]
    })
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Verify client exists and belongs to user
    client = await db.clients.find_one({
        "id": request.client_id,
        "advisor_id": current_user["id"]
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Update analysis with client_id
    await db.document_analyses.update_one(
        {"id": request.analysis_id},
        {"$set": {"client_id": request.client_id}}
    )
    
    # Also add a reference to the client's documents array
    await db.clients.update_one(
        {"id": request.client_id},
        {"$addToSet": {"document_analyses": request.analysis_id}}
    )
    
    return {
        "success": True,
        "message": f"Analysis linked to client {client.get('first_name', '')} {client.get('last_name', '')}"
    }


@router.delete("/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a document analysis."""
    result = await db.document_analyses.delete_one({
        "id": analysis_id,
        "advisor_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {"success": True, "message": "Analysis deleted"}
