from datetime import datetime, timezone, timedelta
from typing import Optional

REFUND_WINDOW_DAYS = 7


def get_refund_eligibility(subscription: Optional[dict]) -> tuple[bool, Optional[datetime]]:
    """Return (eligible, deadline) for the 7-day money-back guarantee.

    Applies only to a user's first-ever annual Premium charge, never a
    renewal, and only once per account — a prior refund (refund_claimed_at)
    permanently disqualifies the account from claiming another, even if
    they resubscribe later.
    """
    if not subscription:
        return False, None
    if subscription.get("tier") != "premium" or subscription.get("status") != "active":
        return False, None
    if subscription.get("billing_cycle") != "annual":
        return False, None
    if subscription.get("refund_claimed_at"):
        return False, None

    first_at = subscription.get("first_annual_payment_at")
    first_id = subscription.get("first_annual_payment_id")
    if not first_at or not first_id or not isinstance(first_at, datetime):
        return False, None
    if subscription.get("last_payment_id") != first_id:
        return False, None  # a renewal has happened since — the window only ever covered the first charge

    if first_at.tzinfo is None:
        first_at = first_at.replace(tzinfo=timezone.utc)
    deadline = first_at + timedelta(days=REFUND_WINDOW_DAYS)
    eligible = datetime.now(timezone.utc) <= deadline
    return eligible, deadline
