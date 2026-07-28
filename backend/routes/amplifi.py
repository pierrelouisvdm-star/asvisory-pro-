"""
Amplifi ↔ AdvisoryPro integration endpoints.

Spec: amplifi-advisorypro-integration-advisorypro-side.md

All endpoints live under the shared /amplifi/v1/... namespace (mounted at
/api/amplifi/v1/... because the AdvisoryPro backend is proxied under /api
by our ingress). Auth is split by endpoint:

  - Server-to-server (advisor create + deactivate): static API key via
    the `X-Amplifi-Api-Key` header. Set AMPLIFI_API_KEY in backend/.env.

  - Amplifi SSO launch: signed JWT in the ?token= query string, HS256,
    dedicated secret (AMPLIFI_JWT_SECRET). Verified independently of the
    S2S key so the two credentials can be rotated separately.

Native AdvisoryPro login/registration are NOT touched by this module.
"""
from __future__ import annotations

import logging
import os
import secrets
import string
import urllib.parse
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from jose import JWTError, jwt

from utils.auth import (
    get_password_hash,
    create_access_token,
    ALGORITHM as ADVISORYPRO_JWT_ALG,
)
from server import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/amplifi/v1", tags=["Amplifi"])

AMPLIFI_API_KEY = os.environ.get("AMPLIFI_API_KEY")
# Launch JWT verification. RS256 (Amplifi signs with their private key, we
# verify with their public key) is the production algorithm. HS256 with a
# shared secret is kept as a transitional fallback during the handover, so
# Amplifi can integration-test with the shared secret while they finish
# wiring up private-key signing. Remove the HS256 branch once RS256 is live.
AMPLIFI_JWT_ALG = os.environ.get("AMPLIFI_JWT_ALGORITHM", "RS256").upper()
AMPLIFI_JWT_SECRET = os.environ.get("AMPLIFI_JWT_SECRET")
AMPLIFI_PUBLIC_KEY_PATH = os.environ.get(
    "AMPLIFI_PUBLIC_KEY_PATH", "/app/backend/keys/amplifi_public.pem"
)
_AMPLIFI_PUBLIC_KEY: Optional[str] = None


def _load_amplifi_public_key() -> Optional[str]:
    """Load and cache the Amplifi RSA public key.

    Two sources, in order of preference:
      1) AMPLIFI_PUBLIC_KEY_INLINE_PEM env var — full PEM as a single value.
         Newlines can be either real `\n` characters (multi-line env) OR
         literal `\\n` sequences that we convert. This is the recommended
         production path because it doesn't require a file to ship.
      2) File at AMPLIFI_PUBLIC_KEY_PATH — good for local dev.
    """
    global _AMPLIFI_PUBLIC_KEY
    if _AMPLIFI_PUBLIC_KEY is not None:
        return _AMPLIFI_PUBLIC_KEY

    inline = os.environ.get("AMPLIFI_PUBLIC_KEY_INLINE_PEM")
    if inline:
        # Support both real newlines and \n-escaped one-liners.
        pem = inline.replace("\\n", "\n").strip()
        if "BEGIN PUBLIC KEY" in pem:
            _AMPLIFI_PUBLIC_KEY = pem
            return _AMPLIFI_PUBLIC_KEY

    if os.path.exists(AMPLIFI_PUBLIC_KEY_PATH):
        with open(AMPLIFI_PUBLIC_KEY_PATH, "r", encoding="utf-8") as f:
            _AMPLIFI_PUBLIC_KEY = f.read().strip()
    return _AMPLIFI_PUBLIC_KEY


def _verify_amplifi_token(token: str) -> dict:
    """Try to verify a launch JWT.

    Order of attempts:
      1) RS256 with the Amplifi public key (preferred / production algorithm)
      2) HS256 with the transitional shared secret (only if configured)

    Raises JWTError if all configured methods fail. Raises RuntimeError if
    NEITHER method is configured (server misconfig).
    """
    last_err: Optional[JWTError] = None
    tried = 0

    public_key = _load_amplifi_public_key()
    if public_key:
        tried += 1
        try:
            return jwt.decode(token, public_key, algorithms=["RS256"])
        except JWTError as e:
            last_err = e
            logger.debug(f"[amplifi] RS256 verify failed: {e}")

    if AMPLIFI_JWT_SECRET:
        tried += 1
        try:
            return jwt.decode(token, AMPLIFI_JWT_SECRET, algorithms=["HS256"])
        except JWTError as e:
            last_err = e
            logger.debug(f"[amplifi] HS256 verify failed: {e}")

    if tried == 0:
        raise RuntimeError("No Amplifi verification key configured")
    raise last_err or JWTError("Token could not be verified")


# ────────────────────────────────────────────────────────────────────────
# Server-to-server auth
# ────────────────────────────────────────────────────────────────────────
def require_amplifi_key(
    x_amplifi_api_key: Optional[str] = Header(None, alias="X-Amplifi-Api-Key"),
) -> None:
    if not AMPLIFI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Amplifi integration is not configured on this server.",
        )
    if not x_amplifi_api_key or not secrets.compare_digest(
        x_amplifi_api_key, AMPLIFI_API_KEY
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing X-Amplifi-Api-Key.")


# ────────────────────────────────────────────────────────────────────────
# 1) POST /amplifi/v1/advisors — create advisor
# ────────────────────────────────────────────────────────────────────────
class CreateAdvisorRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1)
    company: str = Field(min_length=1)


@router.post("/advisors", status_code=201, dependencies=[Depends(require_amplifi_key)])
async def create_advisor(body: CreateAdvisorRequest):
    """Create an advisor account triggered by Amplifi module activation.

    - 400: any of email/full_name/company missing (enforced by pydantic).
    - 409: an advisor with that email already exists (no changes made).
    - 201: created; returns {"id": "<user_id>"}.
    """
    email_lc = body.email.lower()
    existing = await db.users.find_one(
        {"email": {"$regex": f"^{email_lc}$", "$options": "i"}},
        {"_id": 0, "id": 1},
    )
    if existing:
        raise HTTPException(status_code=409, detail={"id": existing["id"]})

    # Generate a strong random password we throw away immediately after hashing.
    # Advisors log in either via Amplifi SSO or via the native "forgot password"
    # flow — the plaintext is never persisted, transmitted, or returned.
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*-_=+"
    random_password = "".join(secrets.choice(alphabet) for _ in range(40))
    hashed = get_password_hash(random_password)
    del random_password  # extra defensive

    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": _new_id(),
        "email": body.email,
        "full_name": body.full_name,
        "company": body.company,
        "hashed_password": hashed,
        "role": "advisor",
        "is_active": True,
        "is_admin": False,
        "last_login": None,
        "created_at": now,
        "updated_at": now,
        "source": "amplifi",
    }
    await db.users.insert_one(user_doc)
    logger.info(f"[amplifi] created advisor id={user_doc['id']} email={email_lc}")
    return {"id": user_doc["id"]}


def _new_id() -> str:
    import uuid
    return str(uuid.uuid4())


# ────────────────────────────────────────────────────────────────────────
# 3) POST /amplifi/v1/advisors/deactivate — full deactivation
# ────────────────────────────────────────────────────────────────────────
class DeactivateAdvisorRequest(BaseModel):
    email: EmailStr


@router.post("/advisors/deactivate", dependencies=[Depends(require_amplifi_key)])
async def deactivate_advisor(body: DeactivateAdvisorRequest):
    """Full deactivation — the advisor loses ALL access (native portal + Amplifi).
    Reactivation is not exposed here; that only happens inside AdvisoryPro.
    """
    email_lc = body.email.lower()
    result = await db.users.update_one(
        {"email": {"$regex": f"^{email_lc}$", "$options": "i"}},
        {"$set": {
            "is_active": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Advisor not found.")
    logger.info(f"[amplifi] deactivated advisor email={email_lc}")
    return {"ok": True}


# ────────────────────────────────────────────────────────────────────────
# 2) GET /amplifi/v1/auth/launch?token=... — SSO launch
# ────────────────────────────────────────────────────────────────────────
# On success we mint an AdvisoryPro session JWT (same one the native login
# issues) and redirect the browser to /amplifi-launch?token=<jwt> on the
# frontend, which stores it in localStorage and drops the user into
# /dashboard. On failure we redirect to /amplifi-launch?error=<code> so
# the SPA can render a friendly full-page message instead of raw JSON.
FRONTEND_LAUNCH_PATH = "/amplifi-launch"


def _redirect_to_launch(base: str, **params) -> RedirectResponse:
    qs = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    return RedirectResponse(url=f"{base}{FRONTEND_LAUNCH_PATH}?{qs}", status_code=302)


@router.get("/auth/launch")
async def amplifi_launch(request: Request, token: str = Query(...)):
    # 1) Verify signature + expiry (tries RS256 then HS256 fallback).
    try:
        payload = _verify_amplifi_token(token)
    except RuntimeError:
        # No key/secret configured on this server.
        return _redirect_to_launch(_origin(request), error="not_configured")
    except JWTError as e:
        logger.info(f"[amplifi] launch rejected: bad/expired token ({e})")
        return _redirect_to_launch(_origin(request), error="expired")

    email = (payload.get("email") or "").strip().lower()
    if not email:
        return _redirect_to_launch(_origin(request), error="invalid_token")

    # 2) Look up user.
    user = await db.users.find_one(
        {"email": {"$regex": f"^{email}$", "$options": "i"}},
        {"_id": 0, "hashed_password": 0},
    )
    if not user:
        logger.info(f"[amplifi] launch rejected: user not found email={email}")
        return _redirect_to_launch(_origin(request), error="not_found")

    if user.get("is_active") is False:
        logger.info(f"[amplifi] launch rejected: user deactivated email={email}")
        return _redirect_to_launch(_origin(request), error="deactivated")

    # 3) Mint an AdvisoryPro session JWT (same shape as native login).
    session_token = create_access_token(data={"sub": user["id"]})
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": now_iso, "updated_at": now_iso}},
    )
    logger.info(
        f"[amplifi] launched user id={user['id']} email={email} alg={ADVISORYPRO_JWT_ALG}"
    )
    return _redirect_to_launch(_origin(request), token=session_token)


import hashlib
import base64

def _origin(request: Request) -> str:
    """Determine the site origin for the redirect target.

    Prefers the request's own origin so preview/prod each redirect to
    themselves; falls back to REACT_APP_BACKEND_URL if unavailable.
    """
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    forwarded_proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    if forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}"
    return os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or ""


# ────────────────────────────────────────────────────────────────────────
# Diagnostic health endpoint — S2S authed
# ────────────────────────────────────────────────────────────────────────
# Lets the Amplifi team (or ourselves during incident triage) confirm which
# verification methods this server has configured and — critically — the
# SHA-256 fingerprint of the public key we're using, so they can prove
# their private key matches ours WITHOUT sending a real launch attempt.
@router.get("/health", dependencies=[Depends(require_amplifi_key)])
async def amplifi_health():
    rs256_fp: Optional[str] = None
    pk = _load_amplifi_public_key()
    if pk:
        rs256_fp = base64.b64encode(hashlib.sha256(pk.encode("utf-8")).digest()).decode("ascii")

    hs256_fp: Optional[str] = None
    if AMPLIFI_JWT_SECRET:
        hs256_fp = base64.b64encode(hashlib.sha256(AMPLIFI_JWT_SECRET.encode("utf-8")).digest()).decode("ascii")

    return {
        "ok": True,
        "verification_methods": {
            "rs256_public_key": bool(pk),
            "hs256_shared_secret": bool(AMPLIFI_JWT_SECRET),
        },
        "public_key_sha256_b64": rs256_fp,
        "shared_secret_sha256_b64": hs256_fp,
        "notes": (
            "Compare fingerprints to prove your key/secret matches ours "
            "without re-sending raw values. HS256 accepted as a transitional "
            "fallback; RS256 with your private key is preferred long-term."
        ),
    }
