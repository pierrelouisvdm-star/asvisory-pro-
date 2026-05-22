"""
Backend tests for My Money endpoints:
- GET  /api/me/financial/profile
- PUT  /api/me/financial/profile
- GET  /api/me/financial/dashboard
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# unique email per pytest run
TS = int(time.time())
USER_A = {"email": f"mm_test_a_{TS}@example.com", "password": "Passw0rd!", "full_name": "MM A"}
USER_B = {"email": f"mm_test_b_{TS}@example.com", "password": "Passw0rd!", "full_name": "MM B"}


def _register_and_login(payload):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/register", json={**payload, "role": "individual"})
    assert r.status_code in (200, 201, 400, 409), f"register failed: {r.status_code} {r.text}"
    # login
    r = s.post(f"{API}/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    assert token, f"no token in {body}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s, token


@pytest.fixture(scope="module")
def client_a():
    s, _ = _register_and_login(USER_A)
    return s


@pytest.fixture(scope="module")
def client_b():
    s, _ = _register_and_login(USER_B)
    return s


# ---------- AUTH ----------
def test_profile_requires_auth():
    r = requests.get(f"{API}/me/financial/profile")
    assert r.status_code in (401, 403)


def test_dashboard_requires_auth():
    r = requests.get(f"{API}/me/financial/dashboard")
    assert r.status_code in (401, 403)


def test_update_profile_requires_auth():
    r = requests.put(f"{API}/me/financial/profile", json={"age": 30})
    assert r.status_code in (401, 403)


# ---------- DEFAULTS ----------
def test_profile_defaults(client_a):
    r = client_a.get(f"{API}/me/financial/profile")
    assert r.status_code == 200, r.text
    p = r.json()
    assert p.get("tfsa_contributed_this_year") == 0
    assert p.get("retirement_age") == 65
    assert p.get("assets") == []
    assert p.get("liabilities") == []


# ---------- PUT + GET round-trip ----------
def test_put_then_get_round_trip(client_a):
    payload = {
        "age": 35,
        "retirement_age": 60,
        "annual_income": 600000,
        "monthly_expenses": 25000,
        "risk_profile": "Moderate",
        "tfsa_contributed_this_year": 12000,
        "tfsa_contributed_lifetime": 120000,
        "ra_contributed_this_year": 50000,
        "assets": [
            {"name": "Allan Gray TFSA", "value": 120000, "category": "retirement"},
            {"name": "Cape Town Flat", "value": 1500000, "category": "property"},
            {"name": "FNB Savings", "value": 50000, "category": "cash"},
        ],
        "liabilities": [
            {"name": "Home loan", "balance": 800000, "monthly_payment": 9000},
        ],
    }
    r = client_a.put(f"{API}/me/financial/profile", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("success") is True
    assert body["profile"]["age"] == 35

    r2 = client_a.get(f"{API}/me/financial/profile")
    assert r2.status_code == 200
    p = r2.json()
    assert p["age"] == 35
    assert p["annual_income"] == 600000
    assert len(p["assets"]) == 3
    assert len(p["liabilities"]) == 1


# ---------- DASHBOARD COMPUTATIONS ----------
def test_dashboard_full_shape(client_a):
    r = client_a.get(f"{API}/me/financial/dashboard")
    assert r.status_code == 200, r.text
    d = r.json()
    for key in ("profile", "tfsa", "ra", "net_worth", "retirement_readiness"):
        assert key in d, f"missing {key}"

    # TFSA constants
    assert d["tfsa"]["annual_limit"] == 36000
    assert d["tfsa"]["lifetime_limit"] == 500000
    assert d["tfsa"]["annual_pct"] == round(12000 / 36000 * 100, 1)
    assert d["tfsa"]["annual_remaining"] == 36000 - 12000

    # RA: income 600000 -> personal_cap = 165000
    assert d["ra"]["deduction_rate"] == 0.275
    assert d["ra"]["deduction_cap"] == 350000
    assert d["ra"]["personal_cap"] == 165000.0
    assert d["ra"]["used_pct"] == round(50000 / 165000 * 100, 1)

    # Net worth + allocation
    nw = d["net_worth"]
    assert nw["total_assets"] == 1670000
    assert nw["total_liabilities"] == 800000
    assert nw["net_worth"] == 870000
    alloc = nw["allocation"]
    assert alloc.get("retirement") == 120000
    assert alloc.get("property") == 1500000
    assert alloc.get("cash") == 50000

    # Readiness: with age=35, ret=60, expenses=25000 -> ratio computed
    rr = d["retirement_readiness"]
    assert rr["label"] in ("On Track", "Almost There", "Catching Up", "Behind")
    assert rr["years_remaining"] == 25
    assert rr["pct"] is not None


def test_dashboard_insufficient_data(client_b):
    # client_b has no profile yet -> defaults => insufficient
    r = client_b.get(f"{API}/me/financial/dashboard")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["retirement_readiness"]["label"] == "Insufficient data"
    assert d["net_worth"]["total_assets"] == 0
    assert d["net_worth"]["total_liabilities"] == 0
    # RA personal_cap when no income -> falls back to 350000 cap
    assert d["ra"]["personal_cap"] == 350000


# ---------- USER ISOLATION ----------
def test_user_isolation(client_b):
    # client_b should not see client_a's data
    r = client_b.get(f"{API}/me/financial/profile")
    assert r.status_code == 200
    p = r.json()
    # b has not saved anything -> defaults
    assert p.get("age") in (None,)
    assert p.get("annual_income") in (None, 0)
    assert p.get("assets") == []
