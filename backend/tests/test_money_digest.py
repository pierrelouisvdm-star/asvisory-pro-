"""
Backend tests for Monthly Money Digest feature.
- GET /api/me/digest/preview
- POST /api/me/digest/send
Plus regression checks for:
- Net-worth snapshot upsert via POST /api/me/financial/profile (PUT)
- Advisor role gating on protected endpoints
- Pricing tiers (3 tiers + Enterprise)
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASS = "Scorpio@57!!"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def advisor_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"advisor login failed: {r.status_code} {r.text}"
    return r.json()["access_token"] if "access_token" in r.json() else r.json().get("token")


@pytest.fixture(scope="module")
def individual_creds(s):
    """Register a fresh individual user."""
    ts = int(time.time())
    email = f"ind_digest_{ts}@example.com"
    password = "Passw0rd!"
    r = s.post(f"{API}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Digest Tester",
        "role": "individual",
    }, timeout=20)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    assert token, f"no token in register response: {body}"
    return {"email": email, "password": password, "token": token}


@pytest.fixture(scope="module")
def individual_token(individual_creds):
    return individual_creds["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- /me/digest/preview ----------
class TestDigestPreview:
    def test_preview_no_snapshot_returns_400(self, s, individual_token):
        """Fresh individual user with no profile/snapshot → 400."""
        r = s.get(f"{API}/me/digest/preview", headers=_auth(individual_token), timeout=30)
        assert r.status_code == 400, f"expected 400 with no snapshot, got {r.status_code}: {r.text}"
        assert "snapshot" in r.text.lower() or "profile" in r.text.lower()

    def test_seed_profile_creates_snapshot(self, s, individual_token):
        """PUT /me/financial/profile must upsert + create net_worth_snapshots row."""
        payload = {
            "age": 35,
            "retirement_age": 65,
            "annual_income": 600000,
            "monthly_expenses": 25000,
            "risk_profile": "Moderate",
            "tfsa_contributed_this_year": 15000,
            "tfsa_contributed_lifetime": 80000,
            "ra_contributed_this_year": 30000,
            "assets": [
                {"name": "Allan Gray TFSA", "value": 80000, "category": "retirement"},
                {"name": "FNB Savings", "value": 50000, "category": "cash"},
                {"name": "Primary Home", "value": 1800000, "category": "property"},
            ],
            "liabilities": [
                {"name": "Home Loan", "balance": 1200000, "monthly_payment": 12500},
            ],
        }
        r = s.put(f"{API}/me/financial/profile", json=payload, headers=_auth(individual_token), timeout=20)
        assert r.status_code == 200, f"profile upsert failed: {r.status_code} {r.text}"
        assert r.json().get("success") is True

        # Verify history endpoint shows a snapshot
        h = s.get(f"{API}/me/financial/history", headers=_auth(individual_token), timeout=20)
        assert h.status_code == 200
        hist = h.json().get("history", [])
        assert len(hist) >= 1, "expected at least one snapshot after PUT"
        assert hist[-1]["net_worth"] == 80000 + 50000 + 1800000 - 1200000

    def test_preview_returns_payload(self, s, individual_token):
        """Now preview should return summary, recommendation, html."""
        r = s.get(f"{API}/me/digest/preview", headers=_auth(individual_token), timeout=60)
        assert r.status_code == 200, f"preview failed: {r.status_code} {r.text}"
        data = r.json()
        assert "summary" in data
        assert "recommendation" in data
        assert "html" in data
        assert isinstance(data["summary"], dict)
        s_obj = data["summary"]
        for k in ("first_name", "period", "net_worth", "total_assets", "total_liabilities",
                  "tfsa_used_this_year", "tfsa_annual_remaining", "ra_used_this_year", "ra_personal_cap"):
            assert k in s_obj, f"missing key {k} in summary"
        assert s_obj["net_worth"] == 80000 + 50000 + 1800000 - 1200000
        assert "<html" in data["html"].lower() or "<!doctype" in data["html"].lower()
        # recommendation can be empty string if LLM fails, but field must exist
        assert isinstance(data["recommendation"], str)

    def test_idempotent_snapshot_for_same_period(self, s, individual_token):
        """Saving profile again same month should NOT add a new row (upsert by period)."""
        h1 = s.get(f"{API}/me/financial/history", headers=_auth(individual_token), timeout=20)
        n1 = len(h1.json().get("history", []))
        payload = {
            "age": 35, "retirement_age": 65, "annual_income": 700000,
            "monthly_expenses": 25000,
            "tfsa_contributed_this_year": 20000, "tfsa_contributed_lifetime": 85000,
            "ra_contributed_this_year": 35000,
            "assets": [{"name": "Cash", "value": 130000, "category": "cash"}],
            "liabilities": [],
        }
        r = s.put(f"{API}/me/financial/profile", json=payload, headers=_auth(individual_token), timeout=20)
        assert r.status_code == 200
        h2 = s.get(f"{API}/me/financial/history", headers=_auth(individual_token), timeout=20)
        n2 = len(h2.json().get("history", []))
        assert n2 == n1, f"snapshot count grew {n1}→{n2} for same period — idempotency broken"


# ---------- /me/digest/send ----------
class TestDigestSend:
    def test_send_success(self, s, individual_token):
        r = s.post(f"{API}/me/digest/send", headers=_auth(individual_token), timeout=60)
        # Either Resend send works (200) or env-related 502 — both informative
        if r.status_code == 200:
            data = r.json()
            assert data.get("success") is True
            assert "email_id" in data
            assert "sent_to" in data
        else:
            # Surface the actual error for the report
            assert r.status_code == 502, f"unexpected status {r.status_code}: {r.text}"
            pytest.skip(f"Resend send returned 502 (env constraints): {r.text}")

    def test_send_unauth(self, s):
        r = s.post(f"{API}/me/digest/send", timeout=15)
        assert r.status_code in (401, 403)

    def test_preview_unauth(self, s):
        r = s.get(f"{API}/me/digest/preview", timeout=15)
        assert r.status_code in (401, 403)


# ---------- Regression: advisor accessing digest ----------
class TestAdvisorOnDigest:
    def test_advisor_can_call_preview_endpoint(self, s, advisor_token):
        """Digest uses get_current_user (any role). Advisor should hit it; will be 400 if no snapshot, 200 if snapshot exists. Either is acceptable — just not 403."""
        r = s.get(f"{API}/me/digest/preview", headers=_auth(advisor_token), timeout=60)
        assert r.status_code in (200, 400), f"advisor should be able to hit digest preview, got {r.status_code}: {r.text}"


# ---------- Regression: advisor-only endpoints still 403 for individuals ----------
class TestRoleGatingRegression:
    @pytest.mark.parametrize("path", [
        "/reports",
        "/emails",
        "/compliance",
        "/portfolio-review",
        "/clients",
    ])
    def test_individual_blocked_from_advisor_routes(self, s, individual_token, path):
        r = s.get(f"{API}{path}", headers=_auth(individual_token), timeout=15)
        assert r.status_code == 403, f"{path} should 403 for individual, got {r.status_code}"
        assert "advisor" in r.text.lower()


# ---------- Pricing tiers regression ----------
class TestPricingTiers:
    def test_pricing_endpoint(self, s):
        """If the backend exposes /api/subscriptions/plans (or similar), check 3 tiers."""
        # Try common endpoints
        for path in ("/subscriptions/plans", "/pricing", "/plans"):
            r = s.get(f"{API}{path}", timeout=15)
            if r.status_code == 200:
                body = r.json()
                # Accept any reasonable shape
                txt = str(body).lower()
                assert "free" in txt or "individual" in txt or "advisor" in txt
                return
        pytest.skip("No pricing API endpoint found — pricing is likely frontend-only constants.")
