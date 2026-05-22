"""
IRP5 vault — secure user-scoped storage for South African IRP5 tax certificates.

- Upload (PDF/PNG/JPG) → stored in Emergent object storage at
  advisorypro/uploads/{user_id}/{uuid}.{ext}
- File reference saved in MongoDB collection `irp5_documents` (source of truth).
- AI parsing extracts the key SARS source codes via GPT-4o vision.
- List / fetch / download / soft-delete are all scoped to the authenticated user.
"""
import os
import base64
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

import fitz  # PyMuPDF
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Header, Query, Response
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from utils.auth import get_current_user, decode_token
from utils.object_storage import put_object, get_object, APP_NAME
from server import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/me/irp5", tags=["IRP5"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
MIME_TYPES = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}

IRP5_PROMPT = """You are a South African tax document analyser. Parse this IRP5 / IT3(a) certificate and return ONLY valid JSON (no markdown, no commentary) with this shape:

{
  "tax_year": "<e.g. 2025>",
  "employer_name": "<string|null>",
  "employer_paye_ref": "<string|null>",
  "employee_full_name": "<string|null>",
  "employee_id_number": "<string|null>",
  "income_received": {
    "3601_income": <number|null>,
    "3605_annual_payment": <number|null>,
    "3697_gross_retirement_funding_income": <number|null>,
    "3698_gross_non_retirement_funding_income": <number|null>
  },
  "deductions": {
    "4001_pension_fund": <number|null>,
    "4002_arrears_pension": <number|null>,
    "4003_provident_fund": <number|null>,
    "4006_retirement_annuity": <number|null>,
    "4005_medical_aid": <number|null>,
    "4474_employer_medical_contribution": <number|null>
  },
  "tax_paid": {
    "4101_site": <number|null>,
    "4102_paye": <number|null>,
    "4103_total_tax": <number|null>,
    "4141_uif": <number|null>,
    "4142_sdl": <number|null>
  },
  "gross_remuneration": <number|null>,
  "key_observations": "<one short sentence on anything notable, e.g. low RA vs cap>"
}

Use ZAR (R) numbers as plain numbers (no commas, no currency symbol). Null when not visible."""


def _pdf_to_images(pdf_bytes: bytes, max_pages: int = 2) -> list[bytes]:
    images = []
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page_num in range(min(len(pdf), max_pages)):
        pix = pdf[page_num].get_pixmap(matrix=fitz.Matrix(2, 2))
        images.append(pix.tobytes("png"))
    pdf.close()
    return images


async def _ai_parse_irp5(images_b64: list[dict]) -> dict:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {"error": "AI service not configured"}
    chat = LlmChat(
        api_key=api_key,
        session_id=f"irp5-{uuid.uuid4()}",
        system_message=IRP5_PROMPT,
    ).with_model("openai", "gpt-4o")
    contents = [ImageContent(image_base64=img["data"]) for img in images_b64]
    msg = UserMessage(
        text=f"Parse this IRP5 certificate ({len(images_b64)} page(s)). Return ONLY the JSON object.",
        file_contents=contents,
    )
    try:
        raw = await chat.send_message(msg)
        clean = raw.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        if clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        return json.loads(clean.strip())
    except json.JSONDecodeError:
        return {"error": "AI returned non-JSON", "raw": raw[:500] if isinstance(raw, str) else ""}
    except Exception as e:
        logger.warning(f"IRP5 AI parse failed: {e}")
        return {"error": str(e)}


@router.post("/upload")
async def upload_irp5(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload an IRP5 PDF/image. Returns the saved metadata + AI-parsed fields."""
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum is 15MB.")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    ext = file_ext.lstrip(".")
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    storage_path = f"{APP_NAME}/uploads/{current_user['id']}/{uuid.uuid4()}.{ext}"

    try:
        result = put_object(storage_path, content, content_type)
    except Exception as e:
        logger.error(f"IRP5 storage upload failed: {e}")
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e}")

    # Build image set for AI parse
    images_b64 = []
    if ext == "pdf":
        try:
            for img in _pdf_to_images(content, max_pages=2):
                images_b64.append({"data": base64.b64encode(img).decode("utf-8")})
        except Exception as e:
            logger.warning(f"PDF→image conversion failed: {e}")
    else:
        images_b64.append({"data": base64.b64encode(content).decode("utf-8")})

    parsed = await _ai_parse_irp5(images_b64) if images_b64 else {}

    doc_id = str(uuid.uuid4())
    record = {
        "id": doc_id,
        "user_id": current_user["id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(content)),
        "extension": ext,
        "tax_year": parsed.get("tax_year"),
        "parsed": parsed,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.irp5_documents.insert_one(record)
    record.pop("_id", None)
    return {"success": True, "document": record}


@router.get("/list")
async def list_irp5(current_user: dict = Depends(get_current_user)):
    """List all of the current user's IRP5 documents (most recent first)."""
    cursor = db.irp5_documents.find(
        {"user_id": current_user["id"], "is_deleted": False},
        {"_id": 0},
    ).sort("created_at", -1)
    docs = await cursor.to_list(length=200)
    return {"documents": docs, "total": len(docs)}


@router.get("/{doc_id}")
async def get_irp5(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Get parsed metadata for a single IRP5 doc."""
    doc = await db.irp5_documents.find_one(
        {"id": doc_id, "user_id": current_user["id"], "is_deleted": False},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{doc_id}/download")
async def download_irp5(
    doc_id: str,
    authorization: Optional[str] = Header(None),
    auth: Optional[str] = Query(None),
):
    """Stream the original file. Accepts Bearer header or ?auth= query for direct <a> links."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    elif auth:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    doc = await db.irp5_documents.find_one(
        {"id": doc_id, "user_id": user_id, "is_deleted": False},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        data, ct = get_object(doc["storage_path"])
    except Exception as e:
        logger.error(f"IRP5 download fetch failed: {e}")
        raise HTTPException(status_code=502, detail=f"Storage fetch failed: {e}")

    return Response(
        content=data,
        media_type=doc.get("content_type") or ct,
        headers={
            "Content-Disposition": f'attachment; filename="{doc.get("original_filename", "irp5")}"'
        },
    )


@router.delete("/{doc_id}")
async def delete_irp5(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Soft-delete (storage has no delete; we just hide it)."""
    result = await db.irp5_documents.update_one(
        {"id": doc_id, "user_id": current_user["id"], "is_deleted": False},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}
