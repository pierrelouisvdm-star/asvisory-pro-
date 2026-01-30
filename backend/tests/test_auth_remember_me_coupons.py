"""
Test suite for AdvisoryPro Auth Features:
- Login with 'Remember me' checkbox (30-day vs 7-day token expiration)
- Registration flow
- Coupon validation and redemption
"""
import pytest
import requests
import os
import uuid
import jwt
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "pierrelouisvdm@gmail.com"
ADMIN_PASSWORD = "Admin123!"
VALID_COUPON_1 = "ADVPRO-T9SW13LB"
VALID_COUPON_2 = "ADVPRO-L9PGXTOW"
VALID_COUPON_3 = "ADVPRO-C4NZOFO7"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API is healthy")


class TestLoginRememberMe:
    """Test login with remember_me flag affecting token expiration"""
    
    def test_login_with_remember_me_true(self):
        """Test login with remember_me=true returns 30-day token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "remember_me": True
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        
        # Decode token to check expiration (without verification)
        token = data["access_token"]
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Check expiration is approximately 30 days from now
        exp_timestamp = decoded.get("exp")
        assert exp_timestamp is not None, "Token missing exp claim"
        
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        now = datetime.now()
        days_until_expiry = (exp_datetime - now).days
        
        # Should be approximately 30 days (allow 29-30 range for timing)
        assert 29 <= days_until_expiry <= 30, f"Expected ~30 days, got {days_until_expiry} days"
        print(f"✓ Login with remember_me=true: token expires in {days_until_expiry} days")
    
    def test_login_with_remember_me_false(self):
        """Test login with remember_me=false returns 7-day token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "remember_me": False
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        
        # Decode token to check expiration
        token = data["access_token"]
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        exp_timestamp = decoded.get("exp")
        assert exp_timestamp is not None, "Token missing exp claim"
        
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        now = datetime.now()
        days_until_expiry = (exp_datetime - now).days
        
        # Should be approximately 7 days (allow 6-7 range for timing)
        assert 6 <= days_until_expiry <= 7, f"Expected ~7 days, got {days_until_expiry} days"
        print(f"✓ Login with remember_me=false: token expires in {days_until_expiry} days")
    
    def test_login_without_remember_me_defaults_to_false(self):
        """Test login without remember_me field defaults to 7-day token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
            # No remember_me field - should default to False
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        token = data["access_token"]
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        exp_timestamp = decoded.get("exp")
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        now = datetime.now()
        days_until_expiry = (exp_datetime - now).days
        
        # Should default to 7 days
        assert 6 <= days_until_expiry <= 7, f"Expected ~7 days (default), got {days_until_expiry} days"
        print(f"✓ Login without remember_me defaults to {days_until_expiry} days")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword",
            "remember_me": True
        })
        assert response.status_code == 401
        print("✓ Invalid credentials return 401")


class TestRegistration:
    """Test user registration flow"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        unique_email = f"test_reg_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "full_name": "Test Registration User",
            "company": "Test Company"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["full_name"] == "Test Registration User"
        print(f"✓ New user registered: {unique_email}")
        
        return data
    
    def test_register_duplicate_email_fails(self):
        """Test registering with existing email fails"""
        # Try to register with admin email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "TestPass123!",
            "full_name": "Duplicate User"
        })
        assert response.status_code == 400
        assert "already registered" in response.text.lower()
        print("✓ Duplicate email registration returns 400")
    
    def test_register_without_company(self):
        """Test registration without company field (optional)"""
        unique_email = f"test_nocompany_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "full_name": "No Company User"
            # No company field
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["user"]["email"] == unique_email
        print(f"✓ Registration without company works: {unique_email}")


class TestCouponValidation:
    """Test coupon validation endpoint"""
    
    def test_validate_coupon_1(self):
        """Test validating coupon ADVPRO-T9SW13LB"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/{VALID_COUPON_1}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == True, f"Coupon should be valid: {data}"
        assert data["tier"] == "premium"
        assert "Lifetime Premium Access" in data["description"]
        print(f"✓ Coupon {VALID_COUPON_1} is valid: {data['description']}")
    
    def test_validate_coupon_2(self):
        """Test validating coupon ADVPRO-L9PGXTOW"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/{VALID_COUPON_2}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == True, f"Coupon should be valid: {data}"
        assert data["tier"] == "premium"
        print(f"✓ Coupon {VALID_COUPON_2} is valid: {data['description']}")
    
    def test_validate_coupon_3(self):
        """Test validating coupon ADVPRO-C4NZOFO7"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/{VALID_COUPON_3}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == True, f"Coupon should be valid: {data}"
        assert data["tier"] == "premium"
        print(f"✓ Coupon {VALID_COUPON_3} is valid: {data['description']}")
    
    def test_validate_invalid_coupon(self):
        """Test validating an invalid coupon code"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/INVALID-CODE-XYZ")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == False
        print("✓ Invalid coupon returns valid=false")
    
    def test_validate_coupon_case_insensitive(self):
        """Test coupon validation is case insensitive"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/{VALID_COUPON_1.lower()}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == True, "Coupon validation should be case insensitive"
        print("✓ Coupon validation is case insensitive")


class TestCouponRedemption:
    """Test coupon redemption flow"""
    
    @pytest.fixture(scope="class")
    def new_user_token(self):
        """Register a new user for coupon redemption testing"""
        unique_email = f"test_coupon_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "full_name": "Coupon Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip(f"Could not register user: {response.text}")
    
    def test_redeem_coupon_requires_auth(self):
        """Test coupon redemption requires authentication"""
        response = requests.post(f"{BASE_URL}/api/coupons/redeem", json={
            "code": VALID_COUPON_1
        })
        assert response.status_code in [401, 403]
        print("✓ Coupon redemption requires authentication")
    
    def test_redeem_invalid_coupon(self, new_user_token):
        """Test redeeming an invalid coupon returns 404"""
        headers = {"Authorization": f"Bearer {new_user_token}"}
        response = requests.post(f"{BASE_URL}/api/coupons/redeem", json={
            "code": "INVALID-CODE-XYZ"
        }, headers=headers)
        assert response.status_code == 404
        print("✓ Invalid coupon redemption returns 404")
    
    def test_redeem_valid_coupon_and_verify_premium(self):
        """Test redeeming a valid coupon grants premium access"""
        # Register a fresh user
        unique_email = f"test_redeem_{uuid.uuid4().hex[:8]}@test.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "full_name": "Redemption Test User"
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Check initial subscription is free
        sub_response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        assert sub_response.status_code == 200
        initial_sub = sub_response.json()
        assert initial_sub["tier"] == "free", f"New user should have free tier: {initial_sub}"
        print(f"✓ New user starts with free tier")
        
        # Redeem coupon
        redeem_response = requests.post(f"{BASE_URL}/api/coupons/redeem", json={
            "code": VALID_COUPON_1
        }, headers=headers)
        assert redeem_response.status_code == 200, f"Redemption failed: {redeem_response.text}"
        redeem_data = redeem_response.json()
        
        assert redeem_data["success"] == True
        assert redeem_data["tier"] == "premium"
        assert "lifetime" in redeem_data["subscription_type"].lower()
        print(f"✓ Coupon redeemed: {redeem_data['message']}")
        
        # Verify subscription is now premium
        sub_response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        assert sub_response.status_code == 200
        updated_sub = sub_response.json()
        assert updated_sub["tier"] == "premium", f"Subscription should be premium: {updated_sub}"
        print(f"✓ User now has premium tier")
        
        return unique_email


class TestFullRegistrationWithCouponFlow:
    """Test complete registration + coupon redemption flow"""
    
    def test_register_validate_redeem_flow(self):
        """Test full flow: register -> validate coupon -> redeem -> verify premium"""
        unique_email = f"test_fullflow_{uuid.uuid4().hex[:8]}@test.com"
        
        # Step 1: Validate coupon (before registration)
        validate_response = requests.get(f"{BASE_URL}/api/coupons/validate/{VALID_COUPON_2}")
        assert validate_response.status_code == 200
        validate_data = validate_response.json()
        assert validate_data["valid"] == True
        print(f"✓ Step 1: Coupon {VALID_COUPON_2} validated")
        
        # Step 2: Register new user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "full_name": "Full Flow Test User",
            "company": "Test Corp"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✓ Step 2: User registered: {unique_email}")
        
        # Step 3: Redeem coupon
        redeem_response = requests.post(f"{BASE_URL}/api/coupons/redeem", json={
            "code": VALID_COUPON_2
        }, headers=headers)
        assert redeem_response.status_code == 200
        redeem_data = redeem_response.json()
        assert redeem_data["success"] == True
        assert redeem_data["tier"] == "premium"
        print(f"✓ Step 3: Coupon redeemed successfully")
        
        # Step 4: Verify premium access
        sub_response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        assert sub_response.status_code == 200
        sub_data = sub_response.json()
        assert sub_data["tier"] == "premium"
        assert sub_data["status"] == "active"
        print(f"✓ Step 4: User has premium access")
        
        # Step 5: Verify coupon is now redeemed (can't be used again)
        validate_again = requests.get(f"{BASE_URL}/api/coupons/validate/{VALID_COUPON_2}")
        validate_again_data = validate_again.json()
        assert validate_again_data["valid"] == False, "Coupon should be marked as redeemed"
        print(f"✓ Step 5: Coupon marked as redeemed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
