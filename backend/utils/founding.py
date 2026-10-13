from pymongo import ReturnDocument

from models.subscription import COMMUNITY_MEMBER_LIMIT


async def count_combined_founding_members(db) -> int:
    """Count subscribers who have ever been granted founding-member status.

    Counts the `founding_member` flag on `subscriptions` docs, not raw
    successful payments — a founding member's price stays the same on every
    renewal, so counting payments would re-count the same person every time
    they renew. The flag is set once, at first activation, and never cleared,
    so this reflects distinct members, shared globally across SA and US.
    """
    return await db.subscriptions.count_documents({"founding_member": True})


async def count_combined_community_members(db) -> int:
    """Count subscribers who have ever been granted Founders Network access.

    Same counting approach as `count_combined_founding_members`: the
    `community_member` flag is set once per user and never cleared, so this
    reflects distinct members of the shared 1,000-seat pool, not payments.
    """
    return await db.subscriptions.count_documents({"community_member": True})


async def assign_founder_number(db):
    """Atomically claim the next permanent Founders Network number (1..COMMUNITY_MEMBER_LIMIT).

    Uses a single counter document and a guarded, atomic increment so
    concurrent signups can never be handed the same number and the counter
    can never tick past the seat limit. Returns None once the pool is full.
    """
    await db.counters.update_one(
        {"_id": "founder_number"},
        {"$setOnInsert": {"seq": 0}},
        upsert=True,
    )
    result = await db.counters.find_one_and_update(
        {"_id": "founder_number", "seq": {"$lt": COMMUNITY_MEMBER_LIMIT}},
        {"$inc": {"seq": 1}},
        return_document=ReturnDocument.AFTER,
    )
    return result["seq"] if result else None


async def compute_community_grant(db, existing_sub: dict | None, is_founding_payment: bool) -> dict:
    """Decide whether a Premium activation should grant Founders Network access.

    Every Premium subscriber is eligible for one of the shared 1,000 seats,
    claimed atomically the first time they activate, and gets a permanent
    sequential founder number that's never reassigned or changed on renewal.
    Founding-price members (the smaller, exclusive inner circle) always get
    a seat too, even in the unlikely event the 1,000-seat pool fills up
    before all founding-price slots are claimed — they just won't get a
    number in that edge case, since none are left to hand out.
    """
    existing_sub = existing_sub or {}
    if existing_sub.get("founder_number") is not None:
        return {} if existing_sub.get("community_member") else {"community_member": True}

    number = await assign_founder_number(db)
    if number is not None:
        return {"community_member": True, "founder_number": number}

    if is_founding_payment or existing_sub.get("founding_member") or existing_sub.get("community_member"):
        return {"community_member": True}
    return {}
