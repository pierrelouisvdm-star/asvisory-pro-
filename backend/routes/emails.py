"""
AI Email & Communication Generator
Generates ready-to-send advisor communications:
- Review emails, follow-ups, meeting summaries, WhatsApp briefs,
  onboarding messages, annual review reminders, market updates.

All output is plain text with a separate optional HTML version.
Tone presets: professional | simple | hnw | beginner.
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

router = APIRouter(prefix="/emails", tags=["EmailGenerator"])


TEMPLATE_LIBRARY = {
    "review_email": "Annual / Quarterly Portfolio Review email — recap performance, fee position, recommendations, propose next meeting.",
    "follow_up": "Follow-up after a meeting — thank-you, decisions made, action items with owners and dates.",
    "meeting_summary": "Internal meeting summary / file note — bullet points of what was discussed (FAIS-aligned).",
    "whatsapp_brief": "Short WhatsApp-friendly summary (3-5 lines, no formatting, conversational).",
    "onboarding": "New client onboarding message — welcome, what happens next, documents needed, expectations.",
    "annual_review_reminder": "Friendly reminder that an annual review is due — book a meeting.",
    "market_update": "Short market update email referencing recent SA/global moves and what it means for clients.",
    "custom": "Free-form — use only the advisor's notes to compose the message.",
}

TONE_DESCRIPTIONS = {
    "professional": "Polished, formal, advisor-to-client tone. Full sentences, no jargon overload.",
    "simple": "Plain everyday language. Short sentences. Friendly but clear.",
    "hnw": "Sophisticated and concise. Assumes investment fluency. References strategy, tax positioning, after-tax returns.",
    "beginner": "Very simple. Explain every term. Encouraging tone. Avoid jargon entirely.",
}

SYSTEM_PROMPT = """You are an expert writing assistant for South African financial advisors.
Generate ready-to-send communications based on the advisor's input.

Rules:
- Use South African Rand (R) and SA terminology (TFSA, RA, Reg 28, FSP, CGT, estate duty).
- Respect the requested tone exactly.
- Be SPECIFIC. Use the client name, advisor name, firm name and provided context. NEVER use generic placeholders like [Client Name] or [Insert Date].
- For WhatsApp briefs: max 5 short lines, no markdown, conversational, fits in a single message.
- For email types: provide a sensible subject line.
- Avoid making up figures. If a fact isn't provided, write the sentence so it still reads naturally without inventing a number.
- Always end with a soft call-to-action (book a meeting / reply / call) unless instructed otherwise.

Output ONLY valid JSON in this exact shape:
{
  "subject": "string — concise subject line (for emails; for whatsapp use null)",
  "body_plain": "string — the message body in plain text (newlines OK, no markdown)",
  "body_html": "string — same content as body_plain but as basic HTML paragraphs (for email clients). For whatsapp, set to null.",
  "whatsapp_text": "string or null — only populated for whatsapp_brief type",
  "channel": "email" | "whatsapp" | "note",
  "tone": "string — echo the tone used"
}"""


class BrandingLite(BaseModel):
    advisor_name: Optional[str] = None
    firm_name: Optional[str] = None
    advisor_email: Optional[str] = None
    advisor_phone: Optional[str] = None


class GenerateEmailRequest(BaseModel):
    template_type: str  # one of TEMPLATE_LIBRARY keys
    tone: str = "professional"  # one of TONE_DESCRIPTIONS keys
    client_id: Optional[str] = None
    recipient_name: Optional[str] = None  # override / used when no client_id
    advisor_notes: Optional[str] = None  # context the advisor wants included
    bullet_points: Optional[List[str]] = None  # specific points to cover


@router.get("/templates")
async def list_templates(current_user: dict = Depends(get_current_user)):
    """Return available templates + tones for the UI."""
    return {
        "templates": [{"key": k, "description": v} for k, v in TEMPLATE_LIBRARY.items()],
        "tones": [{"key": k, "description": v} for k, v in TONE_DESCRIPTIONS.items()],
    }


@router.post("/generate")
async def generate_email(
    request: GenerateEmailRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a ready-to-send communication."""
    if request.template_type not in TEMPLATE_LIBRARY:
        raise HTTPException(status_code=400, detail=f"Unknown template_type. Valid: {list(TEMPLATE_LIBRARY.keys())}")
    if request.tone not in TONE_DESCRIPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown tone. Valid: {list(TONE_DESCRIPTIONS.keys())}")

    # Pull branding (used so signatures are real, not placeholders)
    branding = await db.report_branding.find_one(
        {"advisor_id": current_user["id"]},
        {"_id": 0, "advisor_id": 0}
    ) or {}

    # Pull client if provided
    client_info = None
    if request.client_id:
        client_info = await db.clients.find_one(
            {"id": request.client_id, "advisor_id": current_user["id"]},
            {"_id": 0},
        )
        if not client_info:
            raise HTTPException(status_code=404, detail="Client not found")

    # Build LLM context
    parts = [
        f"## Communication type\n{request.template_type} — {TEMPLATE_LIBRARY[request.template_type]}",
        f"\n## Tone\n{request.tone} — {TONE_DESCRIPTIONS[request.tone]}",
    ]

    advisor_name = branding.get("advisor_name") or current_user.get("full_name") or "Your Advisor"
    firm_name = branding.get("firm_name") or current_user.get("company") or ""
    parts.append(
        f"\n## Advisor signature\nName: {advisor_name}\nFirm: {firm_name}\n"
        f"Email: {branding.get('advisor_email') or current_user.get('email', '')}\n"
        f"Phone: {branding.get('advisor_phone', '')}"
    )

    recipient = request.recipient_name
    if client_info:
        recipient = f"{client_info.get('first_name', '')} {client_info.get('last_name', '')}".strip()
        parts.append(
            f"\n## Recipient (client on file)\nName: {recipient}\n"
            f"Age: {client_info.get('age', 'N/A')}\nRisk: {client_info.get('risk_profile', 'N/A')}\n"
            f"Goals: {client_info.get('financial_goals', 'N/A')}"
        )
    elif recipient:
        parts.append(f"\n## Recipient\nName: {recipient}")

    if request.bullet_points:
        parts.append("\n## Points to include\n" + "\n".join(f"- {b}" for b in request.bullet_points))
    if request.advisor_notes:
        parts.append(f"\n## Advisor's notes\n{request.advisor_notes}")

    context = "\n".join(parts)

    # Call GPT-4o
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    session_id = f"email-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("openai", "gpt-4o")

    try:
        resp = await chat.send_message(
            UserMessage(text=f"Generate the communication now. Output ONLY the JSON.\n\n{context}")
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
        # Graceful fallback: treat raw response as body
        content = {
            "subject": None,
            "body_plain": resp,
            "body_html": None,
            "whatsapp_text": resp if request.template_type == "whatsapp_brief" else None,
            "channel": "whatsapp" if request.template_type == "whatsapp_brief" else "email",
            "tone": request.tone,
            "_parse_error": True,
        }

    # Persist
    record_id = str(uuid.uuid4())
    record = {
        "id": record_id,
        "advisor_id": current_user["id"],
        "client_id": request.client_id,
        "recipient_name": recipient,
        "template_type": request.template_type,
        "tone": request.tone,
        "advisor_notes": request.advisor_notes,
        "bullet_points": request.bullet_points,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.advisor_emails.insert_one(record)
    record.pop("_id", None)

    return {"success": True, "email": record}


@router.get("")
async def list_emails(
    client_id: Optional[str] = None,
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """List recent generated communications for the current advisor."""
    query = {"advisor_id": current_user["id"]}
    if client_id:
        query["client_id"] = client_id
    cursor = db.advisor_emails.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    emails = await cursor.to_list(length=limit)
    return {"emails": emails, "total": len(emails)}


@router.delete("/{email_id}")
async def delete_email(email_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a generated communication."""
    result = await db.advisor_emails.delete_one({
        "id": email_id,
        "advisor_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"success": True, "message": "Email deleted"}
