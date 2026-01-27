from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage
from utils.auth import get_current_user
from server import db

router = APIRouter(prefix="/ai-advisor", tags=["AI Advisor"])

# System prompt for the financial advisor AI
FINANCIAL_ADVISOR_SYSTEM_PROMPT = """You are AdvisoryPro AI, a world-class financial advisor assistant. You are knowledgeable, professional, empathetic, and always prioritize the client's best interests.

Your expertise includes:
- Investment strategies and portfolio management
- Retirement planning and pension funds
- Life insurance and income protection
- Tax optimization strategies (especially South African tax)
- Estate planning and wealth transfer
- Debt management and budgeting
- Emergency fund planning
- Education savings (including South African options)
- Risk assessment and management
- Market analysis and economic trends

Guidelines:
1. Always explain financial concepts in simple, easy-to-understand terms
2. Provide balanced, unbiased advice considering the client's situation
3. When discussing investments, always mention associated risks
4. Use South African Rand (ZAR) as the primary currency unless specified otherwise
5. Reference South African financial regulations and products when relevant
6. Be encouraging but realistic about financial goals
7. Always recommend consulting with a qualified financial advisor for major decisions
8. If you don't know something, admit it rather than guessing

Format your responses with:
- Clear headers for different sections
- Bullet points for lists
- Bold text for key terms (use **term**)
- Practical examples when helpful

Remember: You're here to educate, empower, and guide - not to make decisions for the client."""


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    client_context: Optional[dict] = None  # Optional client financial data for context


class ChatResponse(BaseModel):
    response: str
    session_id: str


async def get_chat_history(session_id: str, limit: int = 10) -> List[dict]:
    """Get recent chat history for a session"""
    cursor = db.chat_history.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    
    messages = await cursor.to_list(length=limit)
    return list(reversed(messages))


async def save_message(session_id: str, user_id: str, role: str, content: str):
    """Save a message to chat history"""
    await db.chat_history.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc)
    })


def build_context_prompt(client_context: Optional[dict]) -> str:
    """Build additional context from client financial data"""
    if not client_context:
        return ""
    
    context_parts = ["\n\n**Current Client Context:**"]
    
    if client_context.get("name"):
        context_parts.append(f"- Client: {client_context['name']}")
    
    if client_context.get("income"):
        context_parts.append(f"- Monthly Income: R{client_context['income']:,.0f}")
    
    if client_context.get("expenses"):
        context_parts.append(f"- Monthly Expenses: R{client_context['expenses']:,.0f}")
    
    if client_context.get("savings"):
        context_parts.append(f"- Current Savings: R{client_context['savings']:,.0f}")
    
    if client_context.get("investments"):
        context_parts.append(f"- Total Investments: R{client_context['investments']:,.0f}")
    
    if client_context.get("debts"):
        context_parts.append(f"- Total Debts: R{client_context['debts']:,.0f}")
    
    if client_context.get("goals"):
        context_parts.append(f"- Financial Goals: {', '.join(client_context['goals'])}")
    
    if client_context.get("risk_profile"):
        context_parts.append(f"- Risk Profile: {client_context['risk_profile']}")
    
    if client_context.get("age"):
        context_parts.append(f"- Age: {client_context['age']}")
    
    return "\n".join(context_parts)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Chat with the AI Financial Advisor (Premium feature)"""
    user_id = current_user["id"]
    
    # Check subscription (in production, verify premium status)
    # For now, we'll allow access but log it
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Generate or use provided session ID
    session_id = request.session_id or f"chat_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Get chat history for context
    history = await get_chat_history(session_id, limit=10)
    
    # Build system message with context
    system_message = FINANCIAL_ADVISOR_SYSTEM_PROMPT
    if request.client_context:
        system_message += build_context_prompt(request.client_context)
    
    # Initialize LLM chat
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    # Build conversation history for context
    # Note: The library manages its own history, but we add context from our DB
    conversation_context = ""
    if history:
        conversation_context = "\n\n**Recent conversation:**\n"
        for msg in history[-5:]:  # Last 5 messages for context
            role = "User" if msg["role"] == "user" else "Advisor"
            conversation_context += f"{role}: {msg['content'][:200]}...\n" if len(msg['content']) > 200 else f"{role}: {msg['content']}\n"
    
    # Create user message with context
    full_message = request.message
    if conversation_context:
        full_message = f"{conversation_context}\n\n**New question:** {request.message}"
    
    user_message = UserMessage(text=full_message)
    
    try:
        # Get response from AI
        response = await chat.send_message(user_message)
        
        # Save messages to database
        await save_message(session_id, user_id, "user", request.message)
        await save_message(session_id, user_id, "assistant", response)
        
        return ChatResponse(
            response=response,
            session_id=session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/history/{session_id}")
async def get_session_history(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for a session"""
    user_id = current_user["id"]
    
    cursor = db.chat_history.find(
        {"session_id": session_id, "user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", 1)
    
    messages = await cursor.to_list(length=100)
    
    return {
        "session_id": session_id,
        "messages": messages
    }


@router.get("/sessions")
async def get_user_sessions(
    current_user: dict = Depends(get_current_user)
):
    """Get all chat sessions for a user"""
    user_id = current_user["id"]
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$last": "$content"},
            "last_timestamp": {"$last": "$timestamp"},
            "message_count": {"$sum": 1}
        }},
        {"$sort": {"last_timestamp": -1}},
        {"$limit": 20}
    ]
    
    cursor = db.chat_history.aggregate(pipeline)
    sessions = await cursor.to_list(length=20)
    
    return {
        "sessions": [{
            "session_id": s["_id"],
            "preview": s["last_message"][:100] + "..." if len(s["last_message"]) > 100 else s["last_message"],
            "last_activity": s["last_timestamp"],
            "message_count": s["message_count"]
        } for s in sessions]
    }


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat session"""
    user_id = current_user["id"]
    
    result = await db.chat_history.delete_many({
        "session_id": session_id,
        "user_id": user_id
    })
    
    return {
        "deleted": result.deleted_count,
        "message": "Session deleted successfully"
    }


# Quick financial tips endpoint (doesn't require full chat)
@router.get("/quick-tip")
async def get_quick_tip(topic: Optional[str] = None):
    """Get a quick financial tip (available to all users)"""
    tips = {
        "savings": [
            "Aim to save at least 20% of your income. Start with 10% if needed and gradually increase.",
            "Set up automatic transfers to your savings account on payday.",
            "Build an emergency fund covering 3-6 months of expenses before investing.",
        ],
        "investing": [
            "Diversification is key - don't put all your eggs in one basket.",
            "Start investing early - compound interest is your best friend.",
            "Consider low-cost index funds for long-term wealth building.",
        ],
        "debt": [
            "Pay off high-interest debt first (avalanche method) for mathematical efficiency.",
            "Or pay off smallest debts first (snowball method) for psychological wins.",
            "Avoid taking on new debt while paying off existing debt.",
        ],
        "retirement": [
            "Contribute at least enough to get your employer's full pension match.",
            "Increase your retirement contribution by 1% each year.",
            "Consider a Tax-Free Savings Account (TFSA) for tax-efficient savings.",
        ],
        "general": [
            "Track your spending for one month to understand where your money goes.",
            "Review your subscriptions quarterly and cancel unused ones.",
            "Set specific, measurable financial goals with target dates.",
        ]
    }
    
    import random
    
    if topic and topic.lower() in tips:
        tip_list = tips[topic.lower()]
    else:
        # Random topic
        all_tips = [tip for tip_list in tips.values() for tip in tip_list]
        tip_list = all_tips
    
    return {
        "tip": random.choice(tip_list),
        "topic": topic or "general"
    }
