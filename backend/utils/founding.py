from models.subscription import FOUNDING_PRICING


async def count_combined_founding_members(db) -> int:
    """Count founding-priced annual Premium subscribers across both currencies.

    The first 150 slots are shared globally across SA (Paystack/ZAR) and
    US (Stripe/USD) subscribers, not 150 per jurisdiction.
    """
    zar_count = await db.paystack_transactions.count_documents({
        "status": "success",
        "billing_cycle": "annual",
        "amount": FOUNDING_PRICING["zar"],
    })
    usd_count = await db.payment_transactions.count_documents({
        "payment_status": "paid",
        "billing_cycle": "annual",
        "amount": FOUNDING_PRICING["usd"],
    })
    return zar_count + usd_count
