"""Backend tests for the Client 360 unified aggregation endpoint."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fin-advisor-pro-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASSWORD = "Scorpio@57!!"


# --- fixtures ---
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def second_advisor_token():
    """Register a second fresh advisor account to test cross-advisor isolation."""
    ts = int(time.time())
    email = f"TEST_adv_{ts}@example.com"
    payload = {
        "email": email,
        "password": "Passw0rd!",
        "full_name": "Test Advisor",
        "role": "advisor",
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=20)
    if r.status_code not in (200, 201):
        pytest.skip(f"second advisor register failed: {r.status_code} {r.text}")
    # Try login (some apps return token on register; this is safer)
    rl = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": "Passw0rd!"},
        timeout=20,
    )
    assert rl.status_code == 200, rl.text
    return rl.json()["access_token"]


@pytest.fixture(scope="session")
def test_client_id(admin_headers):
    """Create a fresh client for the admin and clean up afterwards."""
    payload = {
        "first_name": "TEST",
        "last_name": f"Client360_{int(time.time())}",
        "email": f"TEST_c360_{int(time.time())}@example.com",
        "phone": "+27123456789",
    }
    r = requests.post(f"{BASE_URL}/api/clients", json=payload, headers=admin_headers, timeout=20)
    assert r.status_code in (200, 201), r.text
    cid = r.json().get("id")
    assert cid
    yield cid
    # cleanup
    requests.delete(f"{BASE_URL}/api/clients/{cid}", headers=admin_headers, timeout=20)


# --- tests ---

# Auth & access
class TestClient360Access:
    def test_requires_auth(self, test_client_id):
        r = requests.get(f"{BASE_URL}/api/client-360/{test_client_id}", timeout=20)
        assert r.status_code in (401, 403), r.text

    def test_bogus_id_returns_404(self, admin_headers):
        bogus = str(uuid.uuid4())
        r = requests.get(f"{BASE_URL}/api/client-360/{bogus}", headers=admin_headers, timeout=20)
        assert r.status_code == 404
        assert "Client not found" in r.text

    def test_cross_advisor_isolation(self, test_client_id, second_advisor_token):
        # Second advisor should NOT see admin's client
        headers = {"Authorization": f"Bearer {second_advisor_token}"}
        r = requests.get(f"{BASE_URL}/api/client-360/{test_client_id}", headers=headers, timeout=20)
        assert r.status_code == 404, f"Cross-advisor access leak! {r.status_code} {r.text}"


# Shape
class TestClient360Shape:
    def test_valid_returns_full_shape(self, admin_headers, test_client_id):
        r = requests.get(f"{BASE_URL}/api/client-360/{test_client_id}", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()

        # top level
        for k in ["client", "counts", "documents", "reports", "emails",
                  "compliance", "portfolio_reviews", "timeline"]:
            assert k in d, f"missing key {k}"

        # client
        assert d["client"]["id"] == test_client_id
        assert "first_name" in d["client"]
        assert "_id" not in d["client"]

        # counts
        for k in ["documents", "reports", "emails", "compliance", "portfolio_reviews"]:
            assert k in d["counts"]
            assert isinstance(d["counts"][k], int)

        # arrays
        for k in ["documents", "reports", "emails", "compliance", "portfolio_reviews", "timeline"]:
            assert isinstance(d[k], list)

    def test_empty_client_has_zero_counts_and_empty_timeline(self, admin_headers, test_client_id):
        r = requests.get(f"{BASE_URL}/api/client-360/{test_client_id}", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        # newly created client: nothing yet
        assert d["counts"]["reports"] == 0
        assert d["counts"]["emails"] == 0
        assert d["counts"]["compliance"] == 0
        assert d["counts"]["portfolio_reviews"] == 0
        assert d["counts"]["documents"] == 0
        assert d["timeline"] == []


# Aggregation & timeline ordering
class TestClient360Aggregation:
    def _seed_email(self, admin_headers, client_id):
        # email generator endpoint creates an advisor_emails record
        payload = {
            "client_id": client_id,
            "template_type": "follow_up",
            "tone": "professional",
            "key_points": "Test client 360 aggregation",
        }
        r = requests.post(f"{BASE_URL}/api/advisor-emails/generate", json=payload,
                          headers=admin_headers, timeout=60)
        return r

    def _seed_compliance(self, admin_headers, client_id):
        payload = {
            "client_id": client_id,
            "record_type": "file_note",
            "context": "TEST file note for client 360 aggregation testing",
        }
        r = requests.post(f"{BASE_URL}/api/compliance/generate", json=payload,
                          headers=admin_headers, timeout=60)
        return r

    def _seed_report(self, admin_headers, client_id):
        payload = {
            "client_id": client_id,
            "report_type": "annual_review",
            "advisor_notes": "TEST report for client 360 aggregation",
        }
        r = requests.post(f"{BASE_URL}/api/reports/generate", json=payload,
                          headers=admin_headers, timeout=90)
        return r

    def test_timeline_increments_with_seeded_items(self, admin_headers, test_client_id):
        # baseline
        r0 = requests.get(f"{BASE_URL}/api/client-360/{test_client_id}",
                          headers=admin_headers, timeout=20)
        assert r0.status_code == 200
        base = r0.json()
        base_counts = base["counts"]
        base_timeline = len(base["timeline"])

        # Try seeding 3 different items. If any fail (LLM unavailable etc), we skip those.
        seeded = 0
        re = self._seed_email(admin_headers, test_client_id)
        if re.status_code in (200, 201):
            seeded += 1
        rc = self._seed_compliance(admin_headers, test_client_id)
        if rc.status_code in (200, 201):
            seeded += 1
        rr = self._seed_report(admin_headers, test_client_id)
        if rr.status_code in (200, 201):
            seeded += 1

        if seeded == 0:
            pytest.skip(
                f"All 3 seed endpoints unavailable (email={re.status_code}, "
                f"comp={rc.status_code}, rep={rr.status_code}). Cannot verify aggregation."
            )

        # fetch again
        r1 = requests.get(f"{BASE_URL}/api/client-360/{test_client_id}",
                          headers=admin_headers, timeout=20)
        assert r1.status_code == 200
        after = r1.json()
        delta_counts = (
            (after["counts"]["emails"] - base_counts["emails"]) +
            (after["counts"]["compliance"] - base_counts["compliance"]) +
            (after["counts"]["reports"] - base_counts["reports"])
        )
        assert delta_counts >= seeded, (
            f"counts did not increment by at least {seeded}: "
            f"before={base_counts} after={after['counts']}"
        )
        # timeline grew
        assert len(after["timeline"]) >= base_timeline + seeded

        # timeline must be sorted descending by created_at (where present)
        stamps = [t.get("created_at") for t in after["timeline"] if t.get("created_at")]
        assert stamps == sorted(stamps, reverse=True), "timeline not sorted DESC"

        # each timeline entry has the expected shape
        for t in after["timeline"]:
            assert "kind" in t
            assert t["kind"] in ("document", "report", "email", "compliance", "portfolio_review")
            assert "id" in t
            assert "title" in t
