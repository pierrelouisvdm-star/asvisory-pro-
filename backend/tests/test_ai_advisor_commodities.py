"""
Test suite for AI Advisor and Commodities features
Tests: 
- GET /api/ai-advisor/quick-tip (no auth required)
- POST /api/ai-advisor/chat (auth required, premium feature)
- GET /api/market/data - commodities array
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAIAdvisorQuickTip:
    """Tests for AI Advisor quick tip endpoint (no auth required)"""
    
    def test_quick_tip_returns_200(self):
        """GET /api/ai-advisor/quick-tip should return 200"""
        response = requests.get(f"{BASE_URL}/api/ai-advisor/quick-tip")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_quick_tip_has_tip_field(self):
        """Quick tip response should have 'tip' field"""
        response = requests.get(f"{BASE_URL}/api/ai-advisor/quick-tip")
        data = response.json()
        
        assert "tip" in data, "Response should have 'tip' field"
        assert isinstance(data["tip"], str), "Tip should be a string"
        assert len(data["tip"]) > 10, "Tip should have meaningful content"
    
    def test_quick_tip_has_topic_field(self):
        """Quick tip response should have 'topic' field"""
        response = requests.get(f"{BASE_URL}/api/ai-advisor/quick-tip")
        data = response.json()
        
        assert "topic" in data, "Response should have 'topic' field"
    
    def test_quick_tip_with_topic_param(self):
        """Quick tip should accept topic parameter"""
        topics = ["savings", "investing", "debt", "retirement", "general"]
        
        for topic in topics:
            response = requests.get(f"{BASE_URL}/api/ai-advisor/quick-tip?topic={topic}")
            assert response.status_code == 200, f"Expected 200 for topic={topic}, got {response.status_code}"
            data = response.json()
            assert "tip" in data, f"Response for topic={topic} should have 'tip'"


class TestAIAdvisorChat:
    """Tests for AI Advisor chat endpoint (auth required)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token by registering/logging in a test user"""
        # Try to register a new user
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "test_ai_chat_user@test.com",
                "password": "TestPass123!",
                "full_name": "Test AI Chat User"
            }
        )
        
        if register_response.status_code == 200:
            return register_response.json().get("access_token")
        
        # If registration fails (user exists), try login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test_ai_chat_user@test.com",
                "password": "TestPass123!"
            }
        )
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        
        pytest.skip("Could not authenticate for AI chat tests")
    
    def test_chat_requires_auth(self):
        """POST /api/ai-advisor/chat should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ai-advisor/chat",
            json={"message": "What is compound interest?"}
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
    
    def test_chat_with_auth_returns_response(self, auth_token):
        """POST /api/ai-advisor/chat with auth should return AI response"""
        response = requests.post(
            f"{BASE_URL}/api/ai-advisor/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"message": "What is compound interest?"},
            timeout=60  # AI responses can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "response" in data, "Response should have 'response' field"
        assert "session_id" in data, "Response should have 'session_id' field"
        assert len(data["response"]) > 50, "AI response should have meaningful content"
    
    def test_chat_response_contains_financial_content(self, auth_token):
        """AI chat response should contain relevant financial content"""
        response = requests.post(
            f"{BASE_URL}/api/ai-advisor/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"message": "Explain compound interest in simple terms"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            response_text = data["response"].lower()
            
            # Check for relevant financial terms
            financial_terms = ["interest", "compound", "money", "invest", "grow"]
            found_terms = [term for term in financial_terms if term in response_text]
            
            assert len(found_terms) >= 2, f"Response should contain financial terms, found: {found_terms}"


class TestMarketDataCommodities:
    """Tests for commodities in market data"""
    
    def test_market_data_has_commodities(self):
        """Market data should include commodities array"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert "commodities" in data, "Response should have 'commodities' key"
        assert isinstance(data["commodities"], list), "Commodities should be a list"
    
    def test_commodities_has_three_items(self):
        """Commodities array should have 3 items (Gold, Silver, Bitcoin)"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert len(data["commodities"]) == 3, f"Expected 3 commodities, got {len(data['commodities'])}"
    
    def test_commodities_has_gold(self):
        """Commodities should include Gold"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        commodity_names = [c["name"] for c in data["commodities"]]
        assert "Gold" in commodity_names, f"Should have Gold, found: {commodity_names}"
    
    def test_commodities_has_silver(self):
        """Commodities should include Silver"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        commodity_names = [c["name"] for c in data["commodities"]]
        assert "Silver" in commodity_names, f"Should have Silver, found: {commodity_names}"
    
    def test_commodities_has_bitcoin(self):
        """Commodities should include Bitcoin"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        commodity_names = [c["name"] for c in data["commodities"]]
        assert "Bitcoin" in commodity_names, f"Should have Bitcoin, found: {commodity_names}"
    
    def test_commodity_structure(self):
        """Each commodity should have required fields"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        if len(data["commodities"]) > 0:
            commodity = data["commodities"][0]
            assert "symbol" in commodity, "Commodity should have 'symbol'"
            assert "name" in commodity, "Commodity should have 'name'"
            assert "value" in commodity, "Commodity should have 'value'"
            assert "change" in commodity, "Commodity should have 'change'"
            assert "change_percent" in commodity, "Commodity should have 'change_percent'"
            assert "unit" in commodity, "Commodity should have 'unit'"
    
    def test_commodity_values_are_positive(self):
        """Commodity values should be positive numbers"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        for commodity in data["commodities"]:
            assert commodity["value"] > 0, f"{commodity['name']} value should be positive"


class TestMarketTrackerTabs:
    """Tests to verify market tracker has 3 tabs worth of data"""
    
    def test_indices_tab_data(self):
        """Indices tab should have data (4 indices)"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert len(data["indices"]) == 4, f"Expected 4 indices, got {len(data['indices'])}"
    
    def test_commodities_tab_data(self):
        """Commodities tab should have data (3 commodities)"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert len(data["commodities"]) == 3, f"Expected 3 commodities, got {len(data['commodities'])}"
    
    def test_currencies_tab_data(self):
        """Currencies tab should have data (8 currency pairs)"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert len(data["currencies"]) == 8, f"Expected 8 currencies, got {len(data['currencies'])}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
