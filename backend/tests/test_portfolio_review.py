"""
Tests for Multi-Document Portfolio Review.
- POST /api/portfolio-review/generate validations (empty list=400, bogus client=404, bogus doc ids=404)
- POST /api/portfolio-review/generate happy path (AI aggregation)
- GET /api/portfolio-review (list)
- GET /api/portfolio-review/{id} (single + 404)
- DELETE /api/portfolio-review/{id} (delete + 404 after)
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fap-sa-finance.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASS = "Scorpio@57!!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def admin_doc_ids(session, admin_headers):
    """Pull existing document analyses for the admin user."""
    r = session.get(f"{API}/documents/analyses", headers=admin_headers)
    if r.status_code != 200:
        pytest.skip(f"Could not list documents: {r.status_code} {r.text[:200]}")
    body = r.json()
    docs = body.get("analyses") or body.get("documents") or []
    ids = [d.get("id") for d in docs if d.get("id")]
    if not ids:
        pytest.skip("No document analyses on file for admin")
    return ids


created_ids = {}


class TestValidations:
    def test_empty_doc_list_400(self, session, admin_headers):
        r = session.post(f"{API}/portfolio-review/generate", headers=admin_headers, json={"document_analysis_ids": []})
        assert r.status_code == 400, r.text

    def test_invalid_client_id_404(self, session, admin_headers, admin_doc_ids):
        r = session.post(f"{API}/portfolio-review/generate", headers=admin_headers, json={
            "document_analysis_ids": admin_doc_ids[:1],
            "client_id": f"bogus-{uuid.uuid4().hex}",
        })
        assert r.status_code == 404, r.text

    def test_nonexistent_doc_ids_404(self, session, admin_headers):
        r = session.post(f"{API}/portfolio-review/generate", headers=admin_headers, json={
            "document_analysis_ids": [f"nope-{uuid.uuid4().hex}"],
        })
        assert r.status_code == 404, r.text
        assert "document analyses" in r.json().get("detail", "").lower()

    def test_requires_auth(self, session):
        r = session.post(f"{API}/portfolio-review/generate", json={"document_analysis_ids": ["x"]})
        assert r.status_code in (401, 403)


class TestGenerate:
    def test_generate_happy_path(self, session, admin_headers, admin_doc_ids):
        payload = {
            "document_analysis_ids": admin_doc_ids[:3],
            "advisor_notes": "Client is 42yo SA resident, growth oriented, 20-year horizon.",
        }
        r = session.post(f"{API}/portfolio-review/generate", headers=admin_headers, json=payload, timeout=120)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        rec = body["review"]
        assert "id" in rec
        assert rec["document_count"] >= 1
        c = rec["content"]
        # Core fields per spec
        assert c.get("title"), "title missing"
        assert c.get("executive_summary"), "executive_summary missing"
        # aggregate_metrics structure
        agg = c.get("aggregate_metrics") or {}
        assert isinstance(agg, dict), "aggregate_metrics missing/invalid"
        for k in ("number_of_products", "weighted_eac_estimate", "asset_allocation", "tax_wrappers_used"):
            assert k in agg, f"aggregate_metrics.{k} missing"
        # Recommendations / client_friendly_summary should be present (may be empty list)
        assert "recommendations" in c, "recommendations missing"
        assert c.get("client_friendly_summary"), "client_friendly_summary missing"
        created_ids["review"] = rec["id"]


class TestListGetDelete:
    def test_list(self, session, admin_headers):
        r = session.get(f"{API}/portfolio-review", headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "reviews" in body
        if "review" in created_ids:
            ids = {x["id"] for x in body["reviews"]}
            assert created_ids["review"] in ids

    def test_get_single(self, session, admin_headers):
        if "review" not in created_ids:
            pytest.skip("No review created")
        r = session.get(f"{API}/portfolio-review/{created_ids['review']}", headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json()["id"] == created_ids["review"]

    def test_get_bogus_404(self, session, admin_headers):
        r = session.get(f"{API}/portfolio-review/bogus-{uuid.uuid4().hex}", headers=admin_headers)
        assert r.status_code == 404

    def test_delete_and_404(self, session, admin_headers):
        if "review" not in created_ids:
            pytest.skip("No review created")
        rid = created_ids["review"]
        r = session.delete(f"{API}/portfolio-review/{rid}", headers=admin_headers)
        assert r.status_code == 200, r.text
        r2 = session.get(f"{API}/portfolio-review/{rid}", headers=admin_headers)
        assert r2.status_code == 404

    def test_delete_nonexistent_404(self, session, admin_headers):
        r = session.delete(f"{API}/portfolio-review/bogus-{uuid.uuid4().hex}", headers=admin_headers)
        assert r.status_code == 404


@pytest.fixture(scope="module", autouse=True)
def cleanup(session):
    yield
    headers_resp = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if headers_resp.status_code != 200:
        return
    headers = {"Authorization": f"Bearer {headers_resp.json()['access_token']}"}
    for rid in list(created_ids.values()):
        try:
            session.delete(f"{API}/portfolio-review/{rid}", headers=headers)
        except Exception:
            pass
