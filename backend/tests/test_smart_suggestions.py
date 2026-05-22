"""
Backend tests for Smart Suggestions:
- GET /api/smart-suggestions/all
- GET /api/smart-suggestions/client/{id}
Rules: no_docs, no_portfolio_review, stale_review, outdated_products,
no_compliance, no_touchpoint, all_good. Plus auth + user isolation.
"""
import os
import time
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fap-sa-finance.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASSWORD = "Scorpio@57!!"
ADMIN_CLIENT_ID = "3474c87b-7435-4885-9658-d1b94acd28d5"

TS = int(time.time())


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        return None, None
    body = r.json()
    token = body.get("access_token") or body.get("token")
    user = body.get("user") or {}
    return token, user


def _register(email, password, full_name="Test User", role="advisor"):
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": password, "full_name": full_name, "role": role
    })
    return r


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- FIXTURES ----------
@pytest.fixture(scope="module")
def admin_token():
    token, user = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not token:
        pytest.skip("Admin login failed")
    return token, user


@pytest.fixture(scope="module")
def fresh_advisor():
    email = f"sm_adv_{TS}_{uuid.uuid4().hex[:6]}@example.com"
    pw = "Passw0rd!"
    _register(email, pw, role="advisor")
    token, user = _login(email, pw)
    if not token:
        pytest.skip("Fresh advisor login failed")
    return token, user


@pytest.fixture(scope="module")
def mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


# ---------- AUTH ----------
def test_all_requires_auth():
    r = requests.get(f"{API}/smart-suggestions/all")
    assert r.status_code in (401, 403)


def test_client_requires_auth():
    r = requests.get(f"{API}/smart-suggestions/client/{ADMIN_CLIENT_ID}")
    assert r.status_code in (401, 403)


# ---------- /all SHAPE ----------
def test_all_shape(admin_token):
    token, _ = admin_token
    r = requests.get(f"{API}/smart-suggestions/all", headers=_auth_headers(token))
    assert r.status_code == 200, r.text
    body = r.json()
    assert "suggestions" in body
    assert "total_clients" in body
    assert isinstance(body["suggestions"], dict)
    assert isinstance(body["total_clients"], int)


# ---------- /client/{id} SHAPE + admin client rules ----------
def test_admin_client_returns_expected_kinds(admin_token):
    token, _ = admin_token
    r = requests.get(f"{API}/smart-suggestions/client/{ADMIN_CLIENT_ID}", headers=_auth_headers(token))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["client_id"] == ADMIN_CLIENT_ID
    assert isinstance(body["suggestions"], list)
    kinds = {s["kind"] for s in body["suggestions"]}
    # The admin client per task: 3 rules — no_docs, no_compliance, no_touchpoint
    assert "no_docs" in kinds, f"no_docs missing in {kinds}"
    assert "no_compliance" in kinds, f"no_compliance missing in {kinds}"
    assert "no_touchpoint" in kinds, f"no_touchpoint missing in {kinds}"

    # Validate priorities & required fields
    for s in body["suggestions"]:
        assert s["priority"] in ("high", "medium", "low")
        assert isinstance(s["label"], str) and len(s["label"]) > 0
        assert isinstance(s["kind"], str) and len(s["kind"]) > 0
    by_kind = {s["kind"]: s for s in body["suggestions"]}
    assert by_kind["no_docs"]["priority"] == "medium"
    assert by_kind["no_compliance"]["priority"] == "medium"
    assert by_kind["no_touchpoint"]["priority"] == "low"


# ---------- /client/{bogus_id} -> 404 ----------
def test_bogus_client_returns_404(admin_token):
    token, _ = admin_token
    r = requests.get(f"{API}/smart-suggestions/client/{uuid.uuid4()}", headers=_auth_headers(token))
    assert r.status_code == 404


# ---------- ISOLATION: fresh advisor sees empty /all ----------
def test_isolation_empty_for_new_advisor(fresh_advisor):
    token, _ = fresh_advisor
    r = requests.get(f"{API}/smart-suggestions/all", headers=_auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert body["total_clients"] == 0
    assert body["suggestions"] == {}


def test_isolation_cant_access_other_advisors_client(fresh_advisor):
    token, _ = fresh_advisor
    r = requests.get(f"{API}/smart-suggestions/client/{ADMIN_CLIENT_ID}", headers=_auth_headers(token))
    assert r.status_code == 404


# ---------- RULE: no_portfolio_review (high) when docs > 0 but reviews == 0 ----------
def test_no_portfolio_review_rule(fresh_advisor, mongo_db):
    token, user = fresh_advisor
    # Create a new client via API
    r = requests.post(f"{API}/clients", headers=_auth_headers(token),
                      json={"first_name": "Doc", "last_name": "Only"})
    assert r.status_code in (200, 201), r.text
    cid = r.json()["id"]

    # Seed a document_analyses row directly in mongo
    mongo_db.document_analyses.insert_one({
        "id": str(uuid.uuid4()),
        "advisor_id": user["id"],
        "client_id": cid,
        "file_name": "stmt.pdf",
        "document_type": "statement",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    r2 = requests.get(f"{API}/smart-suggestions/client/{cid}", headers=_auth_headers(token))
    assert r2.status_code == 200
    kinds = {s["kind"]: s for s in r2.json()["suggestions"]}
    assert "no_portfolio_review" in kinds
    assert kinds["no_portfolio_review"]["priority"] == "high"
    # cleanup
    mongo_db.document_analyses.delete_many({"client_id": cid})
    requests.delete(f"{API}/clients/{cid}", headers=_auth_headers(token))


# ---------- RULE: stale_review (high) + outdated_products (high) ----------
def test_stale_review_and_outdated_products(fresh_advisor, mongo_db):
    token, user = fresh_advisor
    r = requests.post(f"{API}/clients", headers=_auth_headers(token),
                      json={"first_name": "Stale", "last_name": "Review"})
    assert r.status_code in (200, 201)
    cid = r.json()["id"]

    # Seed an old portfolio_review with outdated_product_warnings
    mongo_db.document_analyses.insert_one({
        "id": str(uuid.uuid4()), "advisor_id": user["id"], "client_id": cid,
        "file_name": "s.pdf", "document_type": "statement",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    old_iso = (datetime.now(timezone.utc) - timedelta(days=400)).isoformat()
    mongo_db.portfolio_reviews.insert_one({
        "id": str(uuid.uuid4()), "advisor_id": user["id"], "client_id": cid,
        "created_at": old_iso, "document_count": 1,
        "content": {"outdated_product_warnings": ["Old RA fund A", "High-fee unit trust"]},
    })

    r2 = requests.get(f"{API}/smart-suggestions/client/{cid}", headers=_auth_headers(token))
    assert r2.status_code == 200
    sugs = r2.json()["suggestions"]
    kinds = {s["kind"]: s for s in sugs}
    assert "stale_review" in kinds
    assert kinds["stale_review"]["priority"] == "high"
    assert "outdated_products" in kinds
    assert kinds["outdated_products"]["priority"] == "high"
    assert "2" in kinds["outdated_products"]["label"]  # "2 outdated products flagged"

    # cleanup
    mongo_db.document_analyses.delete_many({"client_id": cid})
    mongo_db.portfolio_reviews.delete_many({"client_id": cid})
    requests.delete(f"{API}/clients/{cid}", headers=_auth_headers(token))


# ---------- all_good fallback ----------
def test_all_good_fallback(fresh_advisor, mongo_db):
    token, user = fresh_advisor
    r = requests.post(f"{API}/clients", headers=_auth_headers(token),
                      json={"first_name": "Happy", "last_name": "Path"})
    assert r.status_code in (200, 201)
    cid = r.json()["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    # Seed 1 doc, 1 recent portfolio_review (no outdated warnings), 1 compliance, 1 email
    mongo_db.document_analyses.insert_one({
        "id": str(uuid.uuid4()), "advisor_id": user["id"], "client_id": cid,
        "file_name": "s.pdf", "document_type": "statement", "created_at": now_iso,
    })
    mongo_db.portfolio_reviews.insert_one({
        "id": str(uuid.uuid4()), "advisor_id": user["id"], "client_id": cid,
        "created_at": now_iso, "document_count": 1,
        "content": {"outdated_product_warnings": []},
    })
    mongo_db.compliance_records.insert_one({
        "id": str(uuid.uuid4()), "advisor_id": user["id"], "client_id": cid,
        "created_at": now_iso, "record_type": "RoA",
    })
    mongo_db.advisor_emails.insert_one({
        "id": str(uuid.uuid4()), "advisor_id": user["id"], "client_id": cid,
        "created_at": now_iso, "template_type": "follow_up", "tone": "warm",
    })

    r2 = requests.get(f"{API}/smart-suggestions/client/{cid}", headers=_auth_headers(token))
    assert r2.status_code == 200
    sugs = r2.json()["suggestions"]
    assert len(sugs) == 1, f"expected only all_good, got: {sugs}"
    assert sugs[0]["kind"] == "all_good"
    assert sugs[0]["priority"] == "low"

    # cleanup
    for col in ("document_analyses", "portfolio_reviews", "compliance_records", "advisor_emails"):
        mongo_db[col].delete_many({"client_id": cid})
    requests.delete(f"{API}/clients/{cid}", headers=_auth_headers(token))
