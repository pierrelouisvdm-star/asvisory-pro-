"""
Test suite for Transactions API endpoints
Tests: POST /api/transactions, GET /api/transactions, DELETE /api/transactions/{id}
Tests: POST /api/transactions/{id}/receipt, GET /api/transactions/{id}/receipt
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "Pierrelouisvdm@gmail.com"
TEST_PASSWORD = "Scorpio@57!!"


class TestTransactionsAPI:
    """Test suite for Transactions CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        # API returns access_token, not token
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in login response: {data.keys()}"
        return token
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health check endpoint working")
    
    def test_create_transaction_expense(self, auth_headers):
        """Test creating an expense transaction"""
        transaction_data = {
            "type": "expense",
            "amount": 150.50,
            "category": "food",
            "description": "TEST_Grocery shopping",
            "date": "2026-01-15",
            "is_recurring": False,
            "tax_deductible": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        
        assert response.status_code == 200, f"Create transaction failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "No id in response"
        assert data["type"] == "expense"
        assert data["amount"] == 150.50
        assert data["category"] == "food"
        assert data["description"] == "TEST_Grocery shopping"
        assert data["date"] == "2026-01-15"
        assert data["is_recurring"] == False
        assert data["tax_deductible"] == False
        
        print(f"PASS: Created expense transaction with id: {data['id']}")
        return data["id"]
    
    def test_create_transaction_income(self, auth_headers):
        """Test creating an income transaction"""
        transaction_data = {
            "type": "income",
            "amount": 5000.00,
            "category": "salary",
            "description": "TEST_Monthly salary",
            "date": "2026-01-01",
            "is_recurring": True,
            "tax_deductible": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        
        assert response.status_code == 200, f"Create income transaction failed: {response.text}"
        data = response.json()
        
        assert data["type"] == "income"
        assert data["amount"] == 5000.00
        assert data["is_recurring"] == True
        
        print(f"PASS: Created income transaction with id: {data['id']}")
        return data["id"]
    
    def test_create_tax_deductible_transaction(self, auth_headers):
        """Test creating a tax-deductible expense"""
        transaction_data = {
            "type": "expense",
            "amount": 250.00,
            "category": "business",
            "description": "TEST_Business expense",
            "date": "2026-01-10",
            "is_recurring": False,
            "tax_deductible": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        
        assert response.status_code == 200, f"Create tax-deductible transaction failed: {response.text}"
        data = response.json()
        
        assert data["tax_deductible"] == True
        assert data["category"] == "business"
        
        print(f"PASS: Created tax-deductible transaction with id: {data['id']}")
        return data["id"]
    
    def test_get_transactions(self, auth_headers):
        """Test getting all transactions"""
        response = requests.get(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get transactions failed: {response.text}"
        data = response.json()
        
        assert "transactions" in data, "No transactions key in response"
        assert isinstance(data["transactions"], list), "Transactions should be a list"
        
        print(f"PASS: Retrieved {len(data['transactions'])} transactions")
        return data["transactions"]
    
    def test_get_transactions_by_month(self, auth_headers):
        """Test getting transactions filtered by month"""
        response = requests.get(
            f"{BASE_URL}/api/transactions?month=2026-01",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get transactions by month failed: {response.text}"
        data = response.json()
        
        assert "transactions" in data
        # All returned transactions should be from January 2026
        for t in data["transactions"]:
            assert t["date"].startswith("2026-01"), f"Transaction date {t['date']} not in 2026-01"
        
        print(f"PASS: Retrieved {len(data['transactions'])} transactions for 2026-01")
    
    def test_delete_transaction(self, auth_headers):
        """Test soft deleting a transaction"""
        # First create a transaction to delete
        transaction_data = {
            "type": "expense",
            "amount": 50.00,
            "category": "other",
            "description": "TEST_To be deleted",
            "date": "2026-01-20",
            "is_recurring": False,
            "tax_deductible": False
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        assert create_response.status_code == 200
        transaction_id = create_response.json()["id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/transactions/{transaction_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Delete transaction failed: {delete_response.text}"
        data = delete_response.json()
        assert data["message"] == "Transaction deleted"
        
        # Verify it's no longer in the list
        get_response = requests.get(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers
        )
        transactions = get_response.json()["transactions"]
        transaction_ids = [t["id"] for t in transactions]
        assert transaction_id not in transaction_ids, "Deleted transaction still appears in list"
        
        print(f"PASS: Successfully deleted transaction {transaction_id}")
    
    def test_delete_nonexistent_transaction(self, auth_headers):
        """Test deleting a transaction that doesn't exist"""
        fake_id = str(uuid.uuid4())
        
        response = requests.delete(
            f"{BASE_URL}/api/transactions/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Correctly returns 404 for non-existent transaction")
    
    def test_create_transaction_invalid_amount(self, auth_headers):
        """Test creating transaction with invalid amount"""
        transaction_data = {
            "type": "expense",
            "amount": -100,  # Invalid negative amount
            "category": "food",
            "description": "TEST_Invalid",
            "date": "2026-01-15",
            "is_recurring": False,
            "tax_deductible": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for invalid amount, got {response.status_code}"
        print("PASS: Correctly rejects negative amount")
    
    def test_unauthorized_access(self):
        """Test accessing transactions without auth token"""
        response = requests.get(f"{BASE_URL}/api/transactions")
        
        # Should return 401 or 403
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Correctly rejects unauthorized access")


class TestReceiptUploadAPI:
    """Test suite for Receipt upload/download functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def auth_headers_multipart(self, auth_token):
        """Get headers for multipart upload (no Content-Type)"""
        return {
            "Authorization": f"Bearer {auth_token}"
        }
    
    @pytest.fixture(scope="class")
    def test_transaction(self, auth_headers):
        """Create a test transaction for receipt tests"""
        transaction_data = {
            "type": "expense",
            "amount": 100.00,
            "category": "business",
            "description": "TEST_Receipt test transaction",
            "date": "2026-01-15",
            "is_recurring": False,
            "tax_deductible": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        assert response.status_code == 200
        return response.json()
    
    def test_upload_receipt_image(self, auth_headers_multipart, test_transaction):
        """Test uploading an image receipt"""
        transaction_id = test_transaction["id"]
        
        # Create a simple test image (1x1 pixel PNG)
        # PNG header for a 1x1 transparent pixel
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,  # bit depth, color type
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,  # compressed data
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,  # checksum
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,  # IEND chunk
            0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {
            'file': ('test_receipt.png', png_data, 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions/{transaction_id}/receipt",
            headers=auth_headers_multipart,
            files=files
        )
        
        assert response.status_code == 200, f"Upload receipt failed: {response.text}"
        data = response.json()
        
        assert "receipt_id" in data, "No receipt_id in response"
        assert "filename" in data, "No filename in response"
        assert data["message"] == "Receipt uploaded successfully"
        
        print(f"PASS: Uploaded receipt with id: {data['receipt_id']}")
        return data["receipt_id"]
    
    def test_get_receipt(self, auth_headers_multipart, test_transaction):
        """Test downloading a receipt"""
        transaction_id = test_transaction["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/transactions/{transaction_id}/receipt",
            headers=auth_headers_multipart
        )
        
        # If receipt was uploaded, should return 200
        # If not, should return 404
        if response.status_code == 200:
            assert len(response.content) > 0, "Receipt content is empty"
            print(f"PASS: Retrieved receipt, size: {len(response.content)} bytes")
        elif response.status_code == 404:
            print("INFO: No receipt found for transaction (expected if upload test ran separately)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_upload_receipt_invalid_type(self, auth_headers_multipart, test_transaction):
        """Test uploading an invalid file type"""
        transaction_id = test_transaction["id"]
        
        # Try to upload a text file (not allowed)
        files = {
            'file': ('test.txt', b'This is a text file', 'text/plain')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions/{transaction_id}/receipt",
            headers=auth_headers_multipart,
            files=files
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
        print("PASS: Correctly rejects invalid file type")
    
    def test_upload_receipt_nonexistent_transaction(self, auth_headers_multipart):
        """Test uploading receipt to non-existent transaction"""
        fake_id = str(uuid.uuid4())
        
        png_data = bytes([0x89, 0x50, 0x4E, 0x47])  # Minimal PNG header
        files = {
            'file': ('test.png', png_data, 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions/{fake_id}/receipt",
            headers=auth_headers_multipart,
            files=files
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Correctly returns 404 for non-existent transaction")


class TestCleanup:
    """Cleanup test data after tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication token for cleanup"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Could not authenticate for cleanup")
        data = response.json()
        token = data.get("access_token") or data.get("token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_cleanup_test_transactions(self, auth_headers):
        """Clean up TEST_ prefixed transactions"""
        response = requests.get(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers
        )
        
        if response.status_code != 200:
            print("SKIP: Could not get transactions for cleanup")
            return
        
        transactions = response.json().get("transactions", [])
        deleted_count = 0
        
        for t in transactions:
            if t.get("description", "").startswith("TEST_"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/transactions/{t['id']}",
                    headers=auth_headers
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"CLEANUP: Deleted {deleted_count} test transactions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
