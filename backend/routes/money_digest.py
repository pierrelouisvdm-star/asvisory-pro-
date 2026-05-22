"""
Monthly Money Digest
- Generates a personalised month-on-month financial summary for Individual users.
- Compares current snapshot vs previous month (from net_worth_snapshots).
- GPT-4o writes a single tailored "this month, focus on this" recommendation.
- Send-on-demand via Resend to the user's own email.
"""
import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
import resend

load_dotenv()
from emergentintegrations.llm.chat import LlmChat, UserMessage
from utils.auth import get_current_user
from server import db

logger = logging.getLogger(__name__)
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "support@advisorypro.co.za")

router = APIRouter(prefix="/me/digest", tags=["MoneyDigest"])

TFSA_ANNUAL_LIMIT = 36000.0
TFSA_LIFETIME_LIMIT = 500000.0
RA_DEDUCTION_RATE = 0.275
RA_DEDUCTION_CAP = 350000.0


SYSTEM_PROMPT = """You write friendly, encouraging monthly money updates for South African individuals.
Given two monthly financial snapshots (current vs previous), write a SHORT recommendation (2-3 sentences) on the single most impactful thing they should do this month.

Rules:
- Use ZAR (R) for money.
- Reference SA limits: TFSA R36k/yr · R500k lifetime, RA 27.5% of taxable income capped at R350k.
- Be SPECIFIC — use the actual figures provided. No placeholders.
- Be encouraging if progress is good, clear and gentle if it isn't.
- Output ONLY the recommendation text — NO greeting, NO markdown, NO json wrapper. Max 80 words."""


def _pct_change(curr: float, prev: float) -> Optional[float]:
    if not prev:
        return None
    return ((curr - prev) / prev) * 100


async def _compose_digest(user: dict, profile: dict, current: dict, previous: Optional[dict]):
    """Return (text_summary_dict, ai_recommendation_str)."""
    tfsa_remaining = max(TFSA_ANNUAL_LIMIT - (profile.get("tfsa_contributed_this_year") or 0), 0)
    ra_personal_cap = (
        min((profile.get("annual_income") or 0) * RA_DEDUCTION_RATE, RA_DEDUCTION_CAP)
        if profile.get("annual_income") else RA_DEDUCTION_CAP
    )
    ra_remaining = max(ra_personal_cap - (profile.get("ra_contributed_this_year") or 0), 0)

    nw_change = current["net_worth"] - (previous["net_worth"] if previous else current["net_worth"])
    nw_pct = _pct_change(current["net_worth"], previous["net_worth"]) if previous else None

    summary = {
        "first_name": (user.get("full_name") or "there").split(" ")[0],
        "period": current["period"],
        "net_worth": current["net_worth"],
        "net_worth_change": nw_change,
        "net_worth_pct_change": nw_pct,
        "total_assets": current["total_assets"],
        "total_liabilities": current["total_liabilities"],
        "tfsa_used_this_year": profile.get("tfsa_contributed_this_year") or 0,
        "tfsa_annual_remaining": tfsa_remaining,
        "tfsa_lifetime_used": profile.get("tfsa_contributed_lifetime") or 0,
        "tfsa_lifetime_remaining": max(TFSA_LIFETIME_LIMIT - (profile.get("tfsa_contributed_lifetime") or 0), 0),
        "ra_used_this_year": profile.get("ra_contributed_this_year") or 0,
        "ra_remaining_to_cap": ra_remaining,
        "ra_personal_cap": ra_personal_cap,
    }

    # AI recommendation
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    recommendation = ""
    if api_key:
        chat = LlmChat(api_key=api_key, session_id=f"digest-{user['id']}-{current['period']}", system_message=SYSTEM_PROMPT).with_model("openai", "gpt-4o")
        ctx = (
            f"Current month {current['period']}: net worth R{current['net_worth']:,.0f}, "
            f"assets R{current['total_assets']:,.0f}, liabilities R{current['total_liabilities']:,.0f}. "
            + (f"Previous month {previous['period']}: net worth R{previous['net_worth']:,.0f}. " if previous else "First month tracked. ")
            + f"TFSA this year: R{summary['tfsa_used_this_year']:,.0f} contributed, R{summary['tfsa_annual_remaining']:,.0f} remaining of R36k cap. "
            f"TFSA lifetime: R{summary['tfsa_lifetime_used']:,.0f} of R500k used. "
            f"RA this year: R{summary['ra_used_this_year']:,.0f} of R{summary['ra_personal_cap']:,.0f} personal cap. "
            f"Annual income: R{profile.get('annual_income') or 0:,.0f}. "
            f"Today's date: {datetime.now(timezone.utc).date()} (SA tax year ends 28 Feb)."
        )
        try:
            recommendation = await chat.send_message(UserMessage(text=ctx))
        except Exception as e:
            logger.warning(f"AI recommendation failed: {e}")
            recommendation = "Keep saving consistently and check your TFSA / RA caps before the end of the tax year (28 Feb)."

    return summary, recommendation.strip()


def _build_html(summary: dict, recommendation: str) -> str:
    chip = lambda label, value, color="#10b981": (  # noqa: E731
        f'<div style="background:#0f172a;border-left:4px solid {color};padding:10px 14px;border-radius:6px;margin:6px 0">'
        f'<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">{label}</div>'
        f'<div style="font-size:20px;color:#fff;font-weight:700;margin-top:2px">{value}</div>'
        '</div>'
    )

    nw_color = "#10b981" if (summary["net_worth_change"] or 0) >= 0 else "#ef4444"
    nw_sign = "+" if (summary["net_worth_change"] or 0) >= 0 else ""
    nw_change_line = f'{nw_sign}R{summary["net_worth_change"]:,.0f}' + (
        f' ({nw_sign}{summary["net_worth_pct_change"]:.1f}%)' if summary["net_worth_pct_change"] is not None else ""
    )

    return f"""
<!doctype html>
<html><body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;color:#e2e8f0">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <h1 style="color:#fff;font-size:24px;margin:0 0 4px">Hi {summary['first_name']},</h1>
  <p style="color:#94a3b8;margin:0 0 24px">Here's your money snapshot for <strong>{summary['period']}</strong>.</p>

  {chip("Net Worth", f"R{summary['net_worth']:,.0f}")}
  <p style="color:{nw_color};font-size:13px;margin:4px 0 16px">Month change: {nw_change_line}</p>

  {chip("TFSA — this tax year", f"R{summary['tfsa_used_this_year']:,.0f} / R36,000", "#3b82f6")}
  <p style="color:#94a3b8;font-size:12px;margin:4px 0 14px">R{summary['tfsa_annual_remaining']:,.0f} remaining before 28 Feb</p>

  {chip("RA contributions", f"R{summary['ra_used_this_year']:,.0f} / R{summary['ra_personal_cap']:,.0f}", "#8b5cf6")}
  <p style="color:#94a3b8;font-size:12px;margin:4px 0 24px">Tax-deductible cap (27.5% of income, max R350k)</p>

  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:18px;margin-top:16px">
    <div style="font-size:11px;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">✦ Your one focus this month</div>
    <p style="color:#fff;font-size:15px;line-height:1.6;margin:0">{recommendation or 'Keep saving consistently.'}</p>
  </div>

  <p style="color:#475569;font-size:11px;margin-top:32px;text-align:center">
    Financial Advisory Pro · Sent because you have a My Money profile.
  </p>
</div>
</body></html>
"""


@router.get("/preview")
async def preview_digest(current_user: dict = Depends(get_current_user)):
    """Return the digest payload (summary + AI recommendation + html) without sending."""
    profile = await db.user_financial_profiles.find_one(
        {"user_id": current_user["id"]}, {"_id": 0, "user_id": 0}
    ) or {}
    rows = await db.net_worth_snapshots.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("period", -1).limit(2).to_list(2)
    if not rows:
        raise HTTPException(status_code=400, detail="No snapshot yet — save your My Money profile first.")
    current = rows[0]
    previous = rows[1] if len(rows) > 1 else None
    summary, recommendation = await _compose_digest(current_user, profile, current, previous)
    html = _build_html(summary, recommendation)
    return {"summary": summary, "recommendation": recommendation, "html": html}


@router.post("/send")
async def send_digest(current_user: dict = Depends(get_current_user)):
    """Send the digest to the current user's email."""
    payload = await preview_digest(current_user)
    to_email = current_user.get("email")
    if not to_email:
        raise HTTPException(status_code=400, detail="No email on file")

    params = {
        "from": f"Financial Advisory Pro <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": f"Your Money Update — {payload['summary']['period']}",
        "html": payload["html"],
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Money digest sent to {to_email}, id={result.get('id')}")
        return {"success": True, "email_id": result.get("id"), "sent_to": to_email}
    except Exception as e:
        logger.error(f"Money digest send failed for {to_email}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to send: {e}")
