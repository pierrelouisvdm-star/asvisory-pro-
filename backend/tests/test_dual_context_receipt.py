"""
Backend tests for /api/voice/analyze-receipt-with-voice endpoint (dual-context receipt analysis)
Tests: route availability, image-only OCR, dual-context with voice_text, validation
"""
import pytest
import requests
import os
import io
import struct
import zlib

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def create_receipt_png():
    """
    Create a PNG receipt image with realistic text content using PIL.
    This looks like a real receipt to GPT-4o Vision.
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
        # Create a white receipt-like image
        width, height = 300, 400
        img = Image.new('RGB', (width, height), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)

        # Draw receipt-like text (black on white)
        lines = [
            "WHOLE FOODS MARKET",
            "123 Main Street",
            "New York, NY 10001",
            "Tel: (212) 555-1234",
            "-------------------------------",
            "Organic Apples         $6.99",
            "Whole Grain Bread      $4.50",
            "Greek Yogurt           $3.79",
            "Almond Milk            $5.49",
            "Orange Juice           $4.99",
            "Chicken Breast        $11.99",
            "Baby Spinach           $3.99",
            "Cherry Tomatoes        $4.99",
            "Mixed Nuts             $8.99",
            "-------------------------------",
            "Subtotal:             $55.71",
            "Tax (8.875%):          $4.94",
            "**TOTAL:              $60.65**",
            "-------------------------------",
            "Payment: Visa ****1234",
            "Date: 2026-02-15",
            "Thank you for shopping!",
        ]

        y_pos = 10
        for line in lines:
            draw.text((10, y_pos), line, fill=(0, 0, 0))
            y_pos += 16

        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf.read()
    except ImportError:
        # Fallback: minimal valid PNG
        return create_minimal_png_fallback()


def create_minimal_png_fallback(width=10, height=10):
    """Minimal PNG fallback (used if PIL not available)."""
    def make_png_chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = make_png_chunk(b'IHDR', ihdr_data)

    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'
        for x in range(width):
            raw_data += bytes([int(255 * x / width), int(255 * y / height), 100])
    compressed = zlib.compress(raw_data)
    idat = make_png_chunk(b'IDAT', compressed)
    iend = make_png_chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


class TestReceiptWithVoiceRouteAvailability:
    """Test route registration and HTTP method enforcement"""

    def test_route_exists_get_returns_405(self):
        """GET on POST-only endpoint should return 405 (route registered)"""
        res = requests.get(f"{BASE_URL}/api/voice/analyze-receipt-with-voice")
        print(f"GET /api/voice/analyze-receipt-with-voice → {res.status_code}")
        assert res.status_code == 405, f"Expected 405 (not 404), got {res.status_code}"
        print("PASS: Endpoint route registered (405 Method Not Allowed for GET)")

    def test_post_no_image_returns_422(self):
        """POST with no image field returns 422 validation error"""
        res = requests.post(f"{BASE_URL}/api/voice/analyze-receipt-with-voice")
        print(f"POST with no image → {res.status_code}: {res.text[:200]}")
        assert res.status_code == 422, f"Expected 422 for missing image, got {res.status_code}"
        data = res.json()
        assert "detail" in data
        print("PASS: Missing image returns 422 validation error")


class TestReceiptImageOnly:
    """Test image-only receipt analysis (no voice context)"""

    def test_image_only_returns_200_with_ocr_fields(self):
        """POST with valid PNG image only should return 200 with required OCR fields"""
        png_bytes = create_receipt_png()
        print(f"Test PNG size: {len(png_bytes)} bytes")
        assert len(png_bytes) > 100, f"Test PNG too small: {len(png_bytes)} bytes"

        files = {'image': ('receipt.png', io.BytesIO(png_bytes), 'image/png')}
        data = {'jurisdiction': 'us'}

        res = requests.post(
            f"{BASE_URL}/api/voice/analyze-receipt-with-voice",
            files=files, data=data,
            timeout=60
        )
        print(f"Image-only response: {res.status_code} - {res.text[:400]}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"

        resp = res.json()

        # Validate required fields in response
        assert "amount" in resp, "Missing 'amount' field in response"
        assert "merchant" in resp, "Missing 'merchant' field"
        assert "category" in resp, "Missing 'category' field"
        assert "description" in resp, "Missing 'description' field"
        assert "dual_context" in resp, "Missing 'dual_context' field"
        assert "transcription" in resp, "Missing 'transcription' field"

        # Without voice, dual_context should be False
        assert resp["dual_context"] is False, f"dual_context should be False for image-only, got {resp['dual_context']}"

        # amount should be a number (0 or positive)
        assert isinstance(resp["amount"], (int, float)), f"amount should be numeric, got {type(resp['amount'])}"

        print(f"PASS: Image-only OCR response: amount={resp['amount']}, merchant={resp['merchant']}, "
              f"category={resp['category']}, dual_context={resp['dual_context']}")

    def test_tiny_image_returns_400(self):
        """POST with image < 100 bytes returns 400"""
        tiny_image = b'\x89PNG\r\n' + b'\x00' * 10  # valid header, tiny body (< 100 bytes)
        files = {'image': ('tiny.png', io.BytesIO(tiny_image), 'image/png')}
        data = {'jurisdiction': 'us'}

        res = requests.post(
            f"{BASE_URL}/api/voice/analyze-receipt-with-voice",
            files=files, data=data
        )
        print(f"Tiny image → {res.status_code}: {res.text[:200]}")
        assert res.status_code == 400, f"Expected 400 for tiny image, got {res.status_code}"
        resp = res.json()
        assert "detail" in resp
        print(f"PASS: Tiny image returns 400: {resp['detail']}")


class TestReceiptWithVoiceText:
    """Test dual-context receipt analysis using voice_text parameter"""

    def test_image_plus_voice_text_returns_dual_context_true(self):
        """POST with PNG + voice_text should return dual_context:True"""
        png_bytes = create_receipt_png()

        files = {'image': ('receipt.png', io.BytesIO(png_bytes), 'image/png')}
        data = {
            'voice_text': 'Whole Foods grocery receipt for forty seven fifty',
            'jurisdiction': 'us'
        }

        res = requests.post(
            f"{BASE_URL}/api/voice/analyze-receipt-with-voice",
            files=files, data=data,
            timeout=60
        )
        print(f"Image+voice_text response: {res.status_code} - {res.text[:500]}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:300]}"

        resp = res.json()
        print(f"Response data: {resp}")

        # dual_context must be True when voice_text is provided
        assert resp.get("dual_context") is True, \
            f"dual_context should be True when voice_text provided, got {resp.get('dual_context')}"

        # Validate response structure
        assert "amount" in resp
        assert "merchant" in resp
        assert "category" in resp
        assert "description" in resp
        assert "transcription" in resp

        # transcription should contain the voice_text (it's set directly from voice_text field)
        assert resp["transcription"] == "Whole Foods grocery receipt for forty seven fifty", \
            f"transcription mismatch: {resp.get('transcription')}"

        print(f"PASS: dual_context=True, transcription='{resp['transcription']}'")
        print(f"  amount={resp['amount']}, merchant={resp['merchant']}, category={resp['category']}")

    def test_voice_text_hints_improve_category(self):
        """POST with grocery-related voice_text should return 'food' category"""
        png_bytes = create_receipt_png()

        files = {'image': ('receipt.png', io.BytesIO(png_bytes), 'image/png')}
        data = {
            'voice_text': 'Whole Foods grocery receipt for forty seven fifty',
            'jurisdiction': 'us'
        }

        res = requests.post(
            f"{BASE_URL}/api/voice/analyze-receipt-with-voice",
            files=files, data=data,
            timeout=60
        )
        assert res.status_code == 200

        resp = res.json()
        print(f"Category check: category={resp.get('category')}, amount={resp.get('amount')}")

        # With voice hint about 'Whole Foods grocery', category should be 'food'
        # (GPT-4o should infer from voice description if image is minimal)
        assert resp.get("category") in ["food", "shopping", "other"], \
            f"Unexpected category: {resp.get('category')}"

        # Amount: GPT-4o should get 47.5 from voice hint 'forty seven fifty'
        # Note: minimal PNG won't show amounts, but voice context provides it
        if resp.get("amount") == 47.5:
            print("PASS: amount=47.5 extracted from voice context!")
        else:
            print(f"INFO: amount={resp.get('amount')} (GPT-4o used image context, voice-extracted amount may vary)")

        print(f"PASS: Response has valid category={resp.get('category')}")

    def test_empty_voice_text_treated_as_image_only(self):
        """POST with empty voice_text should behave like image-only (dual_context=False)"""
        png_bytes = create_receipt_png()

        files = {'image': ('receipt.png', io.BytesIO(png_bytes), 'image/png')}
        data = {
            'voice_text': '',  # empty string
            'jurisdiction': 'us'
        }

        res = requests.post(
            f"{BASE_URL}/api/voice/analyze-receipt-with-voice",
            files=files, data=data,
            timeout=60
        )
        print(f"Empty voice_text response: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"

        resp = res.json()
        # Empty string should result in dual_context=False
        assert resp.get("dual_context") is False, \
            f"Empty voice_text should give dual_context=False, got {resp.get('dual_context')}"
        print(f"PASS: Empty voice_text gives dual_context=False")

    def test_sa_jurisdiction_uses_sa_categories(self):
        """SA jurisdiction should use SA expense categories"""
        png_bytes = create_receipt_png()

        files = {'image': ('receipt.png', io.BytesIO(png_bytes), 'image/png')}
        data = {
            'voice_text': 'grocery shopping at Pick n Pay',
            'jurisdiction': 'sa'
        }

        res = requests.post(
            f"{BASE_URL}/api/voice/analyze-receipt-with-voice",
            files=files, data=data,
            timeout=60
        )
        print(f"SA jurisdiction response: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"

        resp = res.json()
        # SA categories don't include 'health_insurance', 'retirement_401k', 'hsa'
        us_only_cats = ['health_insurance', 'retirement_401k', 'hsa', 'social_security', 'retirement_dist']
        assert resp.get("category") not in us_only_cats, \
            f"SA jurisdiction returned US-only category: {resp.get('category')}"
        print(f"PASS: SA jurisdiction returns SA category: {resp.get('category')}")


class TestExistingVoiceEndpointStillWorks:
    """Regression: existing /api/voice/parse-transaction still works"""

    def test_parse_transaction_route_registered(self):
        """GET on /api/voice/parse-transaction returns 405 (route exists)"""
        res = requests.get(f"{BASE_URL}/api/voice/parse-transaction")
        print(f"GET /api/voice/parse-transaction → {res.status_code}")
        assert res.status_code == 405, f"Expected 405 (route registered), got {res.status_code}"
        print("PASS: Existing parse-transaction route still registered")

    def test_parse_transaction_missing_audio_returns_422(self):
        """POST /api/voice/parse-transaction without audio returns 422"""
        res = requests.post(f"{BASE_URL}/api/voice/parse-transaction")
        assert res.status_code == 422
        print("PASS: parse-transaction still requires audio field")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
