"""
Backend tests for My Money Net Worth History (Snapshot upsert + GET /history)
- PUT /api/me/financial/profile now also upserts a row in net_worth_snapshots
- GET /api/me/financial/history returns oldest-first snapshots
- Saving twice in same month = 1 row (upsert)
- ?months=N limits result
- User isolation
"""
import os
import time
import random
import string
import pytest
import requests
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

# Load backend env to get MONGO_URL + DB_NAME (must match server)
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fap-sa-finance.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]


def _rand_email(prefix):
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}_{int(time.time())}_{suffix}@example.com"


def _register_and_login(email, password="Passw0rd!", full_name="Hist Test"):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": password, "full_name": full_name, "role": "individual"
    })
    assert r.status_code in (200, 201, 400, 409), f"register: {r.status_code} {r.text}"
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    user = body.get("user") or {}
    user_id = user.get("id") or user.get("_id") or user.get("user_id")
    assert token, body
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s, token, user_id


def _get_user_id_from_db(email):
    u = db.users.find_one({"email": email})
    return str(u["_id"]) if u and "_id" in u and u.get("id") is None else (u.get("id") if u else None)


@pytest.fixture(scope="module")
def user_a():
    email = _rand_email("hist_a")
    s, token, uid = _register_and_login(email)
    # Try to resolve user_id via /auth/me if not returned by login
    if not uid:
        r = s.get(f"{API}/auth/me")
        if r.status_code == 200:
            uid = r.json().get("id") or r.json().get("_id")
    if not uid:
        # fallback: query Mongo
        doc = db.users.find_one({"email": email})
        uid = doc.get("id") if doc else None
    assert uid, f"could not resolve user_id for {email}"
    yield {"session": s, "email": email, "user_id": uid}
    # cleanup
    db.net_worth_snapshots.delete_many({"user_id": uid})
    db.user_financial_profiles.delete_many({"user_id": uid})


@pytest.fixture(scope="module")
def user_b():
    email = _rand_email("hist_b")
    s, token, uid = _register_and_login(email)
    if not uid:
        r = s.get(f"{API}/auth/me")
        if r.status_code == 200:
            uid = r.json().get("id") or r.json().get("_id")
    if not uid:
        doc = db.users.find_one({"email": email})
        uid = doc.get("id") if doc else None
    assert uid, f"could not resolve user_id for {email}"
    yield {"session": s, "email": email, "user_id": uid}
    db.net_worth_snapshots.delete_many({"user_id": uid})
    db.user_financial_profiles.delete_many({"user_id": uid})


PROFILE_PAYLOAD = {
    "age": 40,
    "retirement_age": 65,
    "annual_income": 500000,
    "monthly_expenses": 20000,
    "risk_profile": "Moderate",
    "tfsa_contributed_this_year": 10000,
    "tfsa_contributed_lifetime": 80000,
    "ra_contributed_this_year": 25000,
    "assets": [
        {"name": "Property", "value": 1000000, "category": "property"},
        {"name": "Equity Portfolio", "value": 500000, "category": "equity"},
    ],
    "liabilities": [
        {"name": "Home loan", "balance": 400000, "monthly_payment": 5000},
    ],
}


# ---------- AUTH ----------
def test_history_requires_auth():
    r = requests.get(f"{API}/me/financial/history")
    assert r.status_code in (401, 403)


# ---------- SNAPSHOT WRITE ON PUT ----------
def test_put_profile_writes_snapshot(user_a):
    s = user_a["session"]
    r = s.put(f"{API}/me/financial/profile", json=PROFILE_PAYLOAD)
    assert r.status_code == 200, r.text

    # Verify snapshot row exists in net_worth_snapshots
    now = datetime.now(timezone.utc)
    period = f"{now.year:04d}-{now.month:02d}"
    snap = db.net_worth_snapshots.find_one({"user_id": user_a["user_id"], "period": period})
    assert snap is not None, f"snapshot row missing for user {user_a['user_id']} period {period}"
    assert snap["total_assets"] == 1500000
    assert snap["total_liabilities"] == 400000
    assert snap["net_worth"] == 1100000
    assert snap["tfsa_contributed_lifetime"] == 80000
    assert snap["tfsa_contributed_this_year"] == 10000
    assert snap["ra_contributed_this_year"] == 25000
    assert "captured_at" in snap


# ---------- UPSERT — SAME MONTH STAYS 1 ROW ----------
def test_double_save_same_month_upserts(user_a):
    s = user_a["session"]
    # PUT twice in same month
    s.put(f"{API}/me/financial/profile", json=PROFILE_PAYLOAD)
    s.put(f"{API}/me/financial/profile", json={**PROFILE_PAYLOAD, "annual_income": 550000})

    r = s.get(f"{API}/me/financial/history")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "history" in body
    assert "count" in body
    # Only current month row
    rows = body["history"]
    now = datetime.now(timezone.utc)
    period = f"{now.year:04d}-{now.month:02d}"
    matching = [r for r in rows if r["period"] == period]
    assert len(matching) == 1, f"expected 1 row for period {period}, got {len(matching)}: {rows}"


# ---------- MULTI-MONTH ORDERING ----------
def test_history_oldest_first_with_seeded_older(user_a):
    s = user_a["session"]
    uid = user_a["user_id"]

    # Seed an older snapshot directly
    db.net_worth_snapshots.update_one(
        {"user_id": uid, "period": "2025-01"},
        {"$set": {
            "user_id": uid,
            "period": "2025-01",
            "captured_at": "2025-01-15T00:00:00+00:00",
            "total_assets": 800000,
            "total_liabilities": 600000,
            "net_worth": 200000,
            "tfsa_contributed_lifetime": 50000,
            "tfsa_contributed_this_year": 5000,
            "ra_contributed_this_year": 10000,
        }},
        upsert=True,
    )
    # Also seed a 2025-06 one in the middle
    db.net_worth_snapshots.update_one(
        {"user_id": uid, "period": "2025-06"},
        {"$set": {
            "user_id": uid,
            "period": "2025-06",
            "captured_at": "2025-06-15T00:00:00+00:00",
            "total_assets": 900000,
            "total_liabilities": 500000,
            "net_worth": 400000,
        }},
        upsert=True,
    )

    r = s.get(f"{API}/me/financial/history")
    assert r.status_code == 200
    body = r.json()
    rows = body["history"]
    assert len(rows) >= 3, f"expected >=3 rows, got {len(rows)}"
    periods = [row["period"] for row in rows]
    # sorted ascending
    assert periods == sorted(periods), f"history not oldest-first: {periods}"
    assert "2025-01" in periods
    assert "2025-06" in periods


# ---------- MONTHS LIMIT ----------
def test_history_months_limit(user_a):
    s = user_a["session"]
    uid = user_a["user_id"]
    # Seed extra periods
    for i, period in enumerate(["2024-01", "2024-06", "2024-12", "2025-03"]):
        db.net_worth_snapshots.update_one(
            {"user_id": uid, "period": period},
            {"$set": {
                "user_id": uid, "period": period,
                "captured_at": f"{period}-15T00:00:00+00:00",
                "total_assets": 1000 * (i + 1),
                "total_liabilities": 0,
                "net_worth": 1000 * (i + 1),
            }},
            upsert=True,
        )

    r = s.get(f"{API}/me/financial/history?months=2")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] <= 2, f"expected count <=2, got {body['count']}"
    assert len(body["history"]) <= 2


# ---------- USER ISOLATION ----------
def test_user_isolation(user_a, user_b):
    sa = user_a["session"]
    sb = user_b["session"]

    # b puts its own profile
    rb = sb.put(f"{API}/me/financial/profile", json={
        **PROFILE_PAYLOAD,
        "assets": [{"name": "B-only Asset", "value": 99999, "category": "cash"}],
        "liabilities": [],
    })
    assert rb.status_code == 200

    # b's history contains only b's rows
    rbh = sb.get(f"{API}/me/financial/history")
    assert rbh.status_code == 200
    b_rows = rbh.json()["history"]
    # All b rows should NOT contain the unique markers from a (a has total_assets 1500000)
    # Validate by checking total_assets values include 99999 and exclude 1500000 (only a's val)
    b_assets_set = {row.get("total_assets") for row in b_rows}
    assert 99999 in b_assets_set, f"b should see its own snapshot: {b_rows}"
    # b's row should not include a's 2025-01 seeded period
    b_periods = {row["period"] for row in b_rows}
    assert "2025-01" not in b_periods, f"isolation breach — b sees a's 2025-01: {b_rows}"

    # a's history should NOT contain b's 99999
    rah = sa.get(f"{API}/me/financial/history")
    assert rah.status_code == 200
    a_rows = rah.json()["history"]
    a_assets_set = {row.get("total_assets") for row in a_rows}
    assert 99999 not in a_assets_set, f"isolation breach — a sees b's snapshot: {a_rows}"
