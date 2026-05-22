"""
Smart Suggestions
Deterministic "what to do next" suggestions per client, computed from their data
across reports / compliance / portfolio reviews / emails / documents.

No AI cost — pure rule-based, runs in O(clients) Mongo queries.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from utils.auth import require_advisor as get_current_user
from server import db

router = APIRouter(prefix="/smart-suggestions", tags=["SmartSuggestions"])


class Suggestion(BaseModel):
    priority: str  # "high" | "medium" | "low"
    label: str  # short badge text
    detail: Optional[str] = None  # tooltip / longer explanation
    kind: str  # category — e.g. "stale_review", "outdated_products", "no_docs"


def _months_since(iso_str: Optional[str]) -> Optional[float]:
    if not iso_str:
        return None
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    except Exception:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - dt
    return delta.total_seconds() / (60 * 60 * 24 * 30.44)


async def _compute_for_client(advisor_id: str, client: dict) -> List[Suggestion]:
    """Inspect a client's footprint and emit prioritised suggestions."""
    cid = client["id"]
    base = {"advisor_id": advisor_id, "client_id": cid}

    # Latest items per collection (just _id + created_at + relevant content)
    latest_portfolio = await db.portfolio_reviews.find_one(
        base, sort=[("created_at", -1)], projection={"_id": 0, "created_at": 1, "content": 1}
    )
    latest_compliance = await db.compliance_records.find_one(
        base, sort=[("created_at", -1)], projection={"_id": 0, "created_at": 1}
    )
    latest_email = await db.advisor_emails.find_one(
        base, sort=[("created_at", -1)], projection={"_id": 0, "created_at": 1}
    )
    doc_count = await db.document_analyses.count_documents(base)
    report_count = await db.client_reports.count_documents(base)
    portfolio_count = await db.portfolio_reviews.count_documents(base)

    suggestions: List[Suggestion] = []

    # Rule 1 — onboarding: no docs uploaded yet
    if doc_count == 0:
        suggestions.append(Suggestion(
            priority="medium",
            label="No documents uploaded",
            detail="Upload this client's statements to unlock portfolio reviews and AI insights.",
            kind="no_docs",
        ))

    # Rule 2 — annual review overdue (no portfolio review or last > 12 months)
    months_since_review = _months_since(latest_portfolio.get("created_at") if latest_portfolio else None)
    if portfolio_count == 0 and doc_count > 0:
        suggestions.append(Suggestion(
            priority="high",
            label="Portfolio review needed",
            detail="Documents are uploaded but no portfolio review has been generated yet.",
            kind="no_portfolio_review",
        ))
    elif months_since_review and months_since_review >= 12:
        suggestions.append(Suggestion(
            priority="high",
            label=f"Review overdue ({int(months_since_review)} months)",
            detail="The last portfolio review is over 12 months old. Time for an annual review.",
            kind="stale_review",
        ))
    elif months_since_review and months_since_review >= 9:
        suggestions.append(Suggestion(
            priority="medium",
            label="Review due soon",
            detail=f"Last portfolio review was {round(months_since_review, 1)} months ago.",
            kind="review_due_soon",
        ))

    # Rule 3 — outdated products flagged in the latest portfolio review
    if latest_portfolio and isinstance(latest_portfolio.get("content"), dict):
        warnings = latest_portfolio["content"].get("outdated_product_warnings") or []
        if isinstance(warnings, list) and len(warnings) > 0:
            suggestions.append(Suggestion(
                priority="high",
                label=f"{len(warnings)} outdated products flagged",
                detail="Latest portfolio review flagged outdated / expensive products that need action.",
                kind="outdated_products",
            ))

    # Rule 4 — no compliance record (FAIS exposure)
    if not latest_compliance:
        suggestions.append(Suggestion(
            priority="medium",
            label="No compliance record",
            detail="No Record of Advice or compliance note exists for this client yet.",
            kind="no_compliance",
        ))
    else:
        months_since_compliance = _months_since(latest_compliance.get("created_at"))
        if months_since_compliance and months_since_compliance >= 18:
            suggestions.append(Suggestion(
                priority="medium",
                label="Compliance note ageing",
                detail=f"Last compliance record was {int(months_since_compliance)} months ago.",
                kind="stale_compliance",
            ))

    # Rule 5 — no touchpoint (no email) in 3+ months
    months_since_email = _months_since(latest_email.get("created_at") if latest_email else None)
    if (latest_email is None and report_count == 0) or (months_since_email and months_since_email >= 3):
        suggestions.append(Suggestion(
            priority="low",
            label="No recent touchpoint",
            detail="No client communication generated in the last 3 months — consider a check-in.",
            kind="no_touchpoint",
        ))

    # If absolutely nothing flagged: positive note
    if not suggestions:
        suggestions.append(Suggestion(
            priority="low",
            label="All up to date",
            detail="No pending actions for this client.",
            kind="all_good",
        ))

    return suggestions


@router.get("/all")
async def all_clients_suggestions(current_user: dict = Depends(get_current_user)):
    """Return suggestions for every client of this advisor in one call."""
    clients = await db.clients.find(
        {"advisor_id": current_user["id"]}, {"_id": 0}
    ).to_list(length=500)

    result = {}
    for c in clients:
        sugs = await _compute_for_client(current_user["id"], c)
        result[c["id"]] = [s.model_dump() for s in sugs]

    return {"suggestions": result, "total_clients": len(clients)}


@router.get("/client/{client_id}")
async def client_suggestions(client_id: str, current_user: dict = Depends(get_current_user)):
    """Return suggestions for a single client."""
    client = await db.clients.find_one(
        {"id": client_id, "advisor_id": current_user["id"]}, {"_id": 0}
    )
    if not client:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Client not found")
    sugs = await _compute_for_client(current_user["id"], client)
    return {"client_id": client_id, "suggestions": [s.model_dump() for s in sugs]}
