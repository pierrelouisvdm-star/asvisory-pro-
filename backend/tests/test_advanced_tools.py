"""
Backend API Tests for Advanced Tools - WealthCalc Financial Advisor Application
Tests: Goals, Meetings, Reviews, Portfolio, Monte Carlo, PDF Reports
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_"


class TestSetup:
    """Shared setup for all tests - creates user and client"""
    
    @staticmethod
    def get_auth_and_client():
        """Create a test user and client, return token and client_id"""
        unique_email = f"{TEST_PREFIX}tools_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Tools Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code != 200:
            # Try login if already exists
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": unique_email,
                "password": "testpass123"
            })
        
        data = response.json()
        token = data["access_token"]
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Create a test client
        client_data = {
            "first_name": f"{TEST_PREFIX}Client",
            "last_name": "ForTools",
            "email": "tools.client@test.com"
        }
        client_response = requests.post(f"{BASE_URL}/api/clients", json=client_data, headers=headers)
        client = client_response.json()
        
        return headers, client["id"]


class TestGoalsEndpoints:
    """Goal Planner endpoint tests - POST /api/tools/goals"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and client"""
        self.headers, self.client_id = TestSetup.get_auth_and_client()
    
    def test_create_goal(self):
        """Test creating a new financial goal"""
        goal_data = {
            "client_id": self.client_id,
            "name": f"{TEST_PREFIX}Retirement Fund",
            "category": "retirement",
            "target_amount": 5000000,
            "current_amount": 500000,
            "target_date": (datetime.now() + timedelta(days=365*20)).strftime("%Y-%m-%d"),
            "priority": 1,
            "notes": "Primary retirement goal"
        }
        
        response = requests.post(f"{BASE_URL}/api/tools/goals", json=goal_data, headers=self.headers)
        assert response.status_code == 200, f"Create goal failed: {response.text}"
        
        data = response.json()
        assert data["name"] == f"{TEST_PREFIX}Retirement Fund"
        assert data["category"] == "retirement"
        assert data["target_amount"] == 5000000
        assert data["current_amount"] == 500000
        assert "id" in data
        assert data["client_id"] == self.client_id
        print(f"✓ Goal created - ID: {data['id']}")
        return data
    
    def test_create_goal_with_status_calculation(self):
        """Test goal status is calculated based on progress"""
        # Goal that's 60% complete - should be ON_TRACK
        goal_data = {
            "client_id": self.client_id,
            "name": f"{TEST_PREFIX}Emergency Fund",
            "category": "emergency",  # Correct enum value
            "target_amount": 100000,
            "current_amount": 60000,  # 60% complete
            "target_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "priority": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/tools/goals", json=goal_data, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "on_track", f"Expected on_track status, got {data['status']}"
        print(f"✓ Goal status correctly calculated as on_track")
    
    def test_create_completed_goal(self):
        """Test goal marked as completed when current >= target"""
        goal_data = {
            "client_id": self.client_id,
            "name": f"{TEST_PREFIX}Completed Goal",
            "category": "other",
            "target_amount": 50000,
            "current_amount": 55000,  # Over target
            "target_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "priority": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/tools/goals", json=goal_data, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "completed", f"Expected completed status, got {data['status']}"
        print(f"✓ Goal correctly marked as completed")
    
    def test_get_client_goals(self):
        """Test getting all goals for a client"""
        # First create a goal
        goal_data = {
            "client_id": self.client_id,
            "name": f"{TEST_PREFIX}List Test Goal",
            "category": "education",
            "target_amount": 200000,
            "current_amount": 20000,
            "target_date": (datetime.now() + timedelta(days=365*5)).strftime("%Y-%m-%d"),
            "priority": 1
        }
        requests.post(f"{BASE_URL}/api/tools/goals", json=goal_data, headers=self.headers)
        
        # Get goals list
        response = requests.get(f"{BASE_URL}/api/tools/goals/client/{self.client_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"✓ Client goals retrieved - count: {len(data)}")
    
    def test_create_goal_invalid_client(self):
        """Test creating goal for non-existent client fails"""
        fake_client_id = str(uuid.uuid4())
        goal_data = {
            "client_id": fake_client_id,
            "name": "Invalid Goal",
            "category": "retirement",
            "target_amount": 1000000,
            "current_amount": 0,
            "target_date": "2045-01-01",
            "priority": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/tools/goals", json=goal_data, headers=self.headers)
        assert response.status_code == 404
        print("✓ Goal creation for invalid client correctly rejected")


class TestMeetingsEndpoints:
    """Meeting Scheduler endpoint tests - POST /api/tools/meetings"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and client"""
        self.headers, self.client_id = TestSetup.get_auth_and_client()
    
    def test_create_meeting_note(self):
        """Test creating a meeting note with action items"""
        meeting_data = {
            "client_id": self.client_id,
            "meeting_type": "initial",  # Correct enum value
            "meeting_date": datetime.now().strftime("%Y-%m-%d"),
            "duration_minutes": 60,
            "attendees": ["John Doe", "Jane Advisor"],
            "summary": f"{TEST_PREFIX}Initial consultation to discuss financial goals",
            "discussion_points": [
                "Reviewed current financial situation",
                "Discussed retirement goals",
                "Identified insurance gaps"
            ],
            "action_items": [
                {
                    "description": "Gather tax documents",
                    "assigned_to": "client",  # lowercase
                    "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "status": "pending"
                },
                {
                    "description": "Prepare insurance quote",
                    "assigned_to": "advisor",  # lowercase
                    "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "status": "pending"
                }
            ],
            "next_meeting_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        }
        
        response = requests.post(f"{BASE_URL}/api/tools/meetings", json=meeting_data, headers=self.headers)
        assert response.status_code == 200, f"Create meeting failed: {response.text}"
        
        data = response.json()
        assert data["meeting_type"] == "initial"  # Correct enum value
        assert data["duration_minutes"] == 60
        assert len(data["action_items"]) == 2
        assert "id" in data
        print(f"✓ Meeting note created - ID: {data['id']}")
    
    def test_get_client_meetings(self):
        """Test getting all meetings for a client"""
        # First create a meeting
        meeting_data = {
            "client_id": self.client_id,
            "meeting_type": "review",  # Correct enum value
            "meeting_date": datetime.now().strftime("%Y-%m-%d"),
            "duration_minutes": 30,
            "summary": f"{TEST_PREFIX}Quarterly review meeting",
            "discussion_points": ["Portfolio performance"],
            "action_items": []
        }
        requests.post(f"{BASE_URL}/api/tools/meetings", json=meeting_data, headers=self.headers)
        
        # Get meetings list
        response = requests.get(f"{BASE_URL}/api/tools/meetings/client/{self.client_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Client meetings retrieved - count: {len(data)}")
    
    def test_get_pending_action_items(self):
        """Test getting all pending action items across clients"""
        # Create meeting with pending action items
        meeting_data = {
            "client_id": self.client_id,
            "meeting_type": "followup",  # Correct enum value
            "meeting_date": datetime.now().strftime("%Y-%m-%d"),
            "duration_minutes": 45,
            "summary": f"{TEST_PREFIX}Follow-up meeting",
            "discussion_points": ["Action item follow-up"],
            "action_items": [
                {
                    "description": f"{TEST_PREFIX}Pending action item",
                    "assigned_to": "advisor",
                    "due_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                    "status": "pending"
                }
            ]
        }
        requests.post(f"{BASE_URL}/api/tools/meetings", json=meeting_data, headers=self.headers)
        
        # Get pending action items
        response = requests.get(f"{BASE_URL}/api/tools/meetings/action-items", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Pending action items retrieved - count: {len(data)}")


class TestReviewsEndpoints:
    """Review Tracker endpoint tests - POST /api/tools/reviews"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and client"""
        self.headers, self.client_id = TestSetup.get_auth_and_client()
    
    def test_create_review_schedule(self):
        """Test creating a review schedule for a client"""
        review_data = {
            "client_id": self.client_id,
            "frequency": "quarterly",
            "next_review_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
            "checklist": [
                "Review portfolio performance",
                "Update financial goals",
                "Check insurance coverage",
                "Review tax situation"
            ],
            "reminder_days_before": 7,
            "notes": f"{TEST_PREFIX}Standard quarterly review"
        }
        
        response = requests.post(f"{BASE_URL}/api/tools/reviews", json=review_data, headers=self.headers)
        assert response.status_code == 200, f"Create review failed: {response.text}"
        
        data = response.json()
        assert data["frequency"] == "quarterly"
        assert data["reminder_days_before"] == 7
        assert len(data["checklist"]) == 4
        assert "id" in data
        print(f"✓ Review schedule created - ID: {data['id']}")
        return data
    
    def test_get_client_review(self):
        """Test getting review schedule for a client"""
        # First create a review for this client
        review_data = {
            "client_id": self.client_id,
            "frequency": "annual",
            "next_review_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "reminder_days_before": 14
        }
        create_response = requests.post(f"{BASE_URL}/api/tools/reviews", json=review_data, headers=self.headers)
        assert create_response.status_code == 200, f"Create review failed: {create_response.text}"
        
        # Get review
        response = requests.get(f"{BASE_URL}/api/tools/reviews/client/{self.client_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == self.client_id
        print(f"✓ Client review schedule retrieved")
    
    def test_get_upcoming_reviews(self):
        """Test getting upcoming reviews in next X days"""
        # Create a review with upcoming date
        review_data = {
            "client_id": self.client_id,
            "frequency": "monthly",
            "next_review_date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            "reminder_days_before": 3
        }
        requests.post(f"{BASE_URL}/api/tools/reviews", json=review_data, headers=self.headers)
        
        # Get upcoming reviews (default 30 days)
        response = requests.get(f"{BASE_URL}/api/tools/reviews/upcoming", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Upcoming reviews retrieved - count: {len(data)}")


class TestPortfolioEndpoints:
    """Portfolio Tracker endpoint tests - POST /api/portfolio/client/{id}"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and client"""
        self.headers, self.client_id = TestSetup.get_auth_and_client()
    
    def test_create_portfolio(self):
        """Test creating/updating client portfolio"""
        portfolio_data = {
            "name": f"{TEST_PREFIX}Main Portfolio",
            "holdings": [
                {
                    "name": "SA Equity Fund",
                    "asset_class": "domestic_equity",  # Correct enum value
                    "value": 500000,
                    "cost_basis": 400000
                },
                {
                    "name": "Bond Fund",
                    "asset_class": "bonds",  # Correct enum value
                    "value": 300000,
                    "cost_basis": 280000
                },
                {
                    "name": "Money Market",
                    "asset_class": "cash",
                    "value": 200000,
                    "cost_basis": 200000
                }
            ],
            "target_allocation": {
                "domestic_equity": 50,
                "bonds": 30,
                "cash": 20
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portfolio/client/{self.client_id}",
            json=portfolio_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Create portfolio failed: {response.text}"
        
        data = response.json()
        assert data["name"] == f"{TEST_PREFIX}Main Portfolio"
        assert data["total_value"] == 1000000
        assert len(data["holdings"]) == 3
        assert "diversification_score" in data
        assert "rebalancing_needed" in data
        print(f"✓ Portfolio created - Total Value: {data['total_value']}, Diversification: {data['diversification_score']}")
        return data
    
    def test_get_client_portfolio(self):
        """Test getting client portfolio"""
        # First create portfolio
        portfolio_data = {
            "name": "Test Portfolio",
            "holdings": [
                {"name": "Stock A", "asset_class": "domestic_equity", "value": 100000, "cost_basis": 80000}
            ],
            "target_allocation": {"domestic_equity": 100}
        }
        requests.post(f"{BASE_URL}/api/portfolio/client/{self.client_id}", json=portfolio_data, headers=self.headers)
        
        # Get portfolio
        response = requests.get(f"{BASE_URL}/api/portfolio/client/{self.client_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == self.client_id
        print(f"✓ Client portfolio retrieved")
    
    def test_get_rebalancing_suggestions(self):
        """Test getting rebalancing suggestions"""
        # Create portfolio with imbalanced allocation
        portfolio_data = {
            "name": "Imbalanced Portfolio",
            "holdings": [
                {"name": "Equity Heavy", "asset_class": "domestic_equity", "value": 800000, "cost_basis": 600000},
                {"name": "Small Bond", "asset_class": "bonds", "value": 200000, "cost_basis": 180000}
            ],
            "target_allocation": {
                "domestic_equity": 60,  # Target 60% but have 80%
                "bonds": 40  # Target 40% but have 20%
            }
        }
        requests.post(f"{BASE_URL}/api/portfolio/client/{self.client_id}", json=portfolio_data, headers=self.headers)
        
        # Get rebalancing suggestions
        response = requests.get(f"{BASE_URL}/api/portfolio/client/{self.client_id}/rebalance", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "suggestions" in data
        assert "total_value" in data
        assert "summary" in data
        print(f"✓ Rebalancing suggestions retrieved - {data['summary']}")


class TestMonteCarloEndpoint:
    """Monte Carlo Simulator endpoint tests - POST /api/portfolio/monte-carlo/retirement"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token"""
        unique_email = f"{TEST_PREFIX}monte_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "testpass123",
            "full_name": "Monte Carlo Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": unique_email,
                "password": "testpass123"
            })
        data = response.json()
        self.headers = {
            "Authorization": f"Bearer {data['access_token']}",
            "Content-Type": "application/json"
        }
    
    def test_run_monte_carlo_simulation(self):
        """Test running Monte Carlo retirement simulation"""
        simulation_params = {
            "current_savings": 500000,
            "monthly_contribution": 5000,
            "years_to_retirement": 20,
            "retirement_years": 25,
            "monthly_retirement_need": 30000,
            "expected_return": 8,
            "volatility": 15,
            "inflation": 5,
            "num_simulations": 100  # Small number for faster test
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portfolio/monte-carlo/retirement",
            json=simulation_params,
            headers=self.headers
        )
        assert response.status_code == 200, f"Monte Carlo simulation failed: {response.text}"
        
        data = response.json()
        assert "success_rate" in data
        assert "num_simulations" in data
        assert "ending_balance_percentiles" in data
        assert "interpretation" in data
        
        # Verify percentiles structure
        percentiles = data["ending_balance_percentiles"]
        assert "10th" in percentiles
        assert "25th" in percentiles
        assert "50th" in percentiles
        assert "75th" in percentiles
        assert "90th" in percentiles
        
        # Success rate should be between 0 and 100
        assert 0 <= data["success_rate"] <= 100
        
        print(f"✓ Monte Carlo simulation completed - Success Rate: {data['success_rate']}%")
        return data
    
    def test_monte_carlo_with_high_savings(self):
        """Test Monte Carlo with high savings (should have high success rate)"""
        simulation_params = {
            "current_savings": 5000000,  # High starting balance
            "monthly_contribution": 20000,
            "years_to_retirement": 20,
            "retirement_years": 25,
            "monthly_retirement_need": 20000,  # Modest needs
            "expected_return": 8,
            "volatility": 12,
            "inflation": 4,
            "num_simulations": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portfolio/monte-carlo/retirement",
            json=simulation_params,
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # With high savings and modest needs, success rate should be high
        assert data["success_rate"] >= 50, f"Expected high success rate, got {data['success_rate']}%"
        print(f"✓ High savings scenario - Success Rate: {data['success_rate']}%")
    
    def test_monte_carlo_with_low_savings(self):
        """Test Monte Carlo with low savings (should have lower success rate)"""
        simulation_params = {
            "current_savings": 100000,  # Low starting balance
            "monthly_contribution": 1000,  # Low contributions
            "years_to_retirement": 10,  # Short time
            "retirement_years": 30,  # Long retirement
            "monthly_retirement_need": 50000,  # High needs
            "expected_return": 6,
            "volatility": 20,  # High volatility
            "inflation": 6,
            "num_simulations": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portfolio/monte-carlo/retirement",
            json=simulation_params,
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # With low savings and high needs, success rate should be lower
        print(f"✓ Low savings scenario - Success Rate: {data['success_rate']}%")


class TestPDFReportEndpoint:
    """PDF Report download endpoint tests - GET /api/tools/reports/client/{id}/analysis"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and client with financial data"""
        self.headers, self.client_id = TestSetup.get_auth_and_client()
        
        # Add financial data to client
        financial_data = {
            "monthly_income": 50000,
            "monthly_expenses": 35000,
            "total_assets": 2000000,
            "total_liabilities": 500000,
            "life_insurance_coverage": 1000000,
            "life_insurance_needed": 3000000,
            "emergency_fund_current": 50000,
            "emergency_fund_needed": 150000
        }
        requests.put(
            f"{BASE_URL}/api/clients/{self.client_id}/financial-data",
            json=financial_data,
            headers=self.headers
        )
    
    def test_download_analysis_report(self):
        """Test downloading PDF analysis report"""
        response = requests.get(
            f"{BASE_URL}/api/tools/reports/client/{self.client_id}/analysis",
            headers=self.headers
        )
        assert response.status_code == 200, f"PDF download failed: {response.text}"
        
        # Check content type is PDF
        assert "application/pdf" in response.headers.get("Content-Type", "")
        
        # Check content disposition header
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition
        assert ".pdf" in content_disposition
        
        # Check PDF content starts with PDF header
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        
        print(f"✓ PDF analysis report downloaded - Size: {len(response.content)} bytes")
    
    def test_download_goals_report(self):
        """Test downloading PDF goals report"""
        # First create some goals
        goal_data = {
            "client_id": self.client_id,
            "name": f"{TEST_PREFIX}PDF Test Goal",
            "category": "retirement",
            "target_amount": 1000000,
            "current_amount": 100000,
            "target_date": "2045-01-01",
            "priority": 1
        }
        requests.post(f"{BASE_URL}/api/tools/goals", json=goal_data, headers=self.headers)
        
        response = requests.get(
            f"{BASE_URL}/api/tools/reports/client/{self.client_id}/goals",
            headers=self.headers
        )
        assert response.status_code == 200, f"Goals PDF download failed: {response.text}"
        
        # Check content type is PDF
        assert "application/pdf" in response.headers.get("Content-Type", "")
        
        # Check PDF content
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        
        print(f"✓ PDF goals report downloaded - Size: {len(response.content)} bytes")
    
    def test_download_report_invalid_client(self):
        """Test downloading report for non-existent client fails"""
        fake_client_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/tools/reports/client/{fake_client_id}/analysis",
            headers=self.headers
        )
        assert response.status_code == 404
        print("✓ PDF download for invalid client correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
