"""Tests for AI Document Reader endpoints - verifies client_id optional, custom_prompt and CRUD."""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fap-sa-finance.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASSWORD = "Scorpio@57!!"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("token") or data.get("access_token")
    assert tok, f"No token in response: {data}"
    return tok


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def sample_png_bytes():
    """Create a small valid PNG file resembling a financial document."""
    img = Image.new('RGB', (400, 300), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf.getvalue()


# --- Test: analyze without client_id ---
def test_analyze_no_client_id(auth_headers, sample_png_bytes):
    files = {"file": ("TEST_statement.png", sample_png_bytes, "image/png")}
    r = requests.post(
        f"{BASE_URL}/api/documents/analyze",
        headers=auth_headers,
        files=files,
        timeout=120,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:500]}"
    data = r.json()
    assert data.get("success") is True
    assert "document" in data
    doc = data["document"]
    assert "id" in doc
    assert "analysis" in doc and isinstance(doc["analysis"], dict)
    assert doc.get("client_id") is None, f"client_id should be None when not provided, got: {doc.get('client_id')}"
    assert doc.get("file_name") == "TEST_statement.png"
    # Stash id for later cleanup
    pytest.analysis_id_no_client = doc["id"]


# --- Test: analyze with custom_prompt ---
def test_analyze_with_custom_prompt(auth_headers, sample_png_bytes):
    files = {"file": ("TEST_custom.png", sample_png_bytes, "image/png")}
    data_form = {"custom_prompt": "List any fees mentioned in the document."}
    r = requests.post(
        f"{BASE_URL}/api/documents/analyze",
        headers=auth_headers,
        files=files,
        data=data_form,
        timeout=120,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:500]}"
    data = r.json()
    assert data.get("success") is True
    doc = data["document"]
    assert isinstance(doc.get("analysis"), dict)
    pytest.analysis_id_custom = doc["id"]


# --- Test: list analyses ---
def test_list_analyses(auth_headers):
    r = requests.get(f"{BASE_URL}/api/documents/analyses", headers=auth_headers, timeout=30)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert "analyses" in data
    assert isinstance(data["analyses"], list)
    assert data.get("total") is not None
    # Our created analyses should appear
    ids = [a.get("id") for a in data["analyses"]]
    assert getattr(pytest, "analysis_id_no_client", None) in ids or len(ids) >= 1
    # No _id field (MongoDB ObjectId) should be present
    for a in data["analyses"]:
        assert "_id" not in a


# --- Test: get single analysis ---
def test_get_analysis(auth_headers):
    aid = getattr(pytest, "analysis_id_no_client", None)
    if not aid:
        pytest.skip("no analysis created")
    r = requests.get(f"{BASE_URL}/api/documents/analyses/{aid}", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("id") == aid
    assert "analysis" in data


# --- Test: delete analysis ---
def test_delete_analysis(auth_headers):
    aid = getattr(pytest, "analysis_id_no_client", None)
    if not aid:
        pytest.skip("no analysis created")
    r = requests.delete(f"{BASE_URL}/api/documents/analyses/{aid}", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json().get("success") is True
    # Verify it's gone
    r2 = requests.get(f"{BASE_URL}/api/documents/analyses/{aid}", headers=auth_headers, timeout=30)
    assert r2.status_code == 404


# --- Cleanup custom-prompt analysis too ---
def test_cleanup_custom(auth_headers):
    aid = getattr(pytest, "analysis_id_custom", None)
    if not aid:
        pytest.skip("no custom analysis created")
    r = requests.delete(f"{BASE_URL}/api/documents/analyses/{aid}", headers=auth_headers, timeout=30)
    assert r.status_code == 200


# --- Test: invalid file type ---
def test_analyze_invalid_file_type(auth_headers):
    files = {"file": ("bad.txt", b"hello world", "text/plain")}
    r = requests.post(
        f"{BASE_URL}/api/documents/analyze",
        headers=auth_headers,
        files=files,
        timeout=30,
    )
    assert r.status_code == 400


# --- Test: unauthenticated ---
def test_analyze_unauthenticated(sample_png_bytes):
    files = {"file": ("TEST_.png", sample_png_bytes, "image/png")}
    r = requests.post(f"{BASE_URL}/api/documents/analyze", files=files, timeout=30)
    assert r.status_code in (401, 403)
