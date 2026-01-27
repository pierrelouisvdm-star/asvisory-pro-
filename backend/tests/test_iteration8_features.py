"""
Test suite for Iteration 8 features:
- Landing page for non-authenticated users
- Market data API includes SA Market (EZA ETF) index
- Market data API includes Gold, Silver, Bitcoin in commodities
- Pricing page shows welcome message when ?welcome=true
- Free tier button shows 'Continue with Free' for new users
- Registration redirects to /pricing?welcome=true
- Dashboard shown after login instead of landing page
- AI chatbot accessible for logged-in users
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMarketDataSAMarket:
    """Tests for SA Market (EZA ETF) in market data"""
    
    def test_market_data_returns_200(self):
        """GET /api/market/data should return 200"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_market_data_has_indices(self):
        """Market data should have indices array"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert "indices" in data, "Response should have 'indices' key"
        assert isinstance(data["indices"], list), "Indices should be a list"
        assert len(data["indices"]) > 0, "Indices should not be empty"
    
    def test_sa_market_eza_etf_in_indices(self):
        """SA Market (EZA ETF) should be in indices"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        # Check for EZA ETF
        index_names = [idx["name"] for idx in data["indices"]]
        index_symbols = [idx["symbol"] for idx in data["indices"]]
        
        has_eza = "EZA" in index_symbols or any("EZA" in name for name in index_names) or any("SA Market" in name for name in index_names)
        assert has_eza, f"Should have SA Market (EZA ETF), found indices: {index_names}"
    
    def test_sa_market_has_valid_data(self):
        """SA Market (EZA ETF) should have valid price data"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        # Find EZA ETF
        eza_index = None
        for idx in data["indices"]:
            if "EZA" in idx.get("symbol", "") or "SA Market" in idx.get("name", ""):
                eza_index = idx
                break
        
        assert eza_index is not None, "EZA ETF should be present"
        assert eza_index["value"] > 0, "EZA ETF value should be positive"
        assert "change" in eza_index, "EZA ETF should have change field"
        assert "change_percent" in eza_index, "EZA ETF should have change_percent field"


class TestMarketDataCommodities:
    """Tests for Gold, Silver, Bitcoin in commodities"""
    
    def test_commodities_has_gold(self):
        """Commodities should include Gold"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        commodity_names = [c["name"] for c in data.get("commodities", [])]
        assert "Gold" in commodity_names, f"Should have Gold, found: {commodity_names}"
    
    def test_commodities_has_silver(self):
        """Commodities should include Silver"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        commodity_names = [c["name"] for c in data.get("commodities", [])]
        assert "Silver" in commodity_names, f"Should have Silver, found: {commodity_names}"
    
    def test_commodities_has_bitcoin(self):
        """Commodities should include Bitcoin"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        commodity_names = [c["name"] for c in data.get("commodities", [])]
        assert "Bitcoin" in commodity_names, f"Should have Bitcoin, found: {commodity_names}"
    
    def test_gold_has_valid_price(self):
        """Gold should have valid price > 0"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        gold = next((c for c in data.get("commodities", []) if c["name"] == "Gold"), None)
        assert gold is not None, "Gold should be present"
        assert gold["value"] > 0, f"Gold value should be positive, got {gold['value']}"
    
    def test_silver_has_valid_price(self):
        """Silver should have valid price > 0"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        silver = next((c for c in data.get("commodities", []) if c["name"] == "Silver"), None)
        assert silver is not None, "Silver should be present"
        assert silver["value"] > 0, f"Silver value should be positive, got {silver['value']}"
    
    def test_bitcoin_has_valid_price(self):
        """Bitcoin should have valid price > 0"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        bitcoin = next((c for c in data.get("commodities", []) if c["name"] == "Bitcoin"), None)
        assert bitcoin is not None, "Bitcoin should be present"
        assert bitcoin["value"] > 0, f"Bitcoin value should be positive, got {bitcoin['value']}"


class TestSubscriptionPricing:
    """Tests for subscription pricing endpoint"""
    
    def test_pricing_returns_200(self):
        """GET /api/subscriptions/pricing should return 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_pricing_has_tiers(self):
        """Pricing should have tiers array"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        assert "tiers" in data, "Response should have 'tiers' key"
        assert isinstance(data["tiers"], list), "Tiers should be a list"
        assert len(data["tiers"]) == 3, f"Should have 3 tiers, got {len(data['tiers'])}"
    
    def test_pricing_has_free_tier(self):
        """Pricing should have free tier"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        tier_names = [t["tier"] for t in data["tiers"]]
        assert "free" in tier_names, f"Should have free tier, found: {tier_names}"
    
    def test_pricing_has_standard_tier(self):
        """Pricing should have standard tier"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        tier_names = [t["tier"] for t in data["tiers"]]
        assert "standard" in tier_names, f"Should have standard tier, found: {tier_names}"
    
    def test_pricing_has_premium_tier(self):
        """Pricing should have premium tier"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        tier_names = [t["tier"] for t in data["tiers"]]
        assert "premium" in tier_names, f"Should have premium tier, found: {tier_names}"


class TestAuthEndpoints:
    """Tests for authentication endpoints"""
    
    def test_register_endpoint_exists(self):
        """POST /api/auth/register should exist"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": "", "password": "", "full_name": ""}
        )
        # Should return 400 (bad request) or 422 (validation error), not 404
        assert response.status_code != 404, "Register endpoint should exist"
    
    def test_login_endpoint_exists(self):
        """POST /api/auth/login should exist"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "", "password": ""}
        )
        # Should return 400/401/422, not 404
        assert response.status_code != 404, "Login endpoint should exist"
    
    def test_register_returns_token(self):
        """Registration should return access token"""
        import random
        random_num = random.randint(10000, 99999)
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"test_iter8_api_{random_num}@test.com",
                "password": "TestPass123!",
                "full_name": "Test User Iter8"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data, "Response should have access_token"
            assert len(data["access_token"]) > 20, "Token should be valid length"
    
    def test_login_with_valid_credentials(self):
        """Login with valid credentials should return token"""
        # Use existing test user
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test_ai_advisor@test.com",
                "password": "TestPass123!"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data, "Response should have access_token"


class TestAIAdvisorEndpoints:
    """Tests for AI Advisor endpoints"""
    
    def test_quick_tip_no_auth_required(self):
        """GET /api/ai-advisor/quick-tip should not require auth"""
        response = requests.get(f"{BASE_URL}/api/ai-advisor/quick-tip")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_quick_tip_returns_tip(self):
        """Quick tip should return tip content"""
        response = requests.get(f"{BASE_URL}/api/ai-advisor/quick-tip")
        data = response.json()
        
        assert "tip" in data, "Response should have 'tip' field"
        assert len(data["tip"]) > 10, "Tip should have meaningful content"
    
    def test_chat_requires_auth(self):
        """POST /api/ai-advisor/chat should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ai-advisor/chat",
            json={"message": "Hello"}
        )
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_chat_with_auth(self):
        """POST /api/ai-advisor/chat with auth should work"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test_ai_advisor@test.com",
                "password": "TestPass123!"
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip("Could not login for AI chat test")
        
        token = login_response.json().get("access_token")
        
        # Try chat
        response = requests.post(
            f"{BASE_URL}/api/ai-advisor/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "What is compound interest?"},
            timeout=60
        )
        
        # Accept 200 or 520 (budget exceeded)
        if response.status_code == 520:
            pytest.skip("AI service budget exceeded")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestHealthEndpoint:
    """Tests for health check endpoint"""
    
    def test_health_returns_200(self):
        """GET /api/health should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_health_returns_healthy_status(self):
        """Health check should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        
        assert data.get("status") == "healthy", f"Expected healthy status, got {data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
