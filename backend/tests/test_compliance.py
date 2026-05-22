"""
Tests for AI Compliance & Advisor Notes (FAIS-aligned).
- GET /api/compliance/record-types
- POST /api/compliance/generate (record_of_advice, risk_profile_summary, product_comparison)
- POST /api/compliance/generate validations (invalid record_type=400, invalid client_id=404)
- GET /api/compliance (list + filter)
- GET /api/compliance/{id} (single + 404)
- DELETE /api/compliance/{id}
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASS = "Scorpio@57!!"

EXPECTED_RECORD_TYPES = {
    "meeting_notes", "record_of_advice", "risk_profile_summary",
    "product_comparison", "advice_rationale", "action_items",
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# Shared state for create -> list -> get -> delete chain
created_ids = {}


# --- Record types endpoint ---
class TestRecordTypes:
    def test_requires_auth(self, session):
        r = session.get(f"{API}/compliance/record-types")
        assert r.status_code in (401, 403)

    def test_returns_six_types(self, session, admin_headers):
        r = session.get(f"{API}/compliance/record-types", headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "record_types" in body
        keys = {x["key"] for x in body["record_types"]}
        assert keys == EXPECTED_RECORD_TYPES, f"Got {keys}"
        for entry in body["record_types"]:
            assert entry.get("description"), "Each type should have a description"


# --- Validations ---
class TestGenerateValidations:
    def test_invalid_record_type_400(self, session, admin_headers):
        r = session.post(f"{API}/compliance/generate", headers=admin_headers, json={
            "record_type": "not_a_real_type",
            "topics_discussed": "abc",
        })
        assert r.status_code == 400, r.text

    def test_invalid_client_id_404(self, session, admin_headers):
        r = session.post(f"{API}/compliance/generate", headers=admin_headers, json={
            "record_type": "meeting_notes",
            "client_id": f"bogus-{uuid.uuid4().hex}",
            "topics_discussed": "abc",
        })
        assert r.status_code == 404, r.text


# --- Generation (AI-dependent — allow longer timeout) ---
class TestGenerate:
    def test_generate_record_of_advice(self, session, admin_headers):
        payload = {
            "record_type": "record_of_advice",
            "meeting_date": "2026-01-15",
            "attendees": ["Jane Doe (Client)", "Pierre VDM (Advisor)"],
            "topics_discussed": "Reviewed RA allocation, discussed offshore exposure, TFSA top-up before tax year end.",
            "decisions": "Increase Reg 28 equity weight to 65%. Top up TFSA R36k before end-Feb.",
            "advisor_notes": "Disclosed advisor fee 1.0% p.a. Discussed Section 14 transfer alternative.",
        }
        r = session.post(f"{API}/compliance/generate", headers=admin_headers, json=payload, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        rec = body["record"]
        assert rec["record_type"] == "record_of_advice"
        assert "id" in rec
        c = rec["content"]
        # Tolerant: AI may sometimes omit a field, but the most critical FAIS RoA fields should exist
        assert c.get("title"), "title missing"
        assert c.get("summary"), "summary missing"
        # At least one of these structural arrays must exist
        assert any(k in c for k in ("needs_identified", "advice_given", "action_items")), \
            f"No structured FAIS fields in content: {list(c.keys())}"
        created_ids["roa"] = rec["id"]

    def test_generate_risk_profile(self, session, admin_headers):
        payload = {
            "record_type": "risk_profile_summary",
            "advisor_notes": (
                "Client: 35 yo software engineer, R1.2m annual income, no dependants, "
                "20+ year horizon, comfortable with 30% drawdown, growth focused, "
                "willing to accept volatility for long-term returns."
            ),
        }
        r = session.post(f"{API}/compliance/generate", headers=admin_headers, json=payload, timeout=90)
        assert r.status_code == 200, r.text
        c = r.json()["record"]["content"]
        valid_levels = {"Conservative", "Moderate-Conservative", "Moderate", "Moderate-Aggressive", "Aggressive"}
        assert c.get("risk_level") in valid_levels, f"risk_level invalid: {c.get('risk_level')}"
        assert c.get("justification"), "justification missing"
        assert c.get("investment_horizon"), "investment_horizon missing"
        alloc = c.get("recommended_asset_allocation") or {}
        assert isinstance(alloc, dict) and len(alloc) >= 2, f"asset allocation missing/invalid: {alloc}"
        created_ids["risk"] = r.json()["record"]["id"]

    def test_generate_product_comparison(self, session, admin_headers):
        payload = {
            "record_type": "product_comparison",
            "products_mentioned": [
                "Allan Gray Balanced (TER 1.55%)",
                "Coronation Balanced Plus (TER 1.40%)",
            ],
            "advisor_notes": "Compare for a 40yo client seeking Reg 28 compliant balanced fund.",
        }
        r = session.post(f"{API}/compliance/generate", headers=admin_headers, json=payload, timeout=90)
        assert r.status_code == 200, r.text
        c = r.json()["record"]["content"]
        products = c.get("products") or []
        assert isinstance(products, list) and len(products) >= 1, f"products missing: {c}"
        first = products[0]
        # At least name + pros/cons should be present
        assert first.get("name"), "product name missing"
        assert ("pros" in first) or ("cons" in first), f"pros/cons missing in {first}"
        assert c.get("recommendation"), "recommendation missing"
        created_ids["pc"] = r.json()["record"]["id"]


# --- List / Get / Delete ---
class TestListGetDelete:
    def test_list_records(self, session, admin_headers):
        r = session.get(f"{API}/compliance", headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "records" in body
        ids = {x["id"] for x in body["records"]}
        # At least one of our newly created records should be present
        if created_ids:
            assert any(cid in ids for cid in created_ids.values()), "Newly created records not found in list"

    def test_list_filter_by_type(self, session, admin_headers):
        r = session.get(f"{API}/compliance?record_type=record_of_advice", headers=admin_headers)
        assert r.status_code == 200, r.text
        for rec in r.json()["records"]:
            assert rec["record_type"] == "record_of_advice"

    def test_get_single_record(self, session, admin_headers):
        if "roa" not in created_ids:
            pytest.skip("RoA was not created")
        r = session.get(f"{API}/compliance/{created_ids['roa']}", headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json()["id"] == created_ids["roa"]

    def test_get_bogus_id_404(self, session, admin_headers):
        r = session.get(f"{API}/compliance/bogus-{uuid.uuid4().hex}", headers=admin_headers)
        assert r.status_code == 404

    def test_delete_record(self, session, admin_headers):
        if "pc" not in created_ids:
            pytest.skip("Product comparison was not created")
        rid = created_ids["pc"]
        r = session.delete(f"{API}/compliance/{rid}", headers=admin_headers)
        assert r.status_code == 200, r.text
        # Subsequent GET should 404
        r2 = session.get(f"{API}/compliance/{rid}", headers=admin_headers)
        assert r2.status_code == 404


# --- Cleanup remaining test records ---
@pytest.fixture(scope="module", autouse=True)
def cleanup(session):
    yield
    headers_resp = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if headers_resp.status_code != 200:
        return
    headers = {"Authorization": f"Bearer {headers_resp.json()['access_token']}"}
    for rid in list(created_ids.values()):
        try:
            session.delete(f"{API}/compliance/{rid}", headers=headers)
        except Exception:
            pass
