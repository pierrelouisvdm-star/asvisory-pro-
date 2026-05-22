"""
Tests for the Individual / Advisor workspace role split.
Covers:
- register with role
- /me returns role
- /set-role (valid, invalid, already-set)
- login response includes role
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _unique_email(prefix="TEST_role"):
    return f"{prefix}_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- register with role ---
class TestRegisterRole:
    def test_register_individual_includes_role(self, session):
        email = _unique_email("TEST_ind")
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "Ind User", "role": "individual"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["role"] == "individual"
        assert data["user"]["email"].lower() == email.lower()

    def test_register_advisor_includes_role(self, session):
        email = _unique_email("TEST_adv")
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "Adv User", "role": "advisor"
        })
        assert r.status_code == 200, r.text
        assert r.json()["user"]["role"] == "advisor"

    def test_register_without_role_stores_null(self, session):
        email = _unique_email("TEST_noroleA")
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "No Role"
        })
        assert r.status_code == 200, r.text
        # role should be None / missing / null
        assert r.json()["user"].get("role") in (None, "")


# --- /me returns role ---
class TestMeRole:
    def test_me_returns_role_for_individual(self, session):
        email = _unique_email("TEST_meind")
        reg = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "X", "role": "individual"
        })
        token = reg.json()["access_token"]
        me = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["role"] == "individual"

    def test_me_returns_null_when_no_role(self, session):
        email = _unique_email("TEST_menorole")
        reg = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "X"
        })
        token = reg.json()["access_token"]
        me = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json().get("role") in (None, "")


# --- /set-role ---
class TestSetRole:
    def _register_no_role(self, session, prefix="TEST_sr"):
        email = _unique_email(prefix)
        reg = session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "SR User"
        })
        assert reg.status_code == 200, reg.text
        return reg.json()["access_token"], email

    def test_set_role_advisor_success(self, session):
        token, _ = self._register_no_role(session, "TEST_setadv")
        r = session.post(f"{API}/auth/set-role",
                         json={"role": "advisor"},
                         headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "advisor"
        # confirm via /me
        me = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.json()["role"] == "advisor"

    def test_set_role_individual_success(self, session):
        token, _ = self._register_no_role(session, "TEST_setind")
        r = session.post(f"{API}/auth/set-role",
                         json={"role": "individual"},
                         headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["role"] == "individual"

    def test_set_role_invalid_value_rejected(self, session):
        token, _ = self._register_no_role(session, "TEST_setbad")
        r = session.post(f"{API}/auth/set-role",
                         json={"role": "banana"},
                         headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 400
        body = r.json()
        assert "individual" in (body.get("detail") or "").lower() or "advisor" in (body.get("detail") or "").lower()

    def test_set_role_already_set_rejected(self, session):
        token, _ = self._register_no_role(session, "TEST_setdup")
        # first time
        r1 = session.post(f"{API}/auth/set-role",
                          json={"role": "advisor"},
                          headers={"Authorization": f"Bearer {token}"})
        assert r1.status_code == 200
        # second time should fail
        r2 = session.post(f"{API}/auth/set-role",
                          json={"role": "individual"},
                          headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 400
        assert "already set" in (r2.json().get("detail") or "").lower()

    def test_set_role_requires_auth(self, session):
        r = session.post(f"{API}/auth/set-role", json={"role": "advisor"})
        assert r.status_code in (401, 403)


# --- login response includes role ---
class TestLoginRole:
    def test_login_includes_role(self, session):
        email = _unique_email("TEST_loginrole")
        session.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!", "full_name": "Login", "role": "advisor"
        })
        r = session.post(f"{API}/auth/login", json={
            "email": email, "password": "Passw0rd!"
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body
        assert body["user"]["role"] == "advisor"
