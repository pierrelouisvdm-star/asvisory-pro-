"""Backend tests for AI Client Report Builder (/api/reports/*)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fap-sa-finance.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASSWORD = "Scorpio@57!!"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    t = data.get("token") or data.get("access_token")
    assert t, f"No token in response: {data}"
    return t


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---- Branding endpoints ----

class TestBranding:
    def test_get_branding_defaults(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports/branding", headers=headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        # Either default or persisted; key fields must exist
        assert "primary_color" in d
        assert "disclaimer" in d
        assert "firm_name" in d

    def test_put_branding_upserts(self, headers):
        payload = {
            "firm_name": "TEST_FirmName",
            "advisor_name": "Test Advisor",
            "advisor_email": "test@firm.co.za",
            "advisor_phone": "+27123456789",
            "logo_url": "",
            "primary_color": "#10B981",
            "disclaimer": "TEST disclaimer.",
            "fsp_number": "FSP 99999",
        }
        r = requests.put(f"{BASE_URL}/api/reports/branding", json=payload, headers=headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("success") is True
        assert d["branding"]["firm_name"] == "TEST_FirmName"
        assert d["branding"]["fsp_number"] == "FSP 99999"

        # verify persistence
        r2 = requests.get(f"{BASE_URL}/api/reports/branding", headers=headers, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["firm_name"] == "TEST_FirmName"


# ---- Generate endpoint ----

class TestGenerate:
    def test_generate_with_only_notes(self, headers):
        payload = {
            "report_type": "portfolio_review",
            "tone": "professional",
            "custom_notes": "Client 42 years old, R500k in RA, R100k in TFSA, retire at 60. Test only.",
            "document_analysis_ids": [],
        }
        r = requests.post(f"{BASE_URL}/api/reports/generate", json=payload, headers=headers, timeout=90)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        d = r.json()
        assert d.get("success") is True
        report = d["report"]
        assert "id" in report
        assert "content" in report
        c = report["content"]
        assert "title" in c
        # Stash for later cleanup
        pytest.generated_report_id = report["id"]

    def test_generate_empty_returns_400(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/reports/generate",
            json={"report_type": "portfolio_review", "tone": "professional", "document_analysis_ids": []},
            headers=headers, timeout=30,
        )
        assert r.status_code == 400

    def test_generate_invalid_client_404(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/reports/generate",
            json={"client_id": "nonexistent-id-xyz", "report_type": "portfolio_review", "tone": "professional", "document_analysis_ids": []},
            headers=headers, timeout=30,
        )
        assert r.status_code == 404


# ---- List / Get / Delete ----

class TestListGetDelete:
    def test_list_reports(self, headers):
        r = requests.get(f"{BASE_URL}/api/reports", headers=headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "reports" in d
        assert isinstance(d["reports"], list)
        assert d["total"] >= 1

    def test_get_single_report(self, headers):
        rid = getattr(pytest, "generated_report_id", None)
        assert rid, "No report id from previous test"
        r = requests.get(f"{BASE_URL}/api/reports/{rid}", headers=headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == rid

    def test_delete_report_and_verify_404(self, headers):
        rid = getattr(pytest, "generated_report_id", None)
        assert rid
        r = requests.delete(f"{BASE_URL}/api/reports/{rid}", headers=headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("success") is True
        # subsequent GET → 404
        r2 = requests.get(f"{BASE_URL}/api/reports/{rid}", headers=headers, timeout=15)
        assert r2.status_code == 404


class TestAuth:
    def test_unauthenticated_blocked(self):
        r = requests.get(f"{BASE_URL}/api/reports/branding", timeout=10)
        assert r.status_code in (401, 403)
