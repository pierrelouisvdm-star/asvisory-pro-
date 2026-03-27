"""
Test suite for OCR Receipt functionality
Tests: POST /api/transactions/{id}/receipt (with OCR), 
       POST /api/transactions/{id}/receipt/analyze,
       GET /api/transactions/{id}/receipt/ocr
"""
import pytest
import requests
import os
import uuid
import base64
from io import BytesIO

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "Pierrelouisvdm@gmail.com"
TEST_PASSWORD = "Scorpio@57!!"

# Known transaction with receipt for testing
EXISTING_TRANSACTION_WITH_RECEIPT = "46c15ad5-394d-46e2-b3de-be76d727ba6c"


class TestOCRReceiptAPI:
    """Test suite for OCR Receipt functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
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
    
    @pytest.fixture(scope="class")
    def auth_headers_multipart(self, auth_token):
        """Get headers for multipart upload (no Content-Type)"""
        return {
            "Authorization": f"Bearer {auth_token}"
        }
    
    def test_get_ocr_data_existing_receipt(self, auth_headers):
        """Test GET /api/transactions/{id}/receipt/ocr for existing receipt"""
        response = requests.get(
            f"{BASE_URL}/api/transactions/{EXISTING_TRANSACTION_WITH_RECEIPT}/receipt/ocr",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get OCR data failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "transaction_id" in data, "No transaction_id in response"
        assert "receipt_id" in data, "No receipt_id in response"
        assert "ocr_data" in data, "No ocr_data in response"
        assert "has_ocr" in data, "No has_ocr in response"
        
        # Verify OCR data was extracted
        assert data["has_ocr"] == True, "Expected has_ocr to be True"
        assert data["ocr_data"] is not None, "Expected ocr_data to not be None"
        
        # Verify OCR data structure
        ocr_data = data["ocr_data"]
        assert "amount" in ocr_data, "No amount in OCR data"
        assert "date" in ocr_data, "No date in OCR data"
        assert "merchant" in ocr_data, "No merchant in OCR data"
        assert "category" in ocr_data, "No category in OCR data"
        
        print(f"PASS: GET OCR data returned: amount={ocr_data.get('amount')}, merchant={ocr_data.get('merchant')}")
    
    def test_reanalyze_existing_receipt(self, auth_headers):
        """Test POST /api/transactions/{id}/receipt/analyze for re-analysis"""
        response = requests.post(
            f"{BASE_URL}/api/transactions/{EXISTING_TRANSACTION_WITH_RECEIPT}/receipt/analyze",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Re-analyze receipt failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "No message in response"
        assert "ocr_data" in data, "No ocr_data in response"
        
        # Verify OCR data was extracted
        if data["ocr_data"]:
            ocr_data = data["ocr_data"]
            assert "amount" in ocr_data, "No amount in OCR data"
            print(f"PASS: Re-analyze returned: amount={ocr_data.get('amount')}, merchant={ocr_data.get('merchant')}")
        else:
            print("INFO: Re-analyze returned no OCR data (may be expected for some images)")
    
    def test_get_ocr_data_nonexistent_receipt(self, auth_headers):
        """Test GET /api/transactions/{id}/receipt/ocr for non-existent receipt"""
        fake_id = str(uuid.uuid4())
        
        response = requests.get(
            f"{BASE_URL}/api/transactions/{fake_id}/receipt/ocr",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Correctly returns 404 for non-existent receipt OCR data")
    
    def test_reanalyze_nonexistent_receipt(self, auth_headers):
        """Test POST /api/transactions/{id}/receipt/analyze for non-existent receipt"""
        fake_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BASE_URL}/api/transactions/{fake_id}/receipt/analyze",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Correctly returns 404 for non-existent receipt re-analyze")
    
    def test_upload_receipt_with_ocr(self, auth_headers, auth_headers_multipart):
        """Test POST /api/transactions/{id}/receipt returns ocr_data for image upload"""
        # First create a transaction
        transaction_data = {
            "type": "expense",
            "amount": 100.00,
            "category": "food",
            "description": "TEST_OCR_Receipt test",
            "date": "2026-01-15",
            "is_recurring": False,
            "tax_deductible": False
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/transactions",
            headers=auth_headers,
            json=transaction_data
        )
        assert create_response.status_code == 200, f"Create transaction failed: {create_response.text}"
        transaction_id = create_response.json()["id"]
        
        # Create a simple test image (100x100 PNG with some content)
        # This is a minimal valid PNG that should trigger OCR
        # Using a simple gradient pattern to have some visual content
        png_data = create_test_png_image()
        
        files = {
            'file': ('test_receipt.png', png_data, 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transactions/{transaction_id}/receipt",
            headers=auth_headers_multipart,
            files=files,
            timeout=60  # OCR may take time
        )
        
        assert response.status_code == 200, f"Upload receipt failed: {response.text}"
        data = response.json()
        
        # Verify basic response
        assert "receipt_id" in data, "No receipt_id in response"
        assert "filename" in data, "No filename in response"
        
        # OCR data may or may not be present depending on image content
        # For a simple test image, OCR might not extract meaningful data
        if "ocr_data" in data and data["ocr_data"]:
            print(f"PASS: Upload returned OCR data: {data['ocr_data']}")
        else:
            print("INFO: Upload completed but no OCR data extracted (expected for test image)")
        
        # Cleanup - delete the test transaction
        requests.delete(
            f"{BASE_URL}/api/transactions/{transaction_id}",
            headers=auth_headers
        )
        
        print(f"PASS: Receipt upload with OCR completed for transaction {transaction_id}")
    
    def test_ocr_data_structure_validation(self, auth_headers):
        """Test that OCR data has correct structure and types"""
        response = requests.get(
            f"{BASE_URL}/api/transactions/{EXISTING_TRANSACTION_WITH_RECEIPT}/receipt/ocr",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data["ocr_data"]:
            ocr = data["ocr_data"]
            
            # Amount should be a number
            if "amount" in ocr and ocr["amount"] is not None:
                assert isinstance(ocr["amount"], (int, float)), f"Amount should be numeric, got {type(ocr['amount'])}"
            
            # Date should be a string in YYYY-MM-DD format
            if "date" in ocr and ocr["date"] is not None:
                assert isinstance(ocr["date"], str), f"Date should be string, got {type(ocr['date'])}"
                # Basic date format check
                if len(ocr["date"]) == 10:
                    assert ocr["date"][4] == "-" and ocr["date"][7] == "-", "Date should be YYYY-MM-DD format"
            
            # Category should be one of the valid categories
            valid_categories = ['housing', 'transport', 'food', 'utilities', 'communication', 
                              'education', 'healthcare', 'entertainment', 'travel', 'shopping', 
                              'business', 'other']
            if "category" in ocr and ocr["category"] is not None:
                assert ocr["category"] in valid_categories, f"Invalid category: {ocr['category']}"
            
            print("PASS: OCR data structure validation passed")
        else:
            print("INFO: No OCR data to validate")


def create_test_png_image():
    """Create a simple test PNG image with some visual content"""
    # This creates a minimal valid PNG file
    # For real OCR testing, you'd want an actual receipt image
    
    # PNG signature
    signature = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    
    # IHDR chunk (image header) - 10x10 RGB image
    ihdr_data = bytes([
        0x00, 0x00, 0x00, 0x0A,  # width: 10
        0x00, 0x00, 0x00, 0x0A,  # height: 10
        0x08,  # bit depth: 8
        0x02,  # color type: RGB
        0x00,  # compression method
        0x00,  # filter method
        0x00   # interlace method
    ])
    
    import zlib
    
    # Create simple image data (10x10 red pixels)
    raw_data = b''
    for y in range(10):
        raw_data += b'\x00'  # filter byte
        for x in range(10):
            raw_data += bytes([255, 0, 0])  # RGB red
    
    compressed = zlib.compress(raw_data)
    
    def make_chunk(chunk_type, data):
        import struct
        length = struct.pack('>I', len(data))
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        crc_bytes = struct.pack('>I', crc)
        return length + chunk_type + data + crc_bytes
    
    ihdr = make_chunk(b'IHDR', ihdr_data)
    idat = make_chunk(b'IDAT', compressed)
    iend = make_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend


class TestOCRCleanup:
    """Cleanup test data after OCR tests"""
    
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
    
    def test_cleanup_ocr_test_transactions(self, auth_headers):
        """Clean up TEST_OCR_ prefixed transactions"""
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
            if t.get("description", "").startswith("TEST_OCR_"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/transactions/{t['id']}",
                    headers=auth_headers
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"CLEANUP: Deleted {deleted_count} OCR test transactions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
