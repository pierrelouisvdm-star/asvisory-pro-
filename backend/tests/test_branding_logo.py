"""Tests for /api/reports/branding/logo POST/DELETE endpoints (advisor-only)."""
import os
import io
import base64
import uuid
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
ADVISOR_EMAIL = "pierrelouisvdm@gmail.com"
ADVISOR_PASS = "Scorpio@57!!"


def _png_bytes(size=(8, 8)):
    img = Image.new("RGB", size, (16, 185, 129))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def advisor_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADVISOR_EMAIL, "password": ADVISOR_PASS})
    if r.status_code != 200:
        pytest.skip(f"Advisor login failed: {r.status_code}")
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def individual_token():
    email = f"TEST_ind_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "TEST Ind", "name": "TEST Ind", "company": "", "role": "individual"},
    )
    if r.status_code not in (200, 201):
        pytest.skip(f"Individual register failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


# ---- Advisor: happy path upload ----
def test_advisor_upload_logo_returns_data_uri(advisor_token):
    png = _png_bytes()
    r = requests.post(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {advisor_token}"},
        files={"file": ("logo.png", png, "image/png")},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["success"] is True
    assert data["logo_url"].startswith("data:image/png;base64,")
    assert data["size"] == len(png)
    # verify base64 round-trip
    b64 = data["logo_url"].split(",", 1)[1]
    assert base64.b64decode(b64) == png


def test_get_branding_includes_logo(advisor_token):
    r = requests.get(
        f"{BASE_URL}/api/reports/branding",
        headers={"Authorization": f"Bearer {advisor_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("logo_url", "").startswith("data:image/png;base64,")


# ---- Validation errors ----
def test_empty_file_400(advisor_token):
    r = requests.post(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {advisor_token}"},
        files={"file": ("empty.png", b"", "image/png")},
    )
    assert r.status_code == 400, r.text


def test_unsupported_extension_400(advisor_token):
    r = requests.post(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {advisor_token}"},
        files={"file": ("logo.pdf", b"%PDF-1.4\n", "application/pdf")},
    )
    assert r.status_code == 400


def test_file_too_large_400(advisor_token):
    big = b"\x00" * (501 * 1024)
    r = requests.post(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {advisor_token}"},
        files={"file": ("big.png", big, "image/png")},
    )
    assert r.status_code == 400


# ---- DELETE clears the logo ----
def test_delete_logo_clears(advisor_token):
    # ensure one exists
    png = _png_bytes()
    requests.post(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {advisor_token}"},
        files={"file": ("logo.png", png, "image/png")},
    )
    r = requests.delete(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {advisor_token}"},
    )
    assert r.status_code == 200
    g = requests.get(
        f"{BASE_URL}/api/reports/branding",
        headers={"Authorization": f"Bearer {advisor_token}"},
    )
    assert g.json().get("logo_url", "") == ""


# ---- Individual users blocked ----
def test_individual_cannot_upload_logo(individual_token):
    png = _png_bytes()
    r = requests.post(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {individual_token}"},
        files={"file": ("logo.png", png, "image/png")},
    )
    assert r.status_code == 403, r.text


def test_individual_cannot_delete_logo(individual_token):
    r = requests.delete(
        f"{BASE_URL}/api/reports/branding/logo",
        headers={"Authorization": f"Bearer {individual_token}"},
    )
    assert r.status_code == 403


# ---- PUT branding regression ----
def test_put_branding_still_works(advisor_token):
    payload = {
        "firm_name": "TEST_Firm",
        "advisor_name": "TEST Advisor",
        "primary_color": "#6366f1",
        "fsp_number": "FSP 99999",
        "disclaimer": "TEST disclaimer",
    }
    r = requests.put(
        f"{BASE_URL}/api/reports/branding",
        headers={"Authorization": f"Bearer {advisor_token}"},
        json=payload,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    g = requests.get(
        f"{BASE_URL}/api/reports/branding",
        headers={"Authorization": f"Bearer {advisor_token}"},
    )
    assert g.json()["firm_name"] == "TEST_Firm"
    assert g.json()["fsp_number"] == "FSP 99999"


# ---- IRP5 + Digest regression for individual ----
def test_irp5_list_for_individual(individual_token):
    r = requests.get(
        f"{BASE_URL}/api/me/irp5/list",
        headers={"Authorization": f"Bearer {individual_token}"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "documents" in data or "items" in data or isinstance(data, list) or "irp5s" in data


def test_digest_preview_for_individual(individual_token):
    r = requests.get(
        f"{BASE_URL}/api/me/digest/preview",
        headers={"Authorization": f"Bearer {individual_token}"},
    )
    # 200 if snapshot exists, 400 with "save profile" message if fresh — both prove endpoint is reachable
    assert r.status_code in (200, 400), r.text
