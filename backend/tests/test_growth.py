"""
Growth endpoints backend tests
Tests: /api/growth/capture-lead, /api/growth/referral, /api/growth/lead-count
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestGrowthLeadCapture:
    """Test /api/growth/capture-lead endpoint"""

    def test_capture_lead_valid_email(self):
        """Capture a new lead with valid email and source"""
        unique_email = f"TEST_lead_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "source": "fi_score_quiz",
            "score": 120,
            "tier": "Financially Stable",
        }
        res = requests.post(f"{BASE_URL}/api/growth/capture-lead", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("status") in ["captured", "updated"], f"Unexpected status: {data}"
        assert "message" in data

    def test_capture_lead_public_tools_source(self):
        """Capture a lead from public tools page"""
        unique_email = f"TEST_toolslead_{uuid.uuid4().hex[:8]}@example.com"
        payload = {"email": unique_email, "source": "public_tools_page"}
        res = requests.post(f"{BASE_URL}/api/growth/capture-lead", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data.get("status") == "captured"

    def test_capture_lead_returns_updated_for_duplicate(self):
        """Submitting same email twice returns 'updated' on second call"""
        unique_email = f"TEST_dup_{uuid.uuid4().hex[:8]}@example.com"
        payload = {"email": unique_email, "source": "fi_score_quiz", "score": 80}
        # First submission
        res1 = requests.post(f"{BASE_URL}/api/growth/capture-lead", json=payload)
        assert res1.status_code == 200
        assert res1.json().get("status") == "captured"
        # Second submission (duplicate)
        res2 = requests.post(f"{BASE_URL}/api/growth/capture-lead", json=payload)
        assert res2.status_code == 200
        assert res2.json().get("status") == "updated"

    def test_capture_lead_invalid_email(self):
        """Invalid email returns 400"""
        payload = {"email": "not-an-email", "source": "fi_score_quiz"}
        res = requests.post(f"{BASE_URL}/api/growth/capture-lead", json=payload)
        assert res.status_code == 400, f"Expected 400, got {res.status_code}"

    def test_capture_lead_empty_email(self):
        """Empty email returns 400"""
        payload = {"email": "", "source": "fi_score_quiz"}
        res = requests.post(f"{BASE_URL}/api/growth/capture-lead", json=payload)
        assert res.status_code in [400, 422], f"Expected 400 or 422, got {res.status_code}"


class TestGrowthReferral:
    """Test /api/growth/referral endpoint"""

    def test_create_referral_for_new_user(self):
        """POST /api/growth/referral creates a new referral code for new user_id"""
        user_id = f"TEST_user_{uuid.uuid4().hex}"
        payload = {"user_id": user_id, "user_email": f"{user_id}@example.com"}
        res = requests.post(f"{BASE_URL}/api/growth/referral", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "referral_code" in data, f"Missing referral_code: {data}"
        assert isinstance(data["referral_code"], str)
        assert len(data["referral_code"]) > 0
        assert "referral_count" in data
        assert data["referral_count"] == 0

    def test_get_existing_referral_returns_same_code(self):
        """Calling POST /referral twice with same user_id returns the same code"""
        user_id = f"TEST_user_{uuid.uuid4().hex}"
        payload = {"user_id": user_id, "user_email": f"{user_id}@example.com"}
        # First call
        res1 = requests.post(f"{BASE_URL}/api/growth/referral", json=payload)
        assert res1.status_code == 200
        code1 = res1.json().get("referral_code")
        # Second call
        res2 = requests.post(f"{BASE_URL}/api/growth/referral", json=payload)
        assert res2.status_code == 200
        code2 = res2.json().get("referral_code")
        assert code1 == code2, "Same user_id should always return same referral code"

    def test_referral_code_format(self):
        """Referral code should be 8 uppercase alphanumeric characters"""
        user_id = f"TEST_user_{uuid.uuid4().hex}"
        payload = {"user_id": user_id}
        res = requests.post(f"{BASE_URL}/api/growth/referral", json=payload)
        assert res.status_code == 200
        code = res.json().get("referral_code", "")
        assert len(code) == 8, f"Expected 8-char code, got: '{code}'"
        assert code.isupper() or code.isalnum(), f"Code should be alphanumeric uppercase: {code}"


class TestGrowthLeadCount:
    """Test /api/growth/lead-count endpoint"""

    def test_lead_count_returns_counts(self):
        """GET /api/growth/lead-count returns total_leads and total_users"""
        res = requests.get(f"{BASE_URL}/api/growth/lead-count")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "total_leads" in data
        assert "total_users" in data
        assert "combined" in data
        assert isinstance(data["total_leads"], int)
        assert isinstance(data["total_users"], int)
