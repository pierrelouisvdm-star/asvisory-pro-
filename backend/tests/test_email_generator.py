"""
Tests for AI Email & Communication Generator.
- GET /api/emails/templates (auth required)
- POST /api/emails/generate (template & tone validation, content generation)
- GET /api/emails (list)
- DELETE /api/emails/{id}
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
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def individual_token(session):
    # Fresh individual user for role-gating verification of /me
    email = f"TEST_ind_email_{uuid.uuid4().hex[:8]}@example.com"
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!", "full_name": "TEST Ind", "role": "individual"
    })
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


# --- Templates endpoint ---
class TestTemplates:
    def test_templates_requires_auth(self, session):
        r = session.get(f"{API}/emails/templates")
        assert r.status_code in (401, 403), f"Expected auth error, got {r.status_code}"

    def test_templates_returns_eight_and_four(self, session, admin_headers):
        r = session.get(f"{API}/emails/templates", headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "templates" in body and "tones" in body
        assert len(body["templates"]) == 8
        assert len(body["tones"]) == 4
        keys = {t["key"] for t in body["templates"]}
        expected_keys = {"review_email", "follow_up", "meeting_summary", "whatsapp_brief",
                         "onboarding", "annual_review_reminder", "market_update", "custom"}
        assert keys == expected_keys
        tone_keys = {t["key"] for t in body["tones"]}
        assert tone_keys == {"professional", "simple", "hnw", "beginner"}


# --- Validation ---
class TestGenerateValidation:
    def test_invalid_template_type_returns_400(self, session, admin_headers):
        r = session.post(f"{API}/emails/generate", headers=admin_headers, json={
            "template_type": "not_a_real_template",
            "tone": "professional",
            "recipient_name": "John",
        })
        assert r.status_code == 400, r.text

    def test_invalid_tone_returns_400(self, session, admin_headers):
        r = session.post(f"{API}/emails/generate", headers=admin_headers, json={
            "template_type": "review_email",
            "tone": "shouty",
            "recipient_name": "John",
        })
        assert r.status_code == 400, r.text

    def test_unauthenticated_generate_blocked(self, session):
        r = session.post(f"{API}/emails/generate", json={
            "template_type": "review_email", "tone": "professional"
        })
        assert r.status_code in (401, 403)


# --- Generation (real GPT-4o calls; slow ~5-15s each) ---
class TestGenerate:
    @pytest.fixture(scope="class")
    def created_ids(self):
        return []

    def test_generate_review_email(self, session, admin_headers, created_ids):
        r = session.post(f"{API}/emails/generate", headers=admin_headers, json={
            "template_type": "review_email",
            "tone": "professional",
            "recipient_name": "John Smith",
            "advisor_notes": "Portfolio up 8% this year, fee 1%, TFSA maxed.",
            "bullet_points": ["YTD performance 8%", "TFSA maxed at R36k", "Suggest review in March"],
        }, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        email = body["email"]
        assert "id" in email
        content = email["content"]
        assert content.get("subject"), f"subject missing: {content}"
        assert content.get("body_plain"), f"body_plain missing: {content}"
        assert content.get("channel") in ("email", "note", "whatsapp")
        created_ids.append(email["id"])

    def test_generate_whatsapp_brief(self, session, admin_headers, created_ids):
        r = session.post(f"{API}/emails/generate", headers=admin_headers, json={
            "template_type": "whatsapp_brief",
            "tone": "simple",
            "recipient_name": "Sarah",
            "bullet_points": ["Markets calm this week", "RA contribution reminder"],
        }, timeout=90)
        assert r.status_code == 200, r.text
        content = r.json()["email"]["content"]
        # WhatsApp brief should populate whatsapp_text
        assert content.get("whatsapp_text"), f"whatsapp_text missing: {content}"
        assert content.get("channel") == "whatsapp", f"channel wrong: {content.get('channel')}"
        created_ids.append(r.json()["email"]["id"])

    def test_generate_empty_body_does_not_500(self, session, admin_headers, created_ids):
        # No recipient/client/notes/bullets — should still succeed (LLM produces generic) or fail gracefully
        r = session.post(f"{API}/emails/generate", headers=admin_headers, json={
            "template_type": "custom",
            "tone": "professional",
        }, timeout=90)
        assert r.status_code != 500, f"Server crashed: {r.text}"
        # Either succeeds or returns a 4xx — but NOT a 500
        if r.status_code == 200:
            created_ids.append(r.json()["email"]["id"])


# --- List & Delete ---
class TestListDelete:
    def test_list_emails(self, session, admin_headers):
        r = session.get(f"{API}/emails", headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "emails" in body
        assert isinstance(body["emails"], list)
        assert "total" in body

    def test_delete_email_and_verify(self, session, admin_headers):
        # Create one
        r = session.post(f"{API}/emails/generate", headers=admin_headers, json={
            "template_type": "follow_up",
            "tone": "simple",
            "recipient_name": "TEST_delete_target",
            "advisor_notes": "short test note",
        }, timeout=90)
        assert r.status_code == 200, r.text
        email_id = r.json()["email"]["id"]

        # Delete
        d = session.delete(f"{API}/emails/{email_id}", headers=admin_headers)
        assert d.status_code == 200, d.text
        assert d.json().get("success") is True

        # Verify gone — second delete should 404
        d2 = session.delete(f"{API}/emails/{email_id}", headers=admin_headers)
        assert d2.status_code == 404
