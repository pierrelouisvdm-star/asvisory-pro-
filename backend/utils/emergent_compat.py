"""
Drop-in replacement for `emergentintegrations`, using the OpenAI and Stripe
SDKs directly against your own API keys instead of Emergent's metered proxy.

This module intentionally mirrors the small slice of the emergentintegrations
API that this codebase actually uses:
    - LlmChat / UserMessage / ImageContent  (chat + vision)
    - OpenAISpeechToText                    (Whisper transcription)
    - StripeCheckout / CheckoutSessionRequest / CheckoutSessionResponse

Swap points:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        -> from utils.emergent_compat import LlmChat, UserMessage, ImageContent

    from emergentintegrations.llm.openai import OpenAISpeechToText
        -> from utils.emergent_compat import OpenAISpeechToText

    from emergentintegrations.payments.stripe.checkout import StripeCheckout, ...
        -> from utils.emergent_compat import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse

Everything else in the calling code (LlmChat(...).with_model(...).send_message(...),
etc.) works unchanged.
"""
import os
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

from openai import AsyncOpenAI
import stripe as stripe_sdk

# Default model used when a caller does not specify one via with_model().
DEFAULT_LLM_MODEL = os.environ.get("DEFAULT_LLM_MODEL", "gpt-4o")


# --------------------------------------------------------------------------
# LLM chat (text + vision)
# --------------------------------------------------------------------------

class ImageContent:
    """Mirrors emergentintegrations.llm.chat.ImageContent."""

    def __init__(self, image_base64: str, mime_type: str = "image/jpeg"):
        self.image_base64 = image_base64
        self.mime_type = mime_type


class UserMessage:
    """Mirrors emergentintegrations.llm.chat.UserMessage."""

    def __init__(self, text: str, file_contents: Optional[List[ImageContent]] = None):
        self.text = text
        self.file_contents = file_contents or []


class LlmChat:
    """
    Mirrors emergentintegrations.llm.chat.LlmChat closely enough for this
    codebase: constructed with an api_key/session_id/system_message,
    optionally re-configured with .with_model(provider, model), then used via
    `await chat.send_message(UserMessage(...))` which returns plain text.

    Only the "openai" provider is implemented since that's all this app used.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        session_id: Optional[str] = None,
        system_message: Optional[str] = None,
        model: Optional[str] = None,
    ):
        # Prefer an explicitly passed key; otherwise fall back to the
        # standard OPENAI_API_KEY env var so callers that pass through
        # EMERGENT_LLM_KEY still work if that variable is repointed.
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.session_id = session_id
        self.system_message = system_message
        self.model = model or DEFAULT_LLM_MODEL
        self._client = AsyncOpenAI(api_key=self.api_key)

    def with_model(self, provider: str, model: str) -> "LlmChat":
        """provider is accepted for API compatibility but only 'openai' works."""
        self.model = model
        return self

    def _build_user_content(self, message: UserMessage) -> Any:
        if not message.file_contents:
            return message.text

        content: List[Dict[str, Any]] = [{"type": "text", "text": message.text}]
        for img in message.file_contents:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{getattr(img, 'mime_type', 'image/jpeg')};base64,{img.image_base64}"
                },
            })
        return content

    async def send_message(self, message: UserMessage) -> str:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")

        messages = []
        if self.system_message:
            messages.append({"role": "system", "content": self.system_message})
        messages.append({"role": "user", "content": self._build_user_content(message)})

        response = await self._client.chat.completions.create(
            model=self.model,
            messages=messages,
        )
        return response.choices[0].message.content or ""


# --------------------------------------------------------------------------
# Speech-to-text (Whisper)
# --------------------------------------------------------------------------

class _TranscriptionResult:
    def __init__(self, text: str):
        self.text = text


class OpenAISpeechToText:
    """Mirrors emergentintegrations.llm.openai.OpenAISpeechToText."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self._client = AsyncOpenAI(api_key=self.api_key)

    async def transcribe(
        self,
        file,
        model: str = "whisper-1",
        language: Optional[str] = None,
        response_format: str = "text",
        prompt: Optional[str] = None,
    ):
        kwargs: Dict[str, Any] = {"model": model, "file": file, "response_format": response_format}
        if language:
            kwargs["language"] = language
        if prompt:
            kwargs["prompt"] = prompt

        result = await self._client.audio.transcriptions.create(**kwargs)

        # response_format="text" returns a raw string from the SDK; other
        # formats return an object with a .text attribute. Normalize to a
        # string here so callers (who already handle both) keep working.
        if isinstance(result, str):
            return result
        return _TranscriptionResult(getattr(result, "text", str(result)))


# --------------------------------------------------------------------------
# Stripe checkout
# --------------------------------------------------------------------------

@dataclass
class CheckoutSessionRequest:
    amount: float
    currency: str = "usd"
    success_url: str = ""
    cancel_url: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CheckoutSessionResponse:
    session_id: str
    url: str


@dataclass
class CheckoutStatusResponse:
    status: str
    payment_status: str
    session_id: Optional[str] = None
    event_type: Optional[str] = None


class StripeCheckout:
    """
    Mirrors emergentintegrations.payments.stripe.checkout.StripeCheckout using
    the official `stripe` SDK directly. webhook_url is accepted for API
    compatibility but Stripe webhooks are configured in the Stripe dashboard,
    not per-call, so it's unused here.
    """

    def __init__(self, api_key: str, webhook_url: Optional[str] = None):
        self.api_key = api_key
        self.webhook_url = webhook_url
        stripe_sdk.api_key = api_key

    async def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        session = stripe_sdk.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": request.currency,
                    "unit_amount": int(round(request.amount * 100)),
                    "product_data": {"name": "AdvisoryPro Subscription"},
                },
                "quantity": 1,
            }],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata=request.metadata,
        )
        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        session = stripe_sdk.checkout.Session.retrieve(session_id)
        return CheckoutStatusResponse(
            status=session.status,
            payment_status=session.payment_status,
            session_id=session.id,
        )

    async def handle_webhook(self, payload: bytes, signature: str) -> CheckoutStatusResponse:
        webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        if webhook_secret:
            event = stripe_sdk.Webhook.construct_event(payload, signature, webhook_secret)
        else:
            # No webhook secret configured — fall back to parsing the event
            # body directly. Set STRIPE_WEBHOOK_SECRET for production use so
            # webhook signatures are actually verified.
            import json
            event = json.loads(payload)

        event_type = event["type"] if isinstance(event, dict) else event.type
        data_object = (event["data"]["object"] if isinstance(event, dict) else event.data.object)

        payment_status = data_object.get("payment_status", "unpaid") if isinstance(data_object, dict) else getattr(data_object, "payment_status", "unpaid")
        session_id = data_object.get("id") if isinstance(data_object, dict) else getattr(data_object, "id", None)

        return CheckoutStatusResponse(
            status="complete" if payment_status == "paid" else "open",
            payment_status=payment_status,
            session_id=session_id,
            event_type=event_type,
        )
