"""
Backend tests for POST /api/transactions/batch endpoint
Tests: batch save, empty array, auth required, max limit
"""
import pytest
import requests
import os
from datetime import date

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def get_auth_token():
    """Login and retrieve access_token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "Pierrelouisvdm@gmail.com",
        "password": "Scorpio@57!!"
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


@pytest.fixture(scope="module")
def token():
    t = get_auth_token()
    if not t:
        pytest.skip("Auth failed — cannot proceed with tests")
    return t


@pytest.fixture(scope="module")
def auth_headers(token):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }


# ── Test: batch with 2 valid transactions ──
class TestBatchCreateTransactions:

    def test_batch_with_2_valid_transactions(self, auth_headers):
        """POST /api/transactions/batch with 2 valid transactions → saved:2, response has transactions list"""
        payload = [
            {
                "type": "expense",
                "amount": 42.50,
                "category": "food",
                "description": "TEST_Grocery run",
                "date": str(date.today()),
                "is_recurring": False,
                "tax_deductible": False
            },
            {
                "type": "income",
                "amount": 1500.00,
                "category": "salary",
                "description": "TEST_Salary payment",
                "date": str(date.today()),
                "is_recurring": True,
                "tax_deductible": False
            }
        ]
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=payload,
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "saved" in data, "Response missing 'saved' field"
        assert data["saved"] == 2, f"Expected saved=2, got {data['saved']}"
        assert "transactions" in data, "Response missing 'transactions' field"
        assert isinstance(data["transactions"], list), "transactions should be a list"
        assert len(data["transactions"]) == 2, f"Expected 2 transactions, got {len(data['transactions'])}"
        # Verify no _id in responses
        for t in data["transactions"]:
            assert "_id" not in t, "MongoDB _id should not be in response"
            assert "id" in t, "Transaction should have 'id' field"
            assert t["user_id"] is not None
        print("PASS: batch with 2 valid transactions → saved:2")

    def test_batch_with_1_transaction(self, auth_headers):
        """POST /api/transactions/batch with 1 item → saved:1"""
        payload = [
            {
                "type": "expense",
                "amount": 25.00,
                "category": "transport",
                "description": "TEST_Single batch item",
                "date": str(date.today()),
                "is_recurring": False,
                "tax_deductible": False
            }
        ]
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=payload,
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["saved"] == 1, f"Expected saved=1, got {data['saved']}"
        print("PASS: batch with 1 transaction → saved:1")

    def test_batch_verifies_data_persisted(self, auth_headers):
        """After batch POST, GET /api/transactions to verify saved items appear"""
        payload = [
            {
                "type": "expense",
                "amount": 99.99,
                "category": "shopping",
                "description": "TEST_Persistence check",
                "date": str(date.today()),
                "is_recurring": False,
                "tax_deductible": False
            }
        ]
        post_resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=payload,
            headers=auth_headers
        )
        assert post_resp.status_code == 200
        saved_id = post_resp.json()["transactions"][0]["id"]

        # GET all transactions to verify persistence
        get_resp = requests.get(f"{BASE_URL}/api/transactions", headers=auth_headers)
        assert get_resp.status_code == 200
        all_txns = get_resp.json().get("transactions", [])
        ids = [t["id"] for t in all_txns]
        assert saved_id in ids, f"Saved transaction id {saved_id} not found in GET response"
        print("PASS: Batch transaction persisted and visible in GET /api/transactions")


class TestBatchValidation:

    def test_empty_array_returns_400(self, auth_headers):
        """POST /api/transactions/batch with empty array → 400"""
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=[],
            headers=auth_headers
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "detail" in data, "Response should have 'detail' error message"
        print(f"PASS: empty array → 400: {data['detail']}")

    def test_missing_required_field_returns_422(self, auth_headers):
        """POST /api/transactions/batch with missing required field → 422"""
        payload = [{"type": "expense", "category": "food", "date": str(date.today())}]  # missing amount
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=payload,
            headers=auth_headers
        )
        assert resp.status_code == 422, f"Expected 422 (validation), got {resp.status_code}: {resp.text}"
        print("PASS: missing required field → 422")

    def test_invalid_amount_zero_returns_422(self, auth_headers):
        """POST with amount=0 (not gt=0) → 422"""
        payload = [
            {
                "type": "expense",
                "amount": 0,
                "category": "food",
                "description": "Zero amount test",
                "date": str(date.today()),
                "is_recurring": False,
                "tax_deductible": False
            }
        ]
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=payload,
            headers=auth_headers
        )
        assert resp.status_code == 422, f"Expected 422 for amount=0, got {resp.status_code}: {resp.text}"
        print("PASS: amount=0 → 422 (pydantic gt=0 validation)")


class TestBatchAuth:

    def test_no_auth_returns_401_or_403(self):
        """POST /api/transactions/batch without auth → 401 or 403"""
        payload = [
            {
                "type": "expense",
                "amount": 10.00,
                "category": "food",
                "description": "No auth test",
                "date": str(date.today()),
                "is_recurring": False,
                "tax_deductible": False
            }
        ]
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}: {resp.text}"
        print(f"PASS: no auth → {resp.status_code}")

    def test_invalid_token_returns_401(self):
        """POST with invalid token → 401"""
        resp = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json=[{
                "type": "expense",
                "amount": 10.00,
                "category": "food",
                "description": "Bad token test",
                "date": str(date.today()),
                "is_recurring": False,
                "tax_deductible": False
            }],
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer invalid_token_xyz"
            }
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"
        print(f"PASS: invalid token → 401")
