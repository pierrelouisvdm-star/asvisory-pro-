"""
Test suite for Subscription and Market Data APIs
Tests: GET /api/subscriptions/pricing, GET /api/market/data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubscriptionPricing:
    """Tests for subscription pricing endpoint"""
    
    def test_get_pricing_returns_200(self):
        """GET /api/subscriptions/pricing should return 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_pricing_has_three_tiers(self):
        """Pricing should return exactly 3 tiers: free, standard, premium"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        assert "tiers" in data, "Response should have 'tiers' key"
        assert len(data["tiers"]) == 3, f"Expected 3 tiers, got {len(data['tiers'])}"
        
        tier_names = [t["tier"] for t in data["tiers"]]
        assert "free" in tier_names, "Should have 'free' tier"
        assert "standard" in tier_names, "Should have 'standard' tier"
        assert "premium" in tier_names, "Should have 'premium' tier"
    
    def test_free_tier_pricing(self):
        """Free tier should have R0 monthly and annual price"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        free_tier = next((t for t in data["tiers"] if t["tier"] == "free"), None)
        assert free_tier is not None, "Free tier not found"
        assert free_tier["monthly_price"] == 0, "Free tier monthly should be R0"
        assert free_tier["annual_price"] == 0, "Free tier annual should be R0"
        assert free_tier["name"] == "Free", "Free tier name should be 'Free'"
    
    def test_standard_tier_pricing(self):
        """Standard tier should have R49/month and R490/year"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        standard_tier = next((t for t in data["tiers"] if t["tier"] == "standard"), None)
        assert standard_tier is not None, "Standard tier not found"
        assert standard_tier["monthly_price"] == 49.0, f"Standard monthly should be R49, got {standard_tier['monthly_price']}"
        assert standard_tier["annual_price"] == 490.0, f"Standard annual should be R490, got {standard_tier['annual_price']}"
        assert standard_tier["name"] == "Standard", "Standard tier name should be 'Standard'"
    
    def test_premium_tier_pricing(self):
        """Premium tier should have R149/month and R1490/year"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        premium_tier = next((t for t in data["tiers"] if t["tier"] == "premium"), None)
        assert premium_tier is not None, "Premium tier not found"
        assert premium_tier["monthly_price"] == 149.0, f"Premium monthly should be R149, got {premium_tier['monthly_price']}"
        assert premium_tier["annual_price"] == 1490.0, f"Premium annual should be R1490, got {premium_tier['annual_price']}"
        assert premium_tier["name"] == "Premium", "Premium tier name should be 'Premium'"
    
    def test_free_tier_features(self):
        """Free tier should have 4 calculators and no client management"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        free_tier = next((t for t in data["tiers"] if t["tier"] == "free"), None)
        features = free_tier["features"]
        
        # Free tier should have 4 calculators
        assert isinstance(features["calculators"], list), "Free tier calculators should be a list"
        assert len(features["calculators"]) == 4, f"Free tier should have 4 calculators, got {len(features['calculators'])}"
        
        # Free tier should have no client management
        assert features["max_clients"] == 0, "Free tier should have 0 max_clients"
        assert features["pdf_reports"] == False, "Free tier should not have PDF reports"
    
    def test_standard_tier_features(self):
        """Standard tier should have all calculators and 5 clients"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        standard_tier = next((t for t in data["tiers"] if t["tier"] == "standard"), None)
        features = standard_tier["features"]
        
        assert features["calculators"] == "all", "Standard tier should have all calculators"
        assert features["max_clients"] == 5, f"Standard tier should have 5 max_clients, got {features['max_clients']}"
        assert features["pdf_reports"] == True, "Standard tier should have PDF reports"
        assert features["market_tracker"] == True, "Standard tier should have market tracker"
    
    def test_premium_tier_features(self):
        """Premium tier should have unlimited clients and all features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        premium_tier = next((t for t in data["tiers"] if t["tier"] == "premium"), None)
        features = premium_tier["features"]
        
        assert features["calculators"] == "all", "Premium tier should have all calculators"
        assert features["max_clients"] == -1, f"Premium tier should have unlimited (-1) clients, got {features['max_clients']}"
        assert features["pdf_reports"] == True, "Premium tier should have PDF reports"
        assert features["advanced_tools"] == True, "Premium tier should have advanced tools"
        assert features["market_tracker"] == True, "Premium tier should have market tracker"
        assert features["goal_planner"] == True, "Premium tier should have goal planner"
        assert features["meeting_scheduler"] == True, "Premium tier should have meeting scheduler"
        assert features["portfolio_tracker"] == True, "Premium tier should have portfolio tracker"
    
    def test_trial_days_included(self):
        """Pricing response should include trial_days"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/pricing")
        data = response.json()
        
        assert "trial_days" in data, "Response should include trial_days"
        assert data["trial_days"] == 7, f"Trial days should be 7, got {data['trial_days']}"


class TestMarketData:
    """Tests for market data endpoint"""
    
    def test_get_market_data_returns_200(self):
        """GET /api/market/data should return 200"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_market_data_has_indices(self):
        """Market data should include indices array"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert "indices" in data, "Response should have 'indices' key"
        assert isinstance(data["indices"], list), "Indices should be a list"
        assert len(data["indices"]) > 0, "Should have at least one index"
    
    def test_market_data_has_currencies(self):
        """Market data should include currencies array"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert "currencies" in data, "Response should have 'currencies' key"
        assert isinstance(data["currencies"], list), "Currencies should be a list"
        assert len(data["currencies"]) > 0, "Should have at least one currency pair"
    
    def test_market_data_has_timestamps(self):
        """Market data should include last_updated and next_update"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        assert "last_updated" in data, "Response should have 'last_updated'"
        assert "next_update" in data, "Response should have 'next_update'"
    
    def test_index_structure(self):
        """Each index should have required fields"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        if len(data["indices"]) > 0:
            index = data["indices"][0]
            assert "symbol" in index, "Index should have 'symbol'"
            assert "name" in index, "Index should have 'name'"
            assert "value" in index, "Index should have 'value'"
            assert "change" in index, "Index should have 'change'"
            assert "change_percent" in index, "Index should have 'change_percent'"
    
    def test_currency_structure(self):
        """Each currency pair should have required fields"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        if len(data["currencies"]) > 0:
            currency = data["currencies"][0]
            assert "pair" in currency, "Currency should have 'pair'"
            assert "base" in currency, "Currency should have 'base'"
            assert "quote" in currency, "Currency should have 'quote'"
            assert "rate" in currency, "Currency should have 'rate'"
            assert "change" in currency, "Currency should have 'change'"
            assert "change_percent" in currency, "Currency should have 'change_percent'"
    
    def test_has_major_indices(self):
        """Market data should include major indices (Nasdaq, S&P 500, Nifty 50)"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        index_names = [idx["name"] for idx in data["indices"]]
        
        # Check for major indices (at least some should be present)
        major_indices = ["Nasdaq Composite", "S&P 500", "Nifty 50"]
        found_indices = [idx for idx in major_indices if idx in index_names]
        
        assert len(found_indices) >= 2, f"Should have at least 2 major indices, found: {found_indices}"
    
    def test_has_zar_currency_pairs(self):
        """Market data should include currency pairs to ZAR"""
        response = requests.get(f"{BASE_URL}/api/market/data", timeout=30)
        data = response.json()
        
        currency_pairs = [cur["pair"] for cur in data["currencies"]]
        
        # Check for ZAR pairs
        zar_pairs = [p for p in currency_pairs if "ZAR" in p]
        assert len(zar_pairs) >= 3, f"Should have at least 3 ZAR pairs, found: {zar_pairs}"
        
        # Check for USD/ZAR specifically
        assert "USD/ZAR" in currency_pairs, "Should have USD/ZAR pair"


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Health endpoint should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
