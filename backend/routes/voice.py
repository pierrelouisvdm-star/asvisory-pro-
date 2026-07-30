from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
import tempfile
import os
import json
import base64
import re
import logging

from utils.emergent_compat import OpenAISpeechToText
from utils.emergent_compat import LlmChat, UserMessage, ImageContent

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger(__name__)

US_EXPENSE_CATEGORIES = [
    "housing", "transport", "food", "utilities", "communication",
    "healthcare", "health_insurance", "retirement_401k", "hsa",
    "education", "entertainment", "travel", "shopping", "business", "other"
]
US_INCOME_CATEGORIES = [
    "salary", "bonus", "investment", "rental", "freelance",
    "social_security", "retirement_dist", "other"
]
SA_EXPENSE_CATEGORIES = [
    "housing", "transport", "food", "utilities", "communication",
    "education", "healthcare", "entertainment", "travel", "shopping", "business", "other"
]
SA_INCOME_CATEGORIES = [
    "salary", "bonus", "investment", "rental", "freelance", "other"
]

CATEGORY_HINTS = {
    "housing": "rent, mortgage, home",
    "transport": "car, gas, uber, taxi, commute, subway, bus",
    "food": "grocery, restaurant, coffee, dining, supermarket, meal",
    "utilities": "electricity, water, gas bill, internet, wifi",
    "communication": "phone, cell, mobile, internet plan",
    "healthcare": "doctor, hospital, pharmacy, medicine, dental, medical",
    "health_insurance": "health insurance, medical insurance, premium",
    "retirement_401k": "401k, retirement contribution, retirement fund",
    "hsa": "HSA, health savings account",
    "education": "tuition, books, course, school, 529",
    "entertainment": "movies, games, subscriptions, netflix, spotify",
    "travel": "flight, hotel, vacation, airbnb, trip",
    "shopping": "clothes, amazon, online shopping, mall",
    "business": "business expense, office supplies, work expense, client",
    "salary": "paycheck, wages, w-2, employment, work payment",
    "bonus": "bonus, commission, reward",
    "investment": "dividend, stock, interest, capital gain, return",
    "rental": "rent received, tenant, rental income",
    "freelance": "freelance, consulting, 1099, gig, side hustle, contract work",
    "social_security": "social security, SSA benefit",
    "retirement_dist": "IRA withdrawal, 401k distribution, pension",
}


@router.post("/parse-transaction")
async def parse_voice_transaction(
    audio: UploadFile = File(...),
    jurisdiction: str = Form("us"),
):
    """
    Transcribe audio using Whisper, then parse with GPT-4o to extract transaction data.
    Returns: { transcription, type, amount, category, description, date }
    """
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio is too short or empty")

    # Determine file suffix from content type
    content_type = audio.content_type or ""
    if "webm" in content_type or audio.filename.endswith(".webm"):
        suffix = ".webm"
    elif "mp4" in content_type or audio.filename.endswith(".mp4"):
        suffix = ".mp4"
    elif "wav" in content_type:
        suffix = ".wav"
    elif "mpeg" in content_type or "mp3" in content_type:
        suffix = ".mp3"
    else:
        suffix = ".webm"

    tmp_path = None
    try:
        # Write to temp file
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # Step 1: Transcribe with Whisper
        stt = OpenAISpeechToText(api_key=key)
        with open(tmp_path, "rb") as f:
            whisper_response = await stt.transcribe(
                file=f,
                model="whisper-1",
                language="en",
                response_format="text",
                prompt="Financial transaction. Income or expense. Dollar amounts and categories.",
            )

        if isinstance(whisper_response, str):
            transcription = whisper_response.strip()
        else:
            transcription = (whisper_response.text or "").strip()

        if not transcription:
            raise HTTPException(status_code=422, detail="Could not transcribe audio. Please speak clearly and try again.")

        logger.info(f"Whisper transcription: {transcription}")

        # Step 2: Parse with GPT-4o
        is_us = jurisdiction.lower() == "us"
        expense_cats = US_EXPENSE_CATEGORIES if is_us else SA_EXPENSE_CATEGORIES
        income_cats = US_INCOME_CATEGORIES if is_us else SA_INCOME_CATEGORIES
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Build category hint string
        all_cats = {c: CATEGORY_HINTS.get(c, c) for c in expense_cats + income_cats}
        cats_str = "\n".join([f"  - {cat}: {hint}" for cat, hint in all_cats.items()])

        parse_prompt = f"""Parse this spoken financial transaction and return ONLY a JSON object.

Today's date: {today}
Currency: {"USD ($)" if is_us else "ZAR (R)"}

Available categories:
{cats_str}

Spoken text: "{transcription}"

Return ONLY this JSON (no markdown, no extra text):
{{
  "type": "income" or "expense",
  "amount": number (positive, 0 if not mentioned),
  "category": exact category ID from the list above,
  "description": short description (3-6 words, what it was for),
  "date": "YYYY-MM-DD" (today={today}, parse relative dates like "yesterday", "last week")
}}

Classification rules:
- Words like: paid for, spent, bought, cost, charged → type = "expense"
- Words like: received, earned, made, got paid, income, wages → type = "income"
- Default to "expense" if unclear
- Default category to "other" if no match"""

        chat = LlmChat(
            api_key=key,
            model="gpt-4o",
            system_message="You are a precise financial transaction parser. Respond with valid JSON only, no other text."
        )
        gpt_response = await chat.send_message(UserMessage(text=parse_prompt))
        response_text = gpt_response.strip()

        # Strip markdown if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

        parsed = json.loads(response_text)

        return {
            "transcription": transcription,
            "type": parsed.get("type", "expense"),
            "amount": abs(float(parsed.get("amount", 0))),
            "category": parsed.get("category", "other"),
            "description": parsed.get("description", ""),
            "date": parsed.get("date", today),
        }

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(
            status_code=422,
            detail="Could not extract transaction details. Please try speaking more clearly, e.g. 'I spent $50 on groceries today'"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/analyze-receipt-with-voice")
async def analyze_receipt_with_voice(
    image: UploadFile = File(...),
    audio: Optional[UploadFile] = File(None),
    voice_text: Optional[str] = Form(None),
    jurisdiction: str = Form("us"),
):
    """
    Dual-context receipt analysis: image + optional voice description.
    Transcribes audio (if provided) then sends both image + text to GPT-4o Vision.
    Returns enhanced OCR data: { transcription, amount, date, merchant, category, description }
    """
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    image_bytes = await image.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image too small or empty")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    transcription = voice_text or ""
    audio_tmp = None

    # Step 1: Transcribe audio if provided
    if audio and not voice_text:
        audio_bytes = await audio.read()
        if len(audio_bytes) > 100:
            content_type = audio.content_type or ""
            if "webm" in content_type or (audio.filename or "").endswith(".webm"):
                suffix = ".webm"
            elif "mp4" in content_type:
                suffix = ".mp4"
            else:
                suffix = ".webm"

            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                audio_tmp = tmp.name

            try:
                stt = OpenAISpeechToText(api_key=key)
                with open(audio_tmp, "rb") as f:
                    whisper_resp = await stt.transcribe(
                        file=f,
                        model="whisper-1",
                        language="en",
                        response_format="text",
                        prompt="Receipt description. Financial transaction. Store name, amount, category.",
                    )
                transcription = (whisper_resp if isinstance(whisper_resp, str) else whisper_resp.text or "").strip()
                logger.info(f"Voice description transcription: {transcription}")
            except Exception as e:
                logger.warning(f"Audio transcription failed, continuing image-only: {e}")
                transcription = ""
            finally:
                if audio_tmp and os.path.exists(audio_tmp):
                    os.unlink(audio_tmp)

    # Step 2: GPT-4o Vision with dual context
    is_us = jurisdiction.lower() == "us"
    expense_cats = US_EXPENSE_CATEGORIES if is_us else SA_EXPENSE_CATEGORIES

    voice_ctx = ""
    if transcription:
        voice_ctx = f"\n\nUser's voice description: \"{transcription}\"\nUse this to improve accuracy — especially for category and any text that may be unclear in the image."

    system_msg = f"""You are a receipt/invoice OCR assistant. Analyze the receipt image and extract transaction data.{voice_ctx}

Return ONLY valid JSON:
{{
  "amount": 123.45,
  "date": "YYYY-MM-DD (today is {today})",
  "merchant": "Store Name",
  "category": "one of: {', '.join(expense_cats)}",
  "description": "brief 3-6 word description"
}}

Use null for values you cannot determine. Extract the FINAL total amount paid."""

    try:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        chat = LlmChat(
            api_key=key,
            session_id=f"dual-ocr-{os.urandom(4).hex()}",
            system_message=system_msg
        ).with_model("openai", "gpt-4o")

        analyze_text = "Analyze this receipt."
        if transcription:
            analyze_text = f"Analyze this receipt. The user described it as: \"{transcription}\""

        content_type = image.content_type or "image/jpeg"
        img = ImageContent(image_base64=image_b64)
        response = await chat.send_message(UserMessage(text=analyze_text, file_contents=[img]))

        json_match = re.search(r'\{.*?\}', response, re.DOTALL)
        if not json_match:
            # GPT-4o didn't return JSON — possibly not a receipt image
            return {
                "transcription": transcription,
                "amount": 0,
                "date": today,
                "merchant": "",
                "category": "other",
                "description": "",
                "dual_context": bool(transcription),
                "note": "Could not extract data from image. Please fill in fields manually.",
            }

        parsed = json.loads(json_match.group())
        return {
            "transcription": transcription,
            "amount": float(parsed.get("amount") or 0),
            "date": parsed.get("date") or today,
            "merchant": parsed.get("merchant") or "",
            "category": parsed.get("category") or "other",
            "description": parsed.get("description") or "",
            "dual_context": bool(transcription),
        }

    except Exception as e:
        logger.error(f"Dual-context receipt analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Receipt analysis failed: {str(e)}")
