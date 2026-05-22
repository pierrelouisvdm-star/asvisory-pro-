"""
Backend tests for IRP5 Vault feature.
- POST /api/me/irp5/upload (AI parse + storage)
- GET /api/me/irp5/list
- GET /api/me/irp5/{id}
- GET /api/me/irp5/{id}/download (header + ?auth=)
- DELETE /api/me/irp5/{id}
- Validation: bad extension, empty file, oversize
- Cross-user 404, unauthenticated 401
- Regression: advisor + individual both allowed (no role gate)
"""
import io
import os
import time
import requests
import pytest

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASS = "Scorpio@57!!"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _build_irp5_pdf() -> bytes:
    """Generate a realistic-looking IRP5 PDF for AI parsing."""
    if fitz is None:
        pytest.skip("PyMuPDF not installed")
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "SOUTH AFRICAN REVENUE SERVICE\n"
        "IRP5 / IT3(a) EMPLOYEES TAX CERTIFICATE\n"
        "\n"
        "Tax year: 2025\n"
        "Employer name: ACME (PTY) LTD\n"
        "PAYE reference: 7012345678\n"
        "Employee: John Smith\n"
        "ID: 8001015009087\n"
        "\n"
        "INCOME RECEIVED\n"
        "3601 Income (Taxable):        R 540 000.00\n"
        "3605 Annual payment:          R  20 000.00\n"
        "3697 Gross retirement-funding:R 540 000.00\n"
        "\n"
        "DEDUCTIONS / CONTRIBUTIONS\n"
        "4001 Pension fund:            R  35 000.00\n"
        "4006 Retirement annuity:      R  25 000.00\n"
        "4005 Medical aid:             R  18 000.00\n"
        "\n"
        "TAX PAID\n"
        "4102 PAYE:                    R  96 000.00\n"
        "4141 UIF:                     R   1 789.00\n"
        "4142 SDL:                     R   5 400.00\n"
        "\n"
        "Gross remuneration: R 560 000.00\n"
    )
    page.insert_text((50, 50), text, fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def advisor_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"advisor login failed: {r.status_code} {r.text}"
    body = r.json()
    return body.get("access_token") or body.get("token")


@pytest.fixture(scope="module")
def individual_token(s):
    ts = int(time.time())
    email = f"ind_irp5_{ts}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!",
        "full_name": "IRP5 Tester", "role": "individual",
    }, timeout=20)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    assert token
    return token


@pytest.fixture(scope="module")
def individual_token_2(s):
    """Second individual user to test cross-user isolation."""
    ts = int(time.time())
    email = f"ind_irp5b_{ts}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!",
        "full_name": "IRP5 Tester 2", "role": "individual",
    }, timeout=20)
    assert r.status_code in (200, 201)
    body = r.json()
    return body.get("access_token") or body.get("token")


@pytest.fixture(scope="module")
def pdf_bytes():
    return _build_irp5_pdf()


# Container to share doc_id across tests
class _State:
    doc_id = None
    storage_path = None


state = _State()


# ----- Upload + parse -----
class TestUploadAndParse:
    def test_upload_pdf_returns_document_and_parsed(self, s, individual_token, pdf_bytes):
        files = {"file": ("test_irp5.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        r = s.post(f"{API}/me/irp5/upload", headers=_auth(individual_token), files=files, timeout=120)
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["success"] is True
        doc = data["document"]
        assert doc["id"]
        assert doc["original_filename"] == "test_irp5.pdf"
        assert doc["extension"] == "pdf"
        assert doc["storage_path"].endswith(".pdf")
        assert "parsed" in doc
        parsed = doc["parsed"]
        # Endpoint must NOT 5xx if parse fails — error field is allowed
        if parsed.get("error"):
            pytest.skip(f"AI returned parse error (non-fatal, allowed): {parsed.get('error')}")
        # At least one source code should be populated
        income = parsed.get("income_received") or {}
        deductions = parsed.get("deductions") or {}
        tax = parsed.get("tax_paid") or {}
        flat = {**income, **deductions, **tax}
        non_null = [v for v in flat.values() if v not in (None, 0, "", "0")]
        assert len(non_null) >= 1, f"AI parse should populate >=1 source code, got: {flat}"
        state.doc_id = doc["id"]
        state.storage_path = doc["storage_path"]


# ----- Validation -----
class TestValidation:
    def test_reject_unsupported_extension(self, s, individual_token):
        files = {"file": ("notes.docx", io.BytesIO(b"PK\x03\x04 fake docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        r = s.post(f"{API}/me/irp5/upload", headers=_auth(individual_token), files=files, timeout=30)
        assert r.status_code == 400
        assert "unsupported" in r.text.lower() or "allowed" in r.text.lower()

    def test_reject_empty_file(self, s, individual_token):
        files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
        r = s.post(f"{API}/me/irp5/upload", headers=_auth(individual_token), files=files, timeout=30)
        assert r.status_code == 400
        assert "empty" in r.text.lower()

    def test_reject_oversized_file(self, s, individual_token):
        big = b"%PDF-1.4\n" + b"a" * (16 * 1024 * 1024)  # > 15MB
        files = {"file": ("huge.pdf", io.BytesIO(big), "application/pdf")}
        r = s.post(f"{API}/me/irp5/upload", headers=_auth(individual_token), files=files, timeout=120)
        assert r.status_code == 400
        assert "large" in r.text.lower() or "15" in r.text


# ----- List / Get / Download -----
class TestListGetDownload:
    def test_list_returns_uploaded(self, s, individual_token):
        assert state.doc_id, "upload test must have run first"
        r = s.get(f"{API}/me/irp5/list", headers=_auth(individual_token), timeout=20)
        assert r.status_code == 200
        body = r.json()
        ids = [d["id"] for d in body.get("documents", [])]
        assert state.doc_id in ids
        assert body.get("total", 0) >= 1

    def test_get_single_doc(self, s, individual_token):
        r = s.get(f"{API}/me/irp5/{state.doc_id}", headers=_auth(individual_token), timeout=20)
        assert r.status_code == 200
        doc = r.json()
        assert doc["id"] == state.doc_id
        assert doc.get("user_id")
        assert "_id" not in doc, "raw Mongo _id leaked"

    def test_get_cross_user_404(self, s, individual_token_2):
        r = s.get(f"{API}/me/irp5/{state.doc_id}", headers=_auth(individual_token_2), timeout=20)
        assert r.status_code == 404

    def test_download_with_query_auth(self, s, individual_token, pdf_bytes):
        url = f"{API}/me/irp5/{state.doc_id}/download?auth={individual_token}"
        r = s.get(url, timeout=60)
        assert r.status_code == 200, f"download failed: {r.status_code} {r.text[:200]}"
        assert "pdf" in (r.headers.get("Content-Type", "").lower())
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower()
        assert "test_irp5.pdf" in cd
        # Body should be non-empty PDF bytes (storage round-trip)
        assert len(r.content) > 100
        assert r.content[:4] == b"%PDF"

    def test_download_with_bearer_header(self, s, individual_token):
        r = s.get(f"{API}/me/irp5/{state.doc_id}/download", headers=_auth(individual_token), timeout=60)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_download_unauthenticated_returns_401(self, s):
        r = s.get(f"{API}/me/irp5/{state.doc_id}/download", timeout=20)
        assert r.status_code == 401

    def test_download_cross_user_404(self, s, individual_token_2):
        r = s.get(f"{API}/me/irp5/{state.doc_id}/download", headers=_auth(individual_token_2), timeout=20)
        assert r.status_code == 404


# ----- Delete -----
class TestDelete:
    def test_delete_first_call_succeeds(self, s, individual_token):
        r = s.delete(f"{API}/me/irp5/{state.doc_id}", headers=_auth(individual_token), timeout=20)
        assert r.status_code == 200
        assert r.json().get("success") is True

    def test_delete_second_call_404(self, s, individual_token):
        r = s.delete(f"{API}/me/irp5/{state.doc_id}", headers=_auth(individual_token), timeout=20)
        assert r.status_code == 404

    def test_list_excludes_deleted(self, s, individual_token):
        r = s.get(f"{API}/me/irp5/list", headers=_auth(individual_token), timeout=20)
        assert r.status_code == 200
        ids = [d["id"] for d in r.json().get("documents", [])]
        assert state.doc_id not in ids


# ----- Unauthenticated access -----
class TestUnauth:
    def test_list_unauth(self, s):
        r = s.get(f"{API}/me/irp5/list", timeout=15)
        assert r.status_code in (401, 403)

    def test_upload_unauth(self, s):
        files = {"file": ("x.pdf", io.BytesIO(b"%PDF-1.4\n%"), "application/pdf")}
        r = s.post(f"{API}/me/irp5/upload", files=files, timeout=20)
        assert r.status_code in (401, 403)


# ----- Role regression: no role gate on irp5; advisor can also use -----
class TestNoRoleGate:
    def test_advisor_can_upload_and_list(self, s, advisor_token, pdf_bytes):
        files = {"file": ("advisor_irp5.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        r = s.post(f"{API}/me/irp5/upload", headers=_auth(advisor_token), files=files, timeout=120)
        assert r.status_code == 200, f"advisor upload should succeed: {r.status_code} {r.text}"
        adv_doc_id = r.json()["document"]["id"]

        r2 = s.get(f"{API}/me/irp5/list", headers=_auth(advisor_token), timeout=20)
        assert r2.status_code == 200
        assert any(d["id"] == adv_doc_id for d in r2.json().get("documents", []))

        # cleanup
        s.delete(f"{API}/me/irp5/{adv_doc_id}", headers=_auth(advisor_token), timeout=20)


# ----- Regression: Digest + advisor route still work -----
class TestRegression:
    def test_digest_preview_still_reachable_for_individual(self, s, individual_token):
        r = s.get(f"{API}/me/digest/preview", headers=_auth(individual_token), timeout=30)
        # Either 200 or 400 (no snapshot) — but never 5xx and never 403
        assert r.status_code in (200, 400), f"digest preview broke: {r.status_code} {r.text}"

    def test_individual_blocked_from_advisor_routes(self, s, individual_token):
        r = s.get(f"{API}/reports", headers=_auth(individual_token), timeout=15)
        assert r.status_code == 403
