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
    """Count subscribers who have ever been granted community-directory access.

    Same counting approach as `count_combined_founding_members`: the
    `community_member` flag is set once per user and never cleared, so this
    reflects distinct members of the shared 1,000-seat pool, not payments.
    """
    return await db.subscriptions.count_documents({"community_member": True})


async def compute_community_flag(db, existing_sub: dict | None, is_founding_payment: bool) -> dict:
    """Decide whether a Premium activation should grant community-directory access.

    Founding members (the smaller, exclusive inner circle) always get
    community access as part of that status. Everyone else is granted it
    once, the first time they activate a paid Premium subscription, as long
    as the shared 1,000-seat pool still has room. Once granted, it's never
    revoked by a later renewal or price change.
    """
    existing_sub = existing_sub or {}
    if is_founding_payment or existing_sub.get("founding_member") or existing_sub.get("community_member"):
        return {"community_member": True}

    used = await count_combined_community_members(db)
    if used < COMMUNITY_MEMBER_LIMIT:
        return {"community_member": True}
    return {}
