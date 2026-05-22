"""
AI Client Report Builder
Generates structured, AI-written client-ready report content
(executive summary, portfolio commentary, recommendations, etc.)
that the frontend renders into a branded PDF.
"""
import os
import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/reports", tags=["Reports"])


# ---------- Models ----------

class BrandingSettings(BaseModel):
    firm_name: Optional[str] = None
    advisor_name: Optional[str] = None
    advisor_email: Optional[str] = None
    advisor_phone: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#10B981"  # emerald-500
    disclaimer: Optional[str] = None
    fsp_number: Optional[str] = None  # SA Financial Services Provider licence


class GenerateReportRequest(BaseModel):
    client_id: Optional[str] = None
    document_analysis_ids: List[str] = []
    report_type: str = "portfolio_review"  # portfolio_review | annual_review | onboarding | retirement_readiness
    custom_notes: Optional[str] = None
    tone: str = "professional"  # professional | simple | hnw | beginner


# ---------- System Prompt ----------

REPORT_SYSTEM_PROMPT = """You are an expert South African financial advisor's writing assistant.
Generate a client-ready advisory report using ONLY the data provided.

Rules:
- Use South African Rand (R) for all monetary values.
- Reference SA-specific structures: TFSA (R36k/yr, R500k lifetime), Reg 28, RA tax deduction (27.5%, R350k cap), CGT, estate duty, offshore allowances (R1M discretionary + R10M FIA).
- Be precise, factual, and avoid generic filler.
- Adjust tone per the `tone` field: professional / simple / hnw (high-net-worth) / beginner.
- Output ONLY valid JSON matching this schema:

{
  "title": "string - report title",
  "executive_summary": "string - 2-3 sentence overview",
  "portfolio_breakdown": {
    "total_value": number_or_null,
    "commentary": "string - asset allocation commentary",
    "holdings": [{"name": "string", "value": number, "percentage": number}]
  },
  "fee_analysis": {
    "commentary": "string - fee level assessment vs SA benchmarks (good if EAC<1%, fair 1-2%, high >2%)",
    "concerns": ["string"]
  },
  "risk_analysis": {
    "commentary": "string",
    "risk_level": "Conservative|Moderate|Aggressive|Unknown"
  },
  "retirement_readiness": {
    "commentary": "string",
    "score": "On Track|Needs Attention|Behind|Unknown"
  },
  "tax_efficiency": {
    "commentary": "string - TFSA/RA utilisation, CGT positioning"
  },
  "recommendations": [
    {"priority": "High|Medium|Low", "title": "string", "rationale": "string"}
  ],
  "outdated_product_warnings": ["string - flag old endowments, expensive RAs, etc."],
  "advisor_notes": "string - private notes for the advisor",
  "client_friendly_explanation": "string - plain language summary the client can read"
}

If a section can't be answered from the provided data, write "Insufficient data to assess" — never invent numbers."""


# ---------- Endpoints ----------

@router.get("/branding")
async def get_branding(current_user: dict = Depends(get_current_user)):
    """Get the current advisor's branding settings."""
    branding = await db.report_branding.find_one(
        {"advisor_id": current_user["id"]},
        {"_id": 0, "advisor_id": 0}
    )
    if not branding:
        # Return sensible defaults
        return {
            "firm_name": "",
            "advisor_name": current_user.get("name", ""),
            "advisor_email": current_user.get("email", ""),
            "advisor_phone": "",
            "logo_url": "",
            "primary_color": "#10B981",
            "disclaimer": "This report is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results.",
            "fsp_number": "",
        }
    return branding


@router.put("/branding")
async def update_branding(
    settings: BrandingSettings,
    current_user: dict = Depends(get_current_user)
):
    """Create or update advisor branding settings."""
    data = settings.model_dump(exclude_none=False)
    data["advisor_id"] = current_user["id"]
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.report_branding.update_one(
        {"advisor_id": current_user["id"]},
        {"$set": data},
        upsert=True
    )

    # Return without _id / advisor_id
    data.pop("advisor_id", None)
    return {"success": True, "branding": data}


@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI report content from selected document analyses and client data."""

    # 1. Fetch client info (optional)
    client_info = None
    if request.client_id:
        client_info = await db.clients.find_one(
            {"id": request.client_id, "advisor_id": current_user["id"]},
            {"_id": 0}
        )
        if not client_info:
            raise HTTPException(status_code=404, detail="Client not found")

    # 2. Fetch document analyses
    analyses = []
    if request.document_analysis_ids:
        cursor = db.document_analyses.find(
            {
                "id": {"$in": request.document_analysis_ids},
                "advisor_id": current_user["id"]
            },
            {"_id": 0}
        )
        analyses = await cursor.to_list(length=20)

    if not analyses and not client_info and not request.custom_notes:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one document, a client, or custom notes to generate a report."
        )

    # 3. Build context for the LLM
    context_parts = [f"Report Type: {request.report_type}", f"Tone: {request.tone}"]

    if client_info:
        context_parts.append(
            f"\n## Client Profile\n"
            f"Name: {client_info.get('first_name', '')} {client_info.get('last_name', '')}\n"
            f"Age: {client_info.get('age', 'N/A')}\n"
            f"Risk Profile: {client_info.get('risk_profile', 'N/A')}\n"
            f"Annual Income: R{client_info.get('annual_income', 'N/A')}\n"
            f"Goals: {client_info.get('financial_goals', 'N/A')}"
        )

    if analyses:
        context_parts.append("\n## Document Analyses")
        for idx, a in enumerate(analyses, 1):
            context_parts.append(
                f"\n### Document {idx}: {a.get('document_type', 'Unknown')} ({a.get('file_name', '')})\n"
                f"{json.dumps(a.get('analysis', {}), indent=2)[:3000]}"
            )

    if request.custom_notes:
        context_parts.append(f"\n## Advisor's Additional Notes\n{request.custom_notes}")

    context = "\n".join(context_parts)

    # 4. Call GPT-4o
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    session_id = f"report-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=REPORT_SYSTEM_PROMPT,
    ).with_model("openai", "gpt-4o")

    user_msg = UserMessage(
        text=f"Generate a {request.report_type} report from the following data. Return ONLY the JSON object, no markdown.\n\n{context}"
    )

    try:
        response = await chat.send_message(user_msg)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    # 5. Parse JSON
    clean = response.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    if clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()

    try:
        report_content = json.loads(clean)
    except json.JSONDecodeError:
        report_content = {
            "title": "AI Report",
            "executive_summary": response[:500],
            "advisor_notes": "Raw AI output - JSON parsing failed.",
            "raw": response,
        }

    # 6. Save
    report_id = str(uuid.uuid4())
    record = {
        "id": report_id,
        "advisor_id": current_user["id"],
        "client_id": request.client_id,
        "client_name": (
            f"{client_info.get('first_name', '')} {client_info.get('last_name', '')}".strip()
            if client_info else None
        ),
        "report_type": request.report_type,
        "tone": request.tone,
        "document_analysis_ids": request.document_analysis_ids,
        "custom_notes": request.custom_notes,
        "content": report_content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.client_reports.insert_one(record)
    record.pop("_id", None)

    return {"success": True, "report": record}


@router.get("")
async def list_reports(
    client_id: Optional[str] = None,
    limit: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """List recent reports for the current advisor."""
    query = {"advisor_id": current_user["id"]}
    if client_id:
        query["client_id"] = client_id

    cursor = db.client_reports.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    reports = await cursor.to_list(length=limit)
    return {"reports": reports, "total": len(reports)}


@router.get("/{report_id}")
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch a single report."""
    report = await db.client_reports.find_one(
        {"id": report_id, "advisor_id": current_user["id"]},
        {"_id": 0}
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a report."""
    result = await db.client_reports.delete_one({
        "id": report_id,
        "advisor_id": current_user["id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": "Report deleted"}
