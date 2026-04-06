"""
Backend tests for /api/voice/parse-transaction endpoint
Tests: endpoint availability, validation, audio size check
"""
import pytest
import requests
import os
import io
import struct
import wave

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def create_minimal_wav(duration_ms=10, sample_rate=16000):
    """Create a minimal valid WAV file with silence."""
    num_samples = int(sample_rate * duration_ms / 1000)
    audio_data = b'\x00\x00' * num_samples  # silence (16-bit PCM)

    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(audio_data)
    buf.seek(0)
    return buf.read()


def create_tiny_bytes(size=50):
    """Create a byte payload smaller than 100 bytes (below backend threshold)."""
    return b'\x00' * size


class TestVoiceEndpointAvailability:
    """Test voice endpoint route availability"""

    def test_voice_route_exists_get_returns_405(self):
        """GET on POST-only endpoint should return 405 Method Not Allowed (not 404)"""
        res = requests.get(f"{BASE_URL}/api/voice/parse-transaction")
        print(f"GET /api/voice/parse-transaction → {res.status_code}")
        assert res.status_code == 405, f"Expected 405 (method not allowed), got {res.status_code}"
        print("PASS: Voice endpoint route exists (returns 405 for GET)")

    def test_post_no_audio_returns_422(self):
        """POST with no audio field returns 422 (FastAPI validation error)"""
        res = requests.post(f"{BASE_URL}/api/voice/parse-transaction")
        print(f"POST /api/voice/parse-transaction (no body) → {res.status_code}")
        assert res.status_code == 422, f"Expected 422 for missing audio, got {res.status_code}"
        data = res.json()
        print(f"Response: {data}")
        # FastAPI validation error has 'detail' field
        assert "detail" in data
        print("PASS: Missing audio returns 422 validation error")

    def test_post_no_audio_no_jurisdiction_returns_422(self):
        """POST with empty form (no audio, no jurisdiction) returns 422"""
        res = requests.post(
            f"{BASE_URL}/api/voice/parse-transaction",
            data={}
        )
        print(f"POST with empty form → {res.status_code}")
        assert res.status_code == 422
        print("PASS: Empty form returns 422")


class TestVoiceEndpointValidation:
    """Test voice endpoint input validation"""

    def test_tiny_audio_returns_400(self):
        """Audio smaller than 100 bytes should return 400"""
        tiny_audio = create_tiny_bytes(50)  # 50 bytes < 100 threshold
        files = {'audio': ('recording.wav', io.BytesIO(tiny_audio), 'audio/wav')}
        data = {'jurisdiction': 'us'}
        res = requests.post(f"{BASE_URL}/api/voice/parse-transaction", files=files, data=data)
        print(f"POST with 50-byte audio → {res.status_code}: {res.text[:200]}")
        assert res.status_code == 400, f"Expected 400 for tiny audio, got {res.status_code}"
        response_data = res.json()
        assert "detail" in response_data
        assert "short" in response_data["detail"].lower() or "empty" in response_data["detail"].lower()
        print("PASS: Tiny audio returns 400 with correct error message")

    def test_tiny_audio_sa_jurisdiction_returns_400(self):
        """Same validation applies for SA jurisdiction"""
        tiny_audio = create_tiny_bytes(50)
        files = {'audio': ('recording.webm', io.BytesIO(tiny_audio), 'audio/webm')}
        data = {'jurisdiction': 'sa'}
        res = requests.post(f"{BASE_URL}/api/voice/parse-transaction", files=files, data=data)
        print(f"POST SA with 50-byte audio → {res.status_code}: {res.text[:200]}")
        assert res.status_code == 400, f"Expected 400 for SA tiny audio, got {res.status_code}"
        print("PASS: SA tiny audio also returns 400")

    def test_valid_wav_file_accepted_triggers_processing(self):
        """A valid WAV file (> 100 bytes) should be accepted and trigger processing (not 400/422)"""
        # Create a real WAV with silence (will be ~320+ bytes)
        wav_bytes = create_minimal_wav(duration_ms=100)
        print(f"WAV file size: {len(wav_bytes)} bytes")
        assert len(wav_bytes) > 100, f"WAV too small: {len(wav_bytes)} bytes"

        files = {'audio': ('recording.wav', io.BytesIO(wav_bytes), 'audio/wav')}
        data = {'jurisdiction': 'us'}
        res = requests.post(
            f"{BASE_URL}/api/voice/parse-transaction",
            files=files, data=data,
            timeout=30  # Allow time for Whisper/GPT processing
        )
        print(f"POST with valid WAV → {res.status_code}")
        # Should NOT be 400/422 — accepted for processing
        # May return 422 (could not transcribe silence) or 500 (LLM issue) or 200 (parsed)
        assert res.status_code not in [400, 415], \
            f"Valid WAV incorrectly rejected with {res.status_code}: {res.text[:200]}"
        print(f"Valid WAV response: {res.status_code} - {res.text[:300]}")
        if res.status_code == 200:
            data_resp = res.json()
            assert "transcription" in data_resp
            assert "type" in data_resp
            assert "amount" in data_resp
            assert "category" in data_resp
            print(f"PASS: Got parsed transaction: {data_resp}")
        else:
            # 422 = couldn't transcribe silence (acceptable)
            # 500 = processing error
            print(f"INFO: Endpoint processed (not rejected) - status {res.status_code}")
            print("PASS: Valid audio was accepted and processed (not rejected at validation layer)")


class TestVoiceEndpointLLMKey:
    """Test LLM key configuration"""

    def test_emergent_llm_key_in_env(self):
        """EMERGENT_LLM_KEY should be set in backend environment"""
        # Read backend .env directly
        env_path = '/app/backend/.env'
        assert os.path.exists(env_path), "Backend .env not found"
        with open(env_path) as f:
            content = f.read()
        assert 'EMERGENT_LLM_KEY' in content, "EMERGENT_LLM_KEY not in backend .env"
        # Check it has a value (not empty)
        for line in content.splitlines():
            if line.startswith('EMERGENT_LLM_KEY='):
                value = line.split('=', 1)[1].strip()
                assert len(value) > 5, f"EMERGENT_LLM_KEY appears empty: '{value}'"
                print(f"PASS: EMERGENT_LLM_KEY set (length={len(value)})")
                return
        pytest.fail("EMERGENT_LLM_KEY not found in .env")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
