"""
Test suite for AdvisoryPro Password Reset Feature:
- Request password reset (forgot-password endpoint)
- Verify reset code and set new password
- Login with new password after reset
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USER_EMAIL = "test@advisor.com"
TEST_USER_PASSWORD = "newpassword123"


class TestPasswordResetFlow:
    """Test password reset flow"""
    
    def test_api_health(self):
        """Test API is healthy before running tests"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API is healthy")
    
    def test_login_with_existing_credentials(self):
        """Test login with the test user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ Login with existing credentials works: {TEST_USER_EMAIL}")
    
    def test_forgot_password_with_valid_email(self):
        """Test forgot password endpoint with valid email"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "message" in data
        
        # For testing, the API returns the reset code
        assert "reset_code" in data, "API should return reset_code for testing"
        assert len(data["reset_code"]) == 6, "Reset code should be 6 digits"
        assert data["expires_in_minutes"] == 15
        
        print(f"✓ Forgot password request successful, reset code: {data['reset_code']}")
        return data["reset_code"]
    
    def test_forgot_password_with_nonexistent_email(self):
        """Test forgot password with non-existent email (should not reveal if email exists)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent@advisor.com"
        })
        assert response.status_code == 200, "Should return 200 to prevent email enumeration"
        data = response.json()
        assert data["success"] == True
        # Should NOT return reset_code for non-existent email
        assert "reset_code" not in data or data.get("reset_code") is None
        print("✓ Forgot password doesn't reveal if email exists")
    
    def test_forgot_password_invalid_email_format(self):
        """Test forgot password with invalid email format"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "invalid-email"
        })
        # Should return 422 validation error
        assert response.status_code == 422
        print("✓ Invalid email format returns 422")


class TestVerifyResetCode:
    """Test verify reset code and password change"""
    
    @pytest.fixture(scope="class")
    def reset_code(self):
        """Get a fresh reset code for testing"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        return data.get("reset_code")
    
    def test_verify_reset_code_success(self, reset_code):
        """Test successful password reset with valid code"""
        if not reset_code:
            pytest.skip("No reset code available")
        
        new_password = "newpassword123"  # Keep the same password for simplicity
        
        response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "token": reset_code,
            "new_password": new_password
        })
        assert response.status_code == 200, f"Verify reset failed: {response.text}"
        data = response.json()
        
        assert data["success"] == True
        assert "Password has been reset" in data["message"]
        print(f"✓ Password reset successfully with code: {reset_code}")
    
    def test_verify_reset_code_invalid_code(self):
        """Test password reset with invalid code"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "token": "000000",  # Invalid code
            "new_password": "newpassword123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "Invalid" in data["detail"] or "expired" in data["detail"].lower()
        print("✓ Invalid reset code returns 400")
    
    def test_verify_reset_code_short_password(self):
        """Test password reset with password too short"""
        # First get a valid reset code
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        reset_code = forgot_response.json().get("reset_code")
        
        if not reset_code:
            pytest.skip("No reset code available")
        
        response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "token": reset_code,
            "new_password": "123"  # Too short
        })
        assert response.status_code == 400
        data = response.json()
        assert "6 characters" in data["detail"]
        print("✓ Short password returns 400")
    
    def test_reset_code_can_only_be_used_once(self):
        """Test that reset code can only be used once"""
        # Get a fresh reset code
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        reset_code = forgot_response.json().get("reset_code")
        
        if not reset_code:
            pytest.skip("No reset code available")
        
        # Use the code once
        first_response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "token": reset_code,
            "new_password": "newpassword123"
        })
        assert first_response.status_code == 200, "First use should succeed"
        
        # Try to use the same code again
        second_response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "token": reset_code,
            "new_password": "anotherpassword"
        })
        assert second_response.status_code == 400, "Second use should fail"
        print("✓ Reset code can only be used once")


class TestFullPasswordResetFlow:
    """Test complete password reset flow including login with new password"""
    
    def test_full_reset_and_login_flow(self):
        """Test full flow: forgot password -> reset -> login with new password"""
        # Use a unique test user to avoid conflicts
        test_email = f"test_reset_{uuid.uuid4().hex[:8]}@advisor.com"
        initial_password = "InitialPass123!"
        new_password = "NewResetPass456!"
        
        # Step 1: Register a new user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": initial_password,
            "full_name": "Password Reset Test User"
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        print(f"✓ Step 1: User registered: {test_email}")
        
        # Step 2: Verify can login with initial password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": initial_password
        })
        assert login_response.status_code == 200, "Initial login should succeed"
        print("✓ Step 2: Login with initial password works")
        
        # Step 3: Request password reset
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_email
        })
        assert forgot_response.status_code == 200
        reset_code = forgot_response.json().get("reset_code")
        assert reset_code, "Reset code should be returned"
        print(f"✓ Step 3: Reset code generated: {reset_code}")
        
        # Step 4: Reset password with the code
        reset_response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "token": reset_code,
            "new_password": new_password
        })
        assert reset_response.status_code == 200, f"Password reset failed: {reset_response.text}"
        print("✓ Step 4: Password reset successful")
        
        # Step 5: Verify old password no longer works
        old_login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": initial_password
        })
        assert old_login_response.status_code == 401, "Old password should no longer work"
        print("✓ Step 5: Old password no longer works")
        
        # Step 6: Login with new password
        new_login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": new_password
        })
        assert new_login_response.status_code == 200, f"Login with new password failed: {new_login_response.text}"
        data = new_login_response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_email
        print("✓ Step 6: Login with new password works")
        
        print("\n✓ Full password reset flow completed successfully!")


class TestExistingTestUserCredentials:
    """Verify the test user credentials work after all tests"""
    
    def test_verify_test_user_login(self):
        """Verify test@advisor.com can still login with newpassword123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Test user login failed: {response.text}"
        print(f"✓ Test user {TEST_USER_EMAIL} can login with {TEST_USER_PASSWORD}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
