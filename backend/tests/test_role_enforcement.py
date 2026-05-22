"""
Test server-side advisor-only enforcement on advisor endpoints.

Verifies that the new `require_advisor` FastAPI dependency (applied via Python
import alias trick in 7 advisor route files) correctly returns:
- 403 for authenticated Individual users
- 200 for authenticated Advisor/Admin users
- 401 for unauthenticated requests
- 200 for shared endpoints (documents, my_money) regardless of role
"""
import os
import time
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")

INDIVIDUAL_EMAIL = "ind_test_1779457267@example.com"
INDIVIDUAL_PASSWORD = "Passw0rd!"
ADVISOR_EMAIL = "pierrelouisvdm@gmail.com"
ADVISOR_PASSWORD = "Scorpio@57!!"

EXPECTED_403_DETAIL = "This endpoint is for financial advisors only."


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def individual_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": INDIVIDUAL_EMAIL, "password": INDIVIDUAL_PASSWORD
    }, timeout=15)
    assert r.status_code == 200, f"Individual login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def advisor_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADVISOR_EMAIL, "password": ADVISOR_PASSWORD
    }, timeout=15)
    assert r.status_code == 200, f"Advisor login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def no_role_token():
    """Register a fresh user without explicit role → server defaults role to None/individual.
    We verify it still gets 403 on advisor endpoints."""
    ts = int(time.time())
    email = f"norole_test_{ts}@example.com"
    payload = {"email": email, "password": "Passw0rd!", "full_name": "No Role"}
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=15)
    if r.status_code not in (200, 201):
        pytest.skip(f"Could not register no-role user: {r.status_code} {r.text}")
    data = r.json()
    if "access_token" in data:
        return data["access_token"]
    # Fall back to login if register doesn't return token
    r2 = requests.post(f"{BASE_URL}/api/auth/login",
                       json={"email": email, "password": "Passw0rd!"}, timeout=15)
    assert r2.status_code == 200
    return r2.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Advisor-only GET endpoints ----------

ADVISOR_GET_ENDPOINTS = [
    "/api/clients",
    "/api/reports",
    "/api/emails",
    "/api/compliance",
    "/api/portfolio-review",
    "/api/smart-suggestions/all",
    "/api/client-360/some-random-id-12345",
]


@pytest.mark.parametrize("path", ADVISOR_GET_ENDPOINTS)
def test_individual_gets_403_on_advisor_get(individual_token, path):
    r = requests.get(f"{BASE_URL}{path}", headers=_auth(individual_token), timeout=15)
    assert r.status_code == 403, f"Expected 403 for {path}, got {r.status_code}: {r.text}"
    body = r.json()
    assert body.get("detail") == EXPECTED_403_DETAIL, (
        f"Wrong detail for {path}: {body}"
    )


@pytest.mark.parametrize("path", ADVISOR_GET_ENDPOINTS)
def test_advisor_gets_200_on_advisor_get(advisor_token, path):
    r = requests.get(f"{BASE_URL}{path}", headers=_auth(advisor_token), timeout=20)
    # client-360/{random_id} might return 404 (not found) which still proves the 403 guard passed.
    if path.startswith("/api/client-360/"):
        assert r.status_code in (200, 404), f"Advisor unexpectedly blocked on {path}: {r.status_code} {r.text}"
    else:
        assert r.status_code == 200, f"Advisor blocked on {path}: {r.status_code} {r.text}"


@pytest.mark.parametrize("path", ADVISOR_GET_ENDPOINTS)
def test_unauthenticated_gets_401_or_403(path):
    """Missing token → 401 (or 403 from HTTPBearer auto_error). Either is acceptable."""
    r = requests.get(f"{BASE_URL}{path}", timeout=15)
    assert r.status_code in (401, 403), f"Expected 401/403 for {path} unauthenticated, got {r.status_code}"
    # And critically, must NOT be the advisor-only detail (that requires a valid token).
    if r.status_code == 403:
        body = r.json()
        assert body.get("detail") != EXPECTED_403_DETAIL, (
            f"Unauthenticated {path} incorrectly returns advisor-only detail (should be missing-auth)"
        )


def test_no_role_user_gets_403(no_role_token):
    """A freshly-registered user (no advisor role) should be blocked from advisor endpoints."""
    r = requests.get(f"{BASE_URL}/api/clients", headers=_auth(no_role_token), timeout=15)
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"
    assert r.json().get("detail") == EXPECTED_403_DETAIL


# ---------- Advisor-only WRITE endpoints (POST) ----------

ADVISOR_POST_ENDPOINTS = [
    ("/api/clients", {"full_name": "TEST_Client", "email": "test@x.com"}),
    ("/api/reports/generate", {"client_id": "abc", "report_type": "summary"}),
    ("/api/emails/generate", {"client_id": "abc", "purpose": "intro"}),
    ("/api/compliance/generate", {"client_id": "abc", "meeting_notes": "x"}),
    ("/api/portfolio-review/generate", {"client_id": "abc"}),
]


@pytest.mark.parametrize("path,payload", ADVISOR_POST_ENDPOINTS)
def test_individual_gets_403_on_advisor_post(individual_token, path, payload):
    r = requests.post(f"{BASE_URL}{path}", json=payload, headers=_auth(individual_token), timeout=15)
    assert r.status_code == 403, f"Expected 403 for POST {path}, got {r.status_code}: {r.text}"
    body = r.json()
    assert body.get("detail") == EXPECTED_403_DETAIL, f"Wrong detail for POST {path}: {body}"


# ---------- Shared endpoints (must remain 200 for individual) ----------

SHARED_GET_ENDPOINTS = [
    "/api/documents/analyses",
    "/api/me/financial/profile",
    "/api/me/financial/dashboard",
    "/api/me/financial/history",
]


@pytest.mark.parametrize("path", SHARED_GET_ENDPOINTS)
def test_individual_gets_200_on_shared_endpoint(individual_token, path):
    r = requests.get(f"{BASE_URL}{path}", headers=_auth(individual_token), timeout=20)
    assert r.status_code == 200, f"Shared endpoint {path} blocked for individual: {r.status_code} {r.text}"
