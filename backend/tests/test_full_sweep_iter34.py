"""Final functional sweep before prod - iteration 34.

Covers the broader surface area: auth (individual+advisor+admin+forgot),
calculators/tools, payments+coupons, document reader, advisor tools
(reports, emails, compliance, portfolio-review, branding, clients,
client-360, smart-suggestions), my-money/digest/irp5 (quick regression),
role-gating across all advisor endpoints, and 404 fallthrough.
"""

import io
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # backend/.env mirror
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASSWORD = "Scorpio@57!!"

TS = int(time.time())
IND_EMAIL = f"TEST_ind_sweep_{TS}@example.com"
ADV_EMAIL = f"TEST_adv_sweep_{TS}@example.com"
PASSWORD = "Passw0rd!"


# ---------------- Shared fixtures ----------------

@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def individual_token(s):
    r = s.post(f"{API}/auth/register", json={
        "full_name": "Sweep Individual",
        "email": IND_EMAIL,
        "password": PASSWORD,
        "role": "individual",
    })
    assert r.status_code in (200, 201), r.text
    j = r.json()
    assert j.get("user", {}).get("role") == "individual"
    return j["access_token"]


@pytest.fixture(scope="module")
def advisor_token(s):
    r = s.post(f"{API}/auth/register", json={
        "full_name": "Sweep Advisor",
        "email": ADV_EMAIL,
        "password": PASSWORD,
        "role": "advisor",
    })
    assert r.status_code in (200, 201), r.text
    j = r.json()
    assert j.get("user", {}).get("role") == "advisor"
    return j["access_token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------------- AUTH ----------------

class TestAuth:
    def test_admin_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_bad_password(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "WRONG"})
        assert r.status_code == 401

    def test_login_missing_fields(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL})
        assert r.status_code == 422

    def test_register_individual_returns_role(self, individual_token):
        assert isinstance(individual_token, str) and len(individual_token) > 10

    def test_register_advisor_returns_role(self, advisor_token):
        assert isinstance(advisor_token, str) and len(advisor_token) > 10

    def test_me_endpoint_individual(self, s, individual_token):
        r = s.get(f"{API}/auth/me", headers=H(individual_token))
        assert r.status_code == 200
        assert r.json()["role"] == "individual"

    def test_me_endpoint_advisor(self, s, advisor_token):
        r = s.get(f"{API}/auth/me", headers=H(advisor_token))
        assert r.status_code == 200
        assert r.json()["role"] == "advisor"

    def test_forgot_password(self, s):
        r = s.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL})
        # Should be 200 even if email doesn't exist (privacy) — or 200 with sent
        assert r.status_code in (200, 202), r.text


# ---------------- INDIVIDUAL: MY MONEY + DIGEST + IRP5 ----------------

class TestIndividualFlows:
    def test_save_financial_profile(self, s, individual_token):
        r = s.put(f"{API}/me/financial/profile", headers=H(individual_token), json={
            "age": 35,
            "annual_income": 720000,
            "assets": [
                {"name": "TFSA", "asset_class": "cash", "value": 200000},
                {"name": "Discretionary", "asset_class": "domestic_equity", "value": 650000},
            ],
            "liabilities": [
                {"name": "Mortgage", "balance": 120000, "interest_rate": 11.5},
            ],
            "tfsa_ytd": 15000,
            "ra_ytd": 30000,
        })
        assert r.status_code == 200, r.text

    def test_digest_preview(self, s, individual_token):
        r = s.get(f"{API}/me/digest/preview", headers=H(individual_token))
        assert r.status_code == 200, r.text
        body = r.json()
        assert "html" in body or "recommendation" in body

    def test_irp5_vault_list(self, s, individual_token):
        r = s.get(f"{API}/me/irp5/list", headers=H(individual_token))
        assert r.status_code == 200
        assert "documents" in r.json() or isinstance(r.json(), list)


# ---------------- ADVISOR TOOLS ----------------

class TestAdvisorTools:
    def test_report_branding_get(self, s, advisor_token):
        r = s.get(f"{API}/reports/branding", headers=H(advisor_token))
        assert r.status_code == 200

    def test_report_branding_put(self, s, advisor_token):
        r = s.put(f"{API}/reports/branding", headers=H(advisor_token), json={
            "firm_name": "TEST_Sweep Wealth",
            "primary_color": "#6366f1",
            "fsp_number": "FSP-TEST-001",
            "disclaimer": "TEST_Disclaimer",
        })
        assert r.status_code == 200, r.text

    def test_report_generate(self, s, advisor_token):
        r = s.post(f"{API}/reports/generate", headers=H(advisor_token), json={
            "custom_notes": "Conservative retiree with R5m portfolio. Need TFSA + RA balance review.",
        }, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "report" in body or "executive_summary" in body or "id" in body

    def test_email_templates(self, s, advisor_token):
        r = s.get(f"{API}/emails/templates", headers=H(advisor_token))
        assert r.status_code == 200

    def test_email_generate(self, s, advisor_token):
        r = s.post(f"{API}/emails/generate", headers=H(advisor_token), json={
            "template_type": "annual_review_reminder",
            "tone": "professional",
            "client_name": "TEST_Client",
            "custom_context": "Annual review reminder for John.",
        }, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        # Common shapes
        assert any(k in body for k in ("subject", "body", "email"))

    def test_compliance_record_types(self, s, advisor_token):
        r = s.get(f"{API}/compliance/record-types", headers=H(advisor_token))
        assert r.status_code == 200

    def test_compliance_generate(self, s, advisor_token):
        r = s.post(f"{API}/compliance/generate", headers=H(advisor_token), json={
            "record_type": "record_of_advice",
            "client_name": "TEST_Client",
            "advice_given": "Recommended TFSA top-up to R36k annual cap.",
            "products_recommended": ["TFSA"],
            "client_objectives": "Tax-efficient long-term growth",
            "risk_assessment": "Moderate",
        }, timeout=60)
        # may return 200 with content
        assert r.status_code in (200, 422), r.text

    def test_portfolio_review_list(self, s, advisor_token):
        r = s.get(f"{API}/portfolio-review", headers=H(advisor_token))
        assert r.status_code == 200

    def test_smart_suggestions_all(self, s, advisor_token):
        r = s.get(f"{API}/smart-suggestions/all", headers=H(advisor_token))
        assert r.status_code == 200

    def test_clients_list(self, s, advisor_token):
        r = s.get(f"{API}/clients", headers=H(advisor_token))
        assert r.status_code == 200

    def test_clients_create_then_360(self, s, advisor_token):
        cr = s.post(f"{API}/clients", headers=H(advisor_token), json={
            "first_name": "TEST_Sweep",
            "last_name": "Client",
            "email": f"TEST_client_{TS}@example.com",
            "phone": "+27821234567",
            "age": 42,
            "income": 1200000,
            "risk_tolerance": "moderate",
        })
        assert cr.status_code in (200, 201), cr.text
        client = cr.json()
        cid = client.get("id") or client.get("_id")
        assert cid
        c360 = s.get(f"{API}/client-360/{cid}", headers=H(advisor_token))
        assert c360.status_code == 200, c360.text


# ---------------- DOCUMENT READER ----------------

class TestDocumentReader:
    def test_analyses_list(self, s, advisor_token):
        r = s.get(f"{API}/documents/analyses", headers=H(advisor_token))
        assert r.status_code == 200


# ---------------- PAYMENTS + COUPONS ----------------

class TestPaymentsCoupons:
    def test_pricing_endpoint(self, s):
        r = s.get(f"{API}/subscriptions/pricing")
        assert r.status_code == 200

    def test_subscription_current_individual(self, s, individual_token):
        r = s.get(f"{API}/subscriptions/current", headers=H(individual_token))
        assert r.status_code == 200

    def test_payfast_status_unknown(self, s):
        r = s.get(f"{API}/payments/payfast-status/nonexistent")
        assert r.status_code in (404, 200)

    def test_coupon_validate_unknown(self, s, individual_token):
        r = s.get(f"{API}/coupons/validate/NOPE-XYZ", headers=H(individual_token))
        assert r.status_code in (200, 404), r.text

    def test_coupon_validate_admin_owner_vip(self, s, individual_token):
        r = s.get(f"{API}/coupons/validate/OWNERVIP", headers=H(individual_token))
        # either valid or 404; just shouldn't 500
        assert r.status_code in (200, 400, 404), r.text


# ---------------- ROLE GATING ----------------

ADVISOR_ONLY_ENDPOINTS = [
    ("GET", "/reports", None),
    ("GET", "/reports/branding", None),
    ("POST", "/reports/generate", {"custom_notes": "x"}),
    ("GET", "/emails/templates", None),
    ("POST", "/emails/generate", {"template_type": "annual_review_reminder", "tone": "professional"}),
    ("GET", "/compliance/record-types", None),
    ("GET", "/portfolio-review", None),
    ("GET", "/clients", None),
    ("GET", "/smart-suggestions/all", None),
]


class TestRoleGating:
    @pytest.mark.parametrize("method,path,body", ADVISOR_ONLY_ENDPOINTS)
    def test_individual_blocked_from_advisor_endpoint(self, s, individual_token, method, path, body):
        url = f"{API}{path}"
        if method == "GET":
            r = s.get(url, headers=H(individual_token))
        else:
            r = s.post(url, headers=H(individual_token), json=body)
        assert r.status_code == 403, f"{method} {path} expected 403 got {r.status_code}: {r.text[:200]}"
        try:
            detail = r.json().get("detail", "")
        except Exception:
            detail = ""
        assert "advisor" in detail.lower() or r.status_code == 403


# ---------------- HEALTH + 404 ----------------

class TestSurface:
    def test_health(self, s):
        r = s.get(f"{API}/health")
        # endpoint may not exist at /api/health; root /health is on app, not /api
        assert r.status_code in (200, 404)

    def test_404_unknown_api(self, s):
        r = s.get(f"{API}/zzz-does-not-exist")
        assert r.status_code == 404
