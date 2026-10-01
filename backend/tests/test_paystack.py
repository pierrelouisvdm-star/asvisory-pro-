"""
Paystack Payment Integration Backend Tests
Tests /api/payments/paystack/initialize, /api/payments/paystack-webhook,
and /api/payments/paystack-status/{reference}
"""
import pytest
import requests
import os
import uuid
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPaystackPayments:
    """Paystack checkout and webhook endpoint tests"""

    def test_initialize_requires_auth(self):
        """POST /paystack/initialize should reject requests without a token"""
        response = requests.post(
            f"{BASE_URL}/api/payments/paystack/initialize",
            json={"billing_cycle": "monthly", "origin_url": "https://advisorypro.co.za"}
        )
        assert response.status_code in [401, 403]
        print(f"PASS: Paystack initialize rejects unauthenticated requests - Status {response.status_code}")

    def test_webhook_accepts_post_without_valid_signature(self):
        """
        Webhook should always return 200 OK (so Paystack doesn't retry), even when the
        x-paystack-signature header is missing or wrong — the payload is just ignored.
        """
        response = requests.post(
            f"{BASE_URL}/api/payments/paystack-webhook",
            data=json.dumps({
                "event": "charge.success",
                "data": {
                    "reference": f"test_{uuid.uuid4().hex[:8]}",
                    "status": "success",
                    "amount": 29900,
                    "customer": {"email": "test@example.com"},
                    "metadata": {"user_id": "test_user_123", "billing_cycle": "monthly"}
                }
            }),
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        assert response.text == "OK"
        print(f"PASS: Paystack webhook returns 200 OK without a valid signature")

    def test_webhook_handles_empty_payload(self):
        """Webhook should handle a malformed/empty payload gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/payments/paystack-webhook",
            data="",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        print(f"PASS: Paystack webhook handles empty payload gracefully - Status {response.status_code}")

    def test_status_endpoint_requires_auth(self):
        """GET /paystack-status/{reference} should reject requests without a token"""
        response = requests.get(
            f"{BASE_URL}/api/payments/paystack-status/nonexistent_reference"
        )
        assert response.status_code in [401, 403]
        print(f"PASS: Paystack status endpoint rejects unauthenticated requests - Status {response.status_code}")


class TestAuthAndLogin:
    """Authentication tests to verify login flow works"""

    def test_login_success(self):
        """Test login with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "pierrelouisvdm@gmail.com",
                "password": "Admin123!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data
        print(f"PASS: Login successful for admin user")

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "invalid@example.com",
                "password": "wrongpass"
            }
        )
        assert response.status_code in [401, 400]
        print(f"PASS: Login correctly rejects invalid credentials - Status {response.status_code}")


class TestHealthEndpoint:
    """Health check endpoint tests"""

    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"PASS: Health check endpoint working - Status: {data.get('status')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
