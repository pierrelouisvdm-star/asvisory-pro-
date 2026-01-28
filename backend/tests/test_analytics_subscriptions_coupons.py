"""
Test suite for AdvisoryPro Analytics Dashboard, Subscription Tiers, and Coupon Redemption
Tests: User registration, login, analytics dashboard, pricing tiers, coupon validation/redemption
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = f"test_analytics_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_NAME = "Test Analytics User"
TEST_COUPON_CODE = "ADVPRO-I9IBZ7KO"


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")


class TestUserRegistrationAndLogin:
    """Test user registration and login flows"""
    
    @pytest.fixture(scope="class")
    def registered_user(self):
        """Register a new test user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": TEST_USER_NAME,
            "company": "Test Company"
        })
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400 and "already registered" in response.text:
            # User exists, login instead
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            return login_response.json()
        pytest.fail(f"Failed to register user: {response.text}")
    
    def test_register_new_user(self, registered_user):
        """Test user registration returns token and user data"""
        assert "access_token" in registered_user
        assert "user" in registered_user
        assert registered_user["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ User registered/logged in: {TEST_USER_EMAIL}")
    
    def test_login_existing_user(self):
        """Test login with existing credentials"""
        # First ensure user exists
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_login_user@test.com",
            "password": "TestPass123!",
            "full_name": "Login Test User"
        })
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_login_user@test.com",
            "password": "TestPass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print("✓ Login endpoint working")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login returns 401")


class TestSubscriptionPricing:
    """Test subscription pricing endpoints"""
    
    def test_pricing_endpoint_returns_200(self):
        """Test pricing endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        assert response.status_code == 200
        print("✓ Pricing endpoint returns 200")
    
    def test_pricing_has_three_tiers(self):
        """Test pricing returns exactly 3 tiers"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        assert "tiers" in data
        assert len(data["tiers"]) == 3
        print("✓ Pricing has 3 tiers")
    
    def test_free_tier_pricing(self):
        """Test Free tier is R0"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        free_tier = next((t for t in data["tiers"] if t["tier"] == "free"), None)
        assert free_tier is not None
        assert free_tier["monthly_price"] == 0
        assert free_tier["annual_price"] == 0
        assert free_tier["name"] == "Free"
        print("✓ Free tier: R0/month")
    
    def test_standard_tier_pricing(self):
        """Test Standard tier is R49/month"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        standard_tier = next((t for t in data["tiers"] if t["tier"] == "standard"), None)
        assert standard_tier is not None
        assert standard_tier["monthly_price"] == 49.0
        assert standard_tier["name"] == "Standard"
        print("✓ Standard tier: R49/month")
    
    def test_premium_tier_pricing(self):
        """Test Premium tier is R149/month"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        premium_tier = next((t for t in data["tiers"] if t["tier"] == "premium"), None)
        assert premium_tier is not None
        assert premium_tier["monthly_price"] == 149.0
        assert premium_tier["name"] == "Premium"
        print("✓ Premium tier: R149/month")
    
    def test_trial_days_included(self):
        """Test trial days is included in pricing response"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        assert "trial_days" in data
        assert data["trial_days"] == 7
        print("✓ Trial days: 7")


class TestSubscriptionCurrent:
    """Test current subscription endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for testing"""
        # Register or login
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_sub_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "full_name": "Subscription Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_current_subscription_requires_auth(self):
        """Test current subscription endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/current")
        assert response.status_code in [401, 403]  # Both are valid unauthorized responses
        print("✓ Current subscription requires auth")
    
    def test_new_user_has_free_tier(self, auth_token):
        """Test new user defaults to free tier"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "free"
        assert data["status"] == "active"
        print("✓ New user has free tier")


class TestCouponValidation:
    """Test coupon validation endpoint"""
    
    def test_validate_valid_coupon(self):
        """Test validating a valid coupon code"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/{TEST_COUPON_CODE}")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["tier"] == "premium"
        assert "Lifetime Premium Access" in data["description"]
        print(f"✓ Coupon {TEST_COUPON_CODE} is valid for premium lifetime")
    
    def test_validate_invalid_coupon(self):
        """Test validating an invalid coupon code"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/INVALID-CODE-123")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print("✓ Invalid coupon returns valid=false")


class TestCouponRedemption:
    """Test coupon redemption endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token_for_redemption(self):
        """Get auth token for redemption testing"""
        email = f"test_redeem_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "full_name": "Redemption Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token for redemption")
    
    def test_redeem_coupon_requires_auth(self):
        """Test coupon redemption requires authentication"""
        response = requests.post(f"{BASE_URL}/api/coupons/redeem", json={
            "code": TEST_COUPON_CODE
        })
        assert response.status_code in [401, 403]  # Both are valid unauthorized responses
        print("✓ Coupon redemption requires auth")
    
    def test_redeem_invalid_coupon(self, auth_token_for_redemption):
        """Test redeeming an invalid coupon returns error"""
        headers = {"Authorization": f"Bearer {auth_token_for_redemption}"}
        response = requests.post(f"{BASE_URL}/api/coupons/redeem", json={
            "code": "INVALID-CODE-XYZ"
        }, headers=headers)
        assert response.status_code == 404
        print("✓ Invalid coupon redemption returns 404")


class TestAnalyticsDashboard:
    """Test analytics dashboard endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for analytics testing"""
        # Use existing test user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_ai_advisor@test.com",
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        # Create new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"test_analytics_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "full_name": "Analytics Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_analytics_dashboard_requires_auth(self):
        """Test analytics dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        assert response.status_code in [401, 403]  # Both are valid unauthorized responses
        print("✓ Analytics dashboard requires auth")
    
    def test_analytics_dashboard_returns_data(self, auth_token):
        """Test analytics dashboard returns proper data structure"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check stats structure
        assert "stats" in data
        assert "total_users" in data["stats"]
        assert "new_users_today" in data["stats"]
        assert "new_users_week" in data["stats"]
        assert "active_users_week" in data["stats"]
        
        # Check recent_users structure
        assert "recent_users" in data
        assert isinstance(data["recent_users"], list)
        
        # Check activity structure
        assert "activity" in data
        assert isinstance(data["activity"], list)
        
        print(f"✓ Analytics dashboard returns data: {data['stats']['total_users']} total users")
    
    def test_analytics_stats_endpoint(self, auth_token):
        """Test analytics stats endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        print(f"✓ Analytics stats endpoint working: {data['total_users']} users")
    
    def test_analytics_users_endpoint(self, auth_token):
        """Test analytics users list endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Analytics users endpoint working: {len(data)} users returned")


class TestHeaderNavigation:
    """Test that header navigation includes Analytics link for authenticated users"""
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint returns user data"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_ai_advisor@test.com",
            "password": "TestPass123!"
        })
        if login_response.status_code != 200:
            pytest.skip("Could not login")
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        print("✓ Auth /me endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
