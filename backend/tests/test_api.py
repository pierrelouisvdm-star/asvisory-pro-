"""
Backend API Tests for WealthCalc Financial Advisor Application
Tests: Auth (register/login), Clients CRUD, Financial Data, Shortfall Analysis
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_"


class TestHealthCheck:
    """Health check endpoint tests - run first"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "wealthcalc-api"
        print("✓ Health check passed")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self):
        """Test user registration"""
        unique_email = f"{TEST_PREFIX}user_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Test User",
            "company": "Test Company"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["full_name"] == "Test User"
        assert "id" in data["user"]
        print(f"✓ User registration passed - email: {unique_email}")
        return data
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails"""
        unique_email = f"{TEST_PREFIX}dup_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Test User",
            "company": "Test Company"
        }
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response1.status_code == 200
        
        # Duplicate registration should fail
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response2.status_code == 400
        data = response2.json()
        assert "already registered" in data["detail"].lower()
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        # First register a user
        unique_email = f"{TEST_PREFIX}login_{uuid.uuid4().hex[:8]}@test.com"
        register_payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Login Test User"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert reg_response.status_code == 200
        
        # Now login
        login_payload = {
            "email": unique_email,
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        print(f"✓ Login success - email: {unique_email}")
        return data
    
    def test_login_invalid_password(self):
        """Test login with wrong password"""
        # First register a user
        unique_email = f"{TEST_PREFIX}wrongpw_{uuid.uuid4().hex[:8]}@test.com"
        register_payload = {
            "email": unique_email,
            "password": "correctpass",
            "full_name": "Wrong Password Test"
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        
        # Try login with wrong password
        login_payload = {
            "email": unique_email,
            "password": "wrongpassword"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()
        print("✓ Invalid password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        login_payload = {
            "email": "nonexistent@test.com",
            "password": "anypassword"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 401
        print("✓ Non-existent user login correctly rejected")


class TestClientEndpoints:
    """Client CRUD endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a test user and get auth token"""
        unique_email = f"{TEST_PREFIX}client_test_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Client Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            self.user_id = data["user"]["id"]
        else:
            # User might exist, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": unique_email,
                "password": "testpass123"
            })
            data = login_response.json()
            self.token = data["access_token"]
            self.user_id = data["user"]["id"]
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_create_client(self):
        """Test creating a new client"""
        client_data = {
            "first_name": f"{TEST_PREFIX}John",
            "last_name": "Doe",
            "email": "john.doe@client.com",
            "phone": "+27123456789",
            "occupation": "Software Engineer"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        assert response.status_code == 200, f"Create client failed: {response.text}"
        
        data = response.json()
        assert data["first_name"] == f"{TEST_PREFIX}John"
        assert data["last_name"] == "Doe"
        assert data["email"] == "john.doe@client.com"
        assert "id" in data
        assert data["advisor_id"] == self.user_id
        print(f"✓ Client created - ID: {data['id']}")
        return data
    
    def test_get_clients_list(self):
        """Test getting list of clients"""
        # First create a client
        client_data = {
            "first_name": f"{TEST_PREFIX}List",
            "last_name": "Test",
            "email": "list.test@client.com"
        }
        requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        
        # Get clients list
        response = requests.get(f"{BASE_URL}/api/clients", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Clients list retrieved - count: {len(data)}")
    
    def test_get_client_by_id(self):
        """Test getting a specific client"""
        # Create client
        client_data = {
            "first_name": f"{TEST_PREFIX}GetById",
            "last_name": "Test"
        }
        create_response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        created = create_response.json()
        client_id = created["id"]
        
        # Get by ID
        response = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == client_id
        assert data["first_name"] == f"{TEST_PREFIX}GetById"
        print(f"✓ Client retrieved by ID: {client_id}")
    
    def test_update_client(self):
        """Test updating client information"""
        # Create client
        client_data = {
            "first_name": f"{TEST_PREFIX}Update",
            "last_name": "Original"
        }
        create_response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        created = create_response.json()
        client_id = created["id"]
        
        # Update client
        update_data = {
            "last_name": "Updated",
            "occupation": "Financial Analyst"
        }
        response = requests.put(f"{BASE_URL}/api/clients/{client_id}", json=update_data, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["last_name"] == "Updated"
        assert data["occupation"] == "Financial Analyst"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=self.headers)
        fetched = get_response.json()
        assert fetched["last_name"] == "Updated"
        print(f"✓ Client updated and verified - ID: {client_id}")
    
    def test_delete_client(self):
        """Test deleting a client"""
        # Create client
        client_data = {
            "first_name": f"{TEST_PREFIX}Delete",
            "last_name": "Me"
        }
        create_response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        created = create_response.json()
        client_id = created["id"]
        
        # Delete client
        response = requests.delete(f"{BASE_URL}/api/clients/{client_id}", headers=self.headers)
        assert response.status_code == 200
        
        # Verify deletion with GET
        get_response = requests.get(f"{BASE_URL}/api/clients/{client_id}", headers=self.headers)
        assert get_response.status_code == 404
        print(f"✓ Client deleted and verified - ID: {client_id}")
    
    def test_get_nonexistent_client(self):
        """Test getting a non-existent client returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/clients/{fake_id}", headers=self.headers)
        assert response.status_code == 404
        print("✓ Non-existent client correctly returns 404")
    
    def test_unauthorized_access(self):
        """Test accessing clients without auth token"""
        response = requests.get(f"{BASE_URL}/api/clients")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access correctly rejected")


class TestFinancialDataEndpoints:
    """Financial data update and analysis endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a test user and client"""
        unique_email = f"{TEST_PREFIX}financial_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Financial Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        data = response.json()
        self.token = data["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Create a test client
        client_data = {
            "first_name": f"{TEST_PREFIX}Financial",
            "last_name": "Client"
        }
        client_response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        self.client = client_response.json()
        self.client_id = self.client["id"]
    
    def test_update_financial_data(self):
        """Test updating client's financial data"""
        financial_data = {
            "monthly_income": 50000,
            "monthly_expenses": 35000,
            "total_assets": 2000000,
            "total_liabilities": 500000,
            "life_insurance_coverage": 1000000,
            "life_insurance_needed": 3000000,
            "emergency_fund_current": 50000,
            "emergency_fund_needed": 150000,
            "retirement_savings": 500000,
            "retirement_goal": 5000000,
            "years_to_retirement": 20
        }
        
        response = requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Update financial data failed: {response.text}"
        
        data = response.json()
        assert data["financial_data"]["monthly_income"] == 50000
        assert data["financial_data"]["life_insurance_coverage"] == 1000000
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/clients/{self.client_id}", headers=self.headers)
        fetched = get_response.json()
        assert fetched["financial_data"]["monthly_income"] == 50000
        print(f"✓ Financial data updated and verified - Client ID: {self.client_id}")
    
    def test_get_financial_analysis(self):
        """Test getting financial plan analysis with shortfalls"""
        # First update financial data with gaps
        financial_data = {
            "monthly_income": 50000,
            "monthly_expenses": 45000,  # Low savings rate
            "total_assets": 1000000,
            "total_liabilities": 800000,  # High debt ratio
            "life_insurance_coverage": 500000,
            "life_insurance_needed": 3000000,  # Big gap
            "emergency_fund_current": 20000,
            "emergency_fund_needed": 150000,  # Big gap
            "retirement_savings": 200000,
            "retirement_goal": 5000000,
            "years_to_retirement": 25,
            "disability_coverage": 10000  # Low coverage
        }
        
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        # Get analysis
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get analysis failed: {response.text}"
        
        data = response.json()
        
        # Verify analysis structure
        assert "overall_score" in data
        assert "health_rating" in data
        assert "total_shortfalls" in data
        assert "critical_shortfalls" in data
        assert "high_priority_shortfalls" in data
        assert "medium_priority_shortfalls" in data
        assert "low_priority_shortfalls" in data
        assert "total_gap_amount" in data
        assert "estimated_monthly_investment_needed" in data
        
        # Should have shortfalls based on the data
        assert data["total_shortfalls"] > 0, "Expected shortfalls based on financial gaps"
        
        # Verify shortfall structure
        all_shortfalls = (
            data["critical_shortfalls"] + 
            data["high_priority_shortfalls"] + 
            data["medium_priority_shortfalls"] + 
            data["low_priority_shortfalls"]
        )
        
        if all_shortfalls:
            shortfall = all_shortfalls[0]
            assert "category" in shortfall
            assert "priority" in shortfall
            assert "title" in shortfall
            assert "description" in shortfall
            assert "current_value" in shortfall
            assert "target_value" in shortfall
            assert "gap" in shortfall
            assert "recommendation" in shortfall
            assert "action_items" in shortfall
        
        print(f"✓ Financial analysis retrieved - Score: {data['overall_score']}, Shortfalls: {data['total_shortfalls']}")
        return data
    
    def test_refresh_analysis(self):
        """Test refreshing financial analysis"""
        # Setup financial data
        financial_data = {
            "monthly_income": 60000,
            "monthly_expenses": 40000,
            "life_insurance_coverage": 1000000,
            "life_insurance_needed": 2000000
        }
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        # Refresh analysis
        response = requests.post(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis/refresh",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "overall_score" in data
        print(f"✓ Analysis refreshed - Score: {data['overall_score']}")
    
    def test_analysis_with_no_shortfalls(self):
        """Test analysis when client has good financial health"""
        # Setup good financial data
        financial_data = {
            "monthly_income": 100000,
            "monthly_expenses": 50000,  # Good savings rate (50%)
            "total_assets": 5000000,
            "total_liabilities": 500000,  # Low debt ratio (10%)
            "life_insurance_coverage": 5000000,
            "life_insurance_needed": 3000000,  # Over-insured
            "emergency_fund_current": 300000,
            "emergency_fund_needed": 150000,  # Fully funded
            "retirement_savings": 3000000,
            "retirement_goal": 2000000,  # Already met
            "years_to_retirement": 20,
            "disability_coverage": 80000  # Good coverage
        }
        
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should have high score with good financial health
        assert data["overall_score"] >= 70, f"Expected high score, got {data['overall_score']}"
        assert data["health_rating"] in ["Good", "Excellent"]
        print(f"✓ Good financial health analysis - Score: {data['overall_score']}, Rating: {data['health_rating']}")


class TestShortfallAnalysisLogic:
    """Test specific shortfall analysis scenarios"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a test user and client"""
        unique_email = f"{TEST_PREFIX}shortfall_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Shortfall Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        data = response.json()
        self.token = data["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Create a test client
        client_data = {
            "first_name": f"{TEST_PREFIX}Shortfall",
            "last_name": "Analysis"
        }
        client_response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=self.headers)
        self.client = client_response.json()
        self.client_id = self.client["id"]
    
    def test_life_insurance_shortfall_critical(self):
        """Test critical life insurance shortfall detection"""
        financial_data = {
            "life_insurance_coverage": 100000,
            "life_insurance_needed": 3000000  # 97% gap - should be critical
        }
        
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis",
            headers=self.headers
        )
        data = response.json()
        
        # Should have critical life insurance shortfall
        life_insurance_shortfalls = [
            s for s in data["critical_shortfalls"] 
            if s["category"] == "life_insurance"
        ]
        assert len(life_insurance_shortfalls) > 0, "Expected critical life insurance shortfall"
        print("✓ Critical life insurance shortfall correctly identified")
    
    def test_emergency_fund_shortfall(self):
        """Test emergency fund shortfall detection"""
        financial_data = {
            "emergency_fund_current": 10000,
            "emergency_fund_needed": 100000  # 90% gap
        }
        
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis",
            headers=self.headers
        )
        data = response.json()
        
        # Should have emergency fund shortfall
        all_shortfalls = (
            data["critical_shortfalls"] + 
            data["high_priority_shortfalls"] + 
            data["medium_priority_shortfalls"]
        )
        emergency_shortfalls = [s for s in all_shortfalls if s["category"] == "emergency_fund"]
        assert len(emergency_shortfalls) > 0, "Expected emergency fund shortfall"
        print("✓ Emergency fund shortfall correctly identified")
    
    def test_high_debt_ratio_shortfall(self):
        """Test high debt-to-asset ratio shortfall detection"""
        financial_data = {
            "total_assets": 1000000,
            "total_liabilities": 900000,  # 90% debt ratio - should be critical
            "other_debt": 200000
        }
        
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis",
            headers=self.headers
        )
        data = response.json()
        
        # Should have debt shortfall
        all_shortfalls = data["critical_shortfalls"] + data["high_priority_shortfalls"]
        debt_shortfalls = [s for s in all_shortfalls if s["category"] == "debt"]
        assert len(debt_shortfalls) > 0, "Expected debt ratio shortfall"
        print("✓ High debt ratio shortfall correctly identified")
    
    def test_low_savings_rate_shortfall(self):
        """Test low savings rate shortfall detection"""
        financial_data = {
            "monthly_income": 50000,
            "monthly_expenses": 48000  # Only 4% savings rate
        }
        
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/clients/{self.client_id}/analysis",
            headers=self.headers
        )
        data = response.json()
        
        # Should have budget/savings shortfall
        all_shortfalls = (
            data["critical_shortfalls"] + 
            data["high_priority_shortfalls"] + 
            data["medium_priority_shortfalls"]
        )
        budget_shortfalls = [s for s in all_shortfalls if s["category"] == "budget"]
        assert len(budget_shortfalls) > 0, "Expected low savings rate shortfall"
        print("✓ Low savings rate shortfall correctly identified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
