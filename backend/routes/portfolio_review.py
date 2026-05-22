"""
Multi-Document Portfolio Review
Aggregates multiple client document analyses into a single deep portfolio view:
- Total AUM across all products
- Weighted fee analysis (EAC) vs SA benchmarks
- Cross-document asset allocation
- Concentration & diversification scoring
- Outdated/expensive product warnings
- Retirement readiness score
- Prioritised improvement recommendations
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

router = APIRouter(prefix="/portfolio-review", tags=["PortfolioReview"])


SYSTEM_PROMPT = """You are a senior South African financial planner conducting a multi-document portfolio review.
The advisor has uploaded analyses of multiple products held by one client (RA, TFSA, endowment, unit trusts, life cover, etc.).
Your job is to AGGREGATE everything into ONE consolidated view — never analyse each doc in isolation.

Rules:
- Use South African Rand (R) for all monetary values.
- SA benchmarks: Good EAC < 1.0% (passive/ETF) or < 1.5% (active); Fair 1.5-2.0%; High > 2.0%; Egregious > 2.5%.
- Reg 28 limits: equity ≤75%, offshore ≤45%, property ≤25%. Flag any breach.
- TFSA: R36,000/yr contribution, R500,000 lifetime cap.
- Flag classic outdated products: old endowments with high fees / surrender penalties, retirement annuities with TER > 2%, conventional life policies wrapped as savings, expensive structured products.
- Be SPECIFIC. Use actual figures from the documents whenever possible.
- If a value is unknown across all docs, write "Insufficient data" — never fabricate.

Output ONLY valid JSON in this exact shape:

{
  "title": "string",
  "executive_summary": "string — 3-4 sentences capturing the whole portfolio in plain language",
  "aggregate_metrics": {
    "total_value": number_or_null,
    "number_of_products": number,
    "weighted_eac_estimate": "string — e.g. '1.85% (Fair)'",
    "annual_fees_estimate": number_or_null,
    "asset_allocation": {"equity": "x%", "bonds": "x%", "property": "x%", "cash": "x%", "offshore": "x%", "alternatives": "x%"},
    "tax_wrappers_used": ["RA", "TFSA", "Discretionary", "Endowment", "Living Annuity"]
  },
  "product_breakdown": [
    {"product": "string", "value": number_or_null, "weight": "x%", "ter_eac": "string", "verdict": "Keep|Review|Switch|Exit", "verdict_reason": "string"}
  ],
  "fee_audit": {
    "commentary": "string — assess weighted fees vs SA benchmarks",
    "estimated_annual_fee_drag_rand": number_or_null,
    "10yr_fee_cost_estimate": number_or_null,
    "concerns": ["string"]
  },
  "diversification_analysis": {
    "score": "Well-Diversified|Adequate|Concentrated|Poorly Diversified",
    "asset_class_commentary": "string",
    "geographic_commentary": "string — SA vs offshore exposure",
    "concentration_risks": ["string"]
  },
  "outdated_product_warnings": [
    {"product": "string", "issue": "string", "recommended_action": "string"}
  ],
  "retirement_readiness": {
    "score": "On Track|Needs Attention|Behind|Insufficient Data",
    "commentary": "string",
    "estimated_replacement_ratio": "string — % of current income that retirement assets could replace"
  },
  "tax_efficiency": {
    "tfsa_utilisation": "string — how much of the R500k lifetime cap is used",
    "ra_deduction_optimised": "string — Yes/No/Partial with reasoning",
    "cgt_position": "string",
    "estate_planning_notes": "string"
  },
  "recommendations": [
    {"priority": "High|Medium|Low", "title": "string", "rationale": "string", "estimated_impact": "string"}
  ],
  "client_friendly_summary": "string — 4-5 sentences for the client in plain language, no jargon"
}"""


class GeneratePortfolioReviewRequest(BaseModel):
    document_analysis_ids: List[str]  # required, min 1
    client_id: Optional[str] = None
    advisor_notes: Optional[str] = None


@router.post("/generate")
async def generate_portfolio_review(
    request: GeneratePortfolioReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """Aggregate multiple document analyses into one consolidated portfolio review."""
    if not request.document_analysis_ids:
        raise HTTPException(status_code=400, detail="Provide at least one document analysis ID")

    # Pull client
    client_info = None
    if request.client_id:
        client_info = await db.clients.find_one(
            {"id": request.client_id, "advisor_id": current_user["id"]},
            {"_id": 0},
        )
        if not client_info:
            raise HTTPException(status_code=404, detail="Client not found")

    # Pull all document analyses (must belong to advisor)
    analyses = await db.document_analyses.find(
        {
            "id": {"$in": request.document_analysis_ids},
            "advisor_id": current_user["id"],
        },
        {"_id": 0},
    ).to_list(length=20)

    if len(analyses) == 0:
        raise HTTPException(status_code=404, detail="None of the document analyses were found")

    # Build context
    parts = [
        f"## Portfolio review — aggregating {len(analyses)} documents",
    ]
    if client_info:
        parts.append(
            f"\n## Client\nName: {client_info.get('first_name', '')} {client_info.get('last_name', '')}\n"
            f"Age: {client_info.get('age', 'Unknown')}\n"
            f"Annual income: R{client_info.get('annual_income', 'Unknown')}\n"
            f"Risk profile: {client_info.get('risk_profile', 'Unknown')}\n"
            f"Goals: {client_info.get('financial_goals', 'Unknown')}"
        )

    parts.append("\n## Documents to aggregate (analyse holistically, not in isolation)")
    for idx, a in enumerate(analyses, 1):
        parts.append(
            f"\n### Document {idx}: {a.get('document_type', 'Unknown')} — {a.get('file_name', '')}\n"
            f"{json.dumps(a.get('analysis', {}), indent=2)[:2500]}"
        )

    if request.advisor_notes:
        parts.append(f"\n## Advisor's additional context\n{request.advisor_notes}")

    context = "\n".join(parts)

    # Call GPT-4o
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    session_id = f"portfolio-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("openai", "gpt-4o")

    try:
        resp = await chat.send_message(
            UserMessage(text=f"Produce the consolidated portfolio review now. Output ONLY the JSON.\n\n{context}")
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    # Clean JSON
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
            "title": "Portfolio Review (raw output)",
            "executive_summary": resp[:500],
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
        "document_analysis_ids": request.document_analysis_ids,
        "document_count": len(analyses),
        "advisor_notes": request.advisor_notes,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.portfolio_reviews.insert_one(record)
    record.pop("_id", None)
    return {"success": True, "review": record}


@router.get("")
async def list_portfolio_reviews(
    client_id: Optional[str] = None,
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """List recent portfolio reviews."""
    query = {"advisor_id": current_user["id"]}
    if client_id:
        query["client_id"] = client_id
    cursor = db.portfolio_reviews.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    reviews = await cursor.to_list(length=limit)
    return {"reviews": reviews, "total": len(reviews)}


@router.get("/{review_id}")
async def get_portfolio_review(review_id: str, current_user: dict = Depends(get_current_user)):
    rec = await db.portfolio_reviews.find_one(
        {"id": review_id, "advisor_id": current_user["id"]},
        {"_id": 0},
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Review not found")
    return rec


@router.delete("/{review_id}")
async def delete_portfolio_review(review_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.portfolio_reviews.delete_one({
        "id": review_id,
        "advisor_id": current_user["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"success": True, "message": "Review deleted"}
