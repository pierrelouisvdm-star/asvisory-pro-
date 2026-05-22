"""
AI Compliance & Advisor Notes
Generates FAIS-aligned advisor records from meeting inputs:
- Meeting notes / file notes
- Record of Advice (RoA)
- Risk profile summaries
- Product comparison notes
- Advice rationale
- Client action items
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

router = APIRouter(prefix="/compliance", tags=["Compliance"])


RECORD_TYPES = {
    "meeting_notes": "General client meeting notes / file note (FAIS s.18 record).",
    "record_of_advice": "Formal Record of Advice (RoA) per FAIS GCoC — what was advised, why, alternatives considered, fees disclosed.",
    "risk_profile_summary": "Plain-language client risk profile summary (Conservative/Moderate/Aggressive) with justification.",
    "product_comparison": "Side-by-side product comparison with rationale for the recommended product.",
    "advice_rationale": "Documented reasoning behind a recommendation (suitability + needs analysis).",
    "action_items": "Structured action items list (who, what, by when).",
}


SYSTEM_PROMPT = """You are a compliance writing assistant for South African financial advisors (FAIS-licensed FSPs).
Generate a structured advisor record using ONLY the data provided.

Rules:
- Reference the FAIS General Code of Conduct where relevant: needs analysis, suitability, full disclosure, fees, alternatives, conflicts of interest.
- Use ZAR (R) for all monetary values.
- SA-specific terminology: TFSA, RA, Reg 28, Section 37C, FSP, FAIS, GCoC, FSCA, CGT, estate duty, Section 14 transfer.
- Be precise and factual. If a field is not supplied, write "Not recorded" — never invent.
- Output ONLY valid JSON matching the schema for the requested record_type.

Schema by record_type:

meeting_notes / record_of_advice:
{
  "record_type": "string",
  "title": "string",
  "meeting_date": "ISO date string or 'Not recorded'",
  "attendees": ["string"],
  "summary": "string — 2-3 sentence overview",
  "needs_identified": ["string"],
  "advice_given": ["string"],
  "alternatives_considered": ["string"],
  "fees_disclosed": "string — what fees were discussed",
  "client_acknowledgement": "string — what the client agreed/understood",
  "action_items": [{"owner": "string", "task": "string", "due_date": "string"}],
  "next_review_date": "string or 'Not recorded'",
  "compliance_notes": "string — any FAIS compliance considerations (conflicts, churn risk, disclosures)"
}

risk_profile_summary:
{
  "record_type": "risk_profile_summary",
  "title": "string",
  "client_name": "string",
  "risk_level": "Conservative|Moderate-Conservative|Moderate|Moderate-Aggressive|Aggressive",
  "justification": "string — 2-3 sentences explaining the rating based on inputs",
  "investment_horizon": "string — short/medium/long term with years",
  "capacity_for_loss": "string",
  "recommended_asset_allocation": {"equity": "x%", "bonds": "x%", "cash": "x%", "alternatives": "x%"},
  "key_concerns": ["string"]
}

product_comparison:
{
  "record_type": "product_comparison",
  "title": "string",
  "products": [
    {"name": "string", "ter_eac": "string", "pros": ["string"], "cons": ["string"], "best_for": "string"}
  ],
  "recommendation": "string — which one and why",
  "rationale": "string"
}

advice_rationale:
{
  "record_type": "advice_rationale",
  "title": "string",
  "recommendation": "string",
  "client_objectives": ["string"],
  "needs_analysis_summary": "string",
  "suitability_check": "string",
  "tax_implications": "string",
  "estate_implications": "string",
  "risk_considerations": ["string"],
  "fees_total_eac": "string",
  "client_alternatives_offered": ["string"]
}

action_items:
{
  "record_type": "action_items",
  "title": "string",
  "items": [{"owner": "string", "task": "string", "due_date": "string", "priority": "High|Medium|Low"}]
}
"""


class GenerateComplianceRequest(BaseModel):
    record_type: str  # one of RECORD_TYPES keys
    client_id: Optional[str] = None
    meeting_date: Optional[str] = None
    attendees: Optional[List[str]] = None
    topics_discussed: Optional[str] = None  # free-form
    decisions: Optional[str] = None  # free-form
    products_mentioned: Optional[List[str]] = None  # for comparisons
    advisor_notes: Optional[str] = None  # everything else


@router.get("/record-types")
async def list_record_types(current_user: dict = Depends(get_current_user)):
    """Return available compliance record types for the UI."""
    return {"record_types": [{"key": k, "description": v} for k, v in RECORD_TYPES.items()]}


@router.post("/generate")
async def generate_compliance(
    request: GenerateComplianceRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a FAIS-aligned advisor record."""
    if request.record_type not in RECORD_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown record_type. Valid: {list(RECORD_TYPES.keys())}")

    # Pull client
    client_info = None
    if request.client_id:
        client_info = await db.clients.find_one(
            {"id": request.client_id, "advisor_id": current_user["id"]},
            {"_id": 0},
        )
        if not client_info:
            raise HTTPException(status_code=404, detail="Client not found")

    # Pull branding for advisor identity
    branding = await db.report_branding.find_one(
        {"advisor_id": current_user["id"]},
        {"_id": 0, "advisor_id": 0},
    ) or {}

    parts = [
        f"## Record type\n{request.record_type} — {RECORD_TYPES[request.record_type]}",
        f"\n## Advisor\n{branding.get('advisor_name') or current_user.get('full_name', '')} "
        f"({branding.get('firm_name') or current_user.get('company', '')}) "
        f"FSP: {branding.get('fsp_number', 'Not recorded')}",
    ]

    if client_info:
        parts.append(
            f"\n## Client\nName: {client_info.get('first_name', '')} {client_info.get('last_name', '')}\n"
            f"Age: {client_info.get('age', 'Not recorded')}\n"
            f"Risk profile on file: {client_info.get('risk_profile', 'Not recorded')}\n"
            f"Annual income: {client_info.get('annual_income', 'Not recorded')}\n"
            f"Goals: {client_info.get('financial_goals', 'Not recorded')}"
        )
    if request.meeting_date:
        parts.append(f"\n## Meeting date\n{request.meeting_date}")
    if request.attendees:
        parts.append(f"\n## Attendees\n{', '.join(request.attendees)}")
    if request.topics_discussed:
        parts.append(f"\n## Topics discussed\n{request.topics_discussed}")
    if request.decisions:
        parts.append(f"\n## Decisions made\n{request.decisions}")
    if request.products_mentioned:
        parts.append("\n## Products mentioned\n" + "\n".join(f"- {p}" for p in request.products_mentioned))
    if request.advisor_notes:
        parts.append(f"\n## Advisor notes\n{request.advisor_notes}")

    context = "\n".join(parts)

    # Call GPT-4o
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    session_id = f"compliance-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("openai", "gpt-4o")

    try:
        resp = await chat.send_message(
            UserMessage(text=f"Generate the record now. Output ONLY the JSON.\n\n{context}")
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    # Clean & parse JSON
    clean = resp.strip()
    for marker in ("```json", "```"):
        if clean.startswith(marker):
            clean = clean[len(marker):].lstrip()
    if clean.endswith("```"):
        clean = clean[:-3].rstrip()

    try:
        content = json.loads(clean)
    except json.JSONDecodeError:
        content = {
            "record_type": request.record_type,
            "title": "AI Record (raw output)",
            "raw_text": resp,
            "_parse_error": True,
        }

    # Persist
    record_id = str(uuid.uuid4())
    record = {
        "id": record_id,
        "advisor_id": current_user["id"],
        "client_id": request.client_id,
        "client_name": (
            f"{client_info.get('first_name', '')} {client_info.get('last_name', '')}".strip()
            if client_info else None
        ),
        "record_type": request.record_type,
        "meeting_date": request.meeting_date,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.compliance_records.insert_one(record)
    record.pop("_id", None)

    return {"success": True, "record": record}


@router.get("")
async def list_compliance(
    client_id: Optional[str] = None,
    record_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """List recent compliance records for the current advisor."""
    query = {"advisor_id": current_user["id"]}
    if client_id:
        query["client_id"] = client_id
    if record_type:
        query["record_type"] = record_type
    cursor = db.compliance_records.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    records = await cursor.to_list(length=limit)
    return {"records": records, "total": len(records)}


@router.get("/{record_id}")
async def get_compliance(record_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single record."""
    rec = await db.compliance_records.find_one(
        {"id": record_id, "advisor_id": current_user["id"]},
        {"_id": 0},
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    return rec


@router.delete("/{record_id}")
async def delete_compliance(record_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a compliance record."""
    result = await db.compliance_records.delete_one({
        "id": record_id,
        "advisor_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True, "message": "Record deleted"}
