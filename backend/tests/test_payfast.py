"""
PayFast ITN Webhook Backend Tests
Tests the PayFast payment integration endpoint at /api/payments/payfast-notify
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPayFastITN:
    """PayFast Instant Transaction Notification endpoint tests"""

    def test_payfast_notify_accepts_post(self):
        """Test that PayFast ITN endpoint accepts POST requests"""
        response = requests.post(
            f"{BASE_URL}/api/payments/payfast-notify",
            data={
                "m_payment_id": f"test_{uuid.uuid4().hex[:8]}",
                "payment_status": "COMPLETE",
                "amount_gross": "199.00"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        assert response.text == "OK"
        print(f"PASS: PayFast notify endpoint accepts POST - Status {response.status_code}")

    def test_payfast_notify_with_complete_status(self):
        """Test PayFast ITN with COMPLETE payment status"""
        payment_id = f"test_complete_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/payments/payfast-notify",
            data={
                "m_payment_id": payment_id,
                "pf_payment_id": f"pf_{uuid.uuid4().hex[:8]}",
                "payment_status": "COMPLETE",
                "amount_gross": "199.00",
                "amount_fee": "4.98",
                "amount_net": "194.02",
                "item_name": "Premium Subscription",
                "email_address": "test@example.com",
                "custom_str1": "test_user_123"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        assert response.text == "OK"
        print(f"PASS: PayFast COMPLETE status processed correctly - Payment ID: {payment_id}")

    def test_payfast_notify_with_pending_status(self):
        """Test PayFast ITN with PENDING payment status"""
        payment_id = f"test_pending_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/payments/payfast-notify",
            data={
                "m_payment_id": payment_id,
                "pf_payment_id": f"pf_{uuid.uuid4().hex[:8]}",
                "payment_status": "PENDING",
                "amount_gross": "199.00"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        assert response.text == "OK"
        print(f"PASS: PayFast PENDING status handled correctly - Payment ID: {payment_id}")

    def test_payfast_notify_with_failed_status(self):
        """Test PayFast ITN with FAILED payment status"""
        payment_id = f"test_failed_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/payments/payfast-notify",
            data={
                "m_payment_id": payment_id,
                "pf_payment_id": f"pf_{uuid.uuid4().hex[:8]}",
                "payment_status": "FAILED",
                "amount_gross": "199.00"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        assert response.text == "OK"
        print(f"PASS: PayFast FAILED status handled correctly - Payment ID: {payment_id}")

    def test_payfast_notify_with_cancelled_status(self):
        """Test PayFast ITN with CANCELLED payment status"""
        payment_id = f"test_cancelled_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/payments/payfast-notify",
            data={
                "m_payment_id": payment_id,
                "pf_payment_id": f"pf_{uuid.uuid4().hex[:8]}",
                "payment_status": "CANCELLED",
                "amount_gross": "199.00"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        assert response.text == "OK"
        print(f"PASS: PayFast CANCELLED status handled correctly - Payment ID: {payment_id}")

    def test_payfast_notify_empty_payload(self):
        """Test PayFast ITN with empty payload (edge case)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/payfast-notify",
            data={},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        # Should still return 200 OK to prevent PayFast retries
        assert response.status_code == 200
        print(f"PASS: PayFast empty payload handled gracefully - Status {response.status_code}")

    def test_payfast_status_endpoint_not_found(self):
        """Test PayFast status endpoint returns 404 for unknown payment"""
        response = requests.get(
            f"{BASE_URL}/api/payments/payfast-status/nonexistent_payment_id"
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"PASS: PayFast status endpoint returns 404 for unknown payment")


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
