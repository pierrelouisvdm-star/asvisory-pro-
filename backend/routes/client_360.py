"""
Client 360 — unified aggregated view of everything tied to one client.
Pulls from clients, document_analyses, client_reports, advisor_emails,
compliance_records, and portfolio_reviews collections in a single call.
"""
from fastapi import APIRouter, HTTPException, Depends
from utils.auth import require_advisor as get_current_user
from server import db

router = APIRouter(prefix="/client-360", tags=["Client360"])


@router.get("/{client_id}")
async def client_360(client_id: str, current_user: dict = Depends(get_current_user)):
    """Return everything tied to a client in one payload."""
    advisor_id = current_user["id"]

    # Client (must belong to advisor)
    client = await db.clients.find_one(
        {"id": client_id, "advisor_id": advisor_id},
        {"_id": 0},
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    base_query = {"advisor_id": advisor_id, "client_id": client_id}

    # Fetch in parallel-ish (motor is async; sequential awaits are fine — Mongo is fast)
    documents = await db.document_analyses.find(base_query, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    reports = await db.client_reports.find(base_query, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    emails = await db.advisor_emails.find(base_query, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    compliance = await db.compliance_records.find(base_query, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    portfolio_reviews = await db.portfolio_reviews.find(base_query, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)

    # Build a unified timeline (latest first)
    def stamp(items, kind, title_fn, sub_fn):
        return [{
            "kind": kind,
            "id": item.get("id"),
            "title": title_fn(item),
            "subtitle": sub_fn(item),
            "created_at": item.get("created_at"),
        } for item in items]

    timeline = (
        stamp(documents, "document", lambda d: d.get("document_type", "Document"), lambda d: d.get("file_name", "")) +
        stamp(reports, "report", lambda d: d.get("content", {}).get("title") or d.get("report_type", "Report"), lambda d: d.get("report_type", "")) +
        stamp(emails, "email", lambda d: d.get("content", {}).get("subject") or d.get("template_type", "Email"), lambda d: f"{d.get('template_type', '')} · {d.get('tone', '')}") +
        stamp(compliance, "compliance", lambda d: d.get("content", {}).get("title") or d.get("record_type", "Record"), lambda d: d.get("record_type", "")) +
        stamp(portfolio_reviews, "portfolio_review", lambda d: d.get("content", {}).get("title") or "Portfolio Review", lambda d: f"{d.get('document_count', 0)} docs aggregated")
    )
    timeline.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return {
        "client": client,
        "counts": {
            "documents": len(documents),
            "reports": len(reports),
            "emails": len(emails),
            "compliance": len(compliance),
            "portfolio_reviews": len(portfolio_reviews),
        },
        "documents": documents,
        "reports": reports,
        "emails": emails,
        "compliance": compliance,
        "portfolio_reviews": portfolio_reviews,
        "timeline": timeline[:50],
    }
