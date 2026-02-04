from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(
    title="AdvisoryPro API",
    description="Financial Advisor Suite - Backend API",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import routes
from routes.auth import router as auth_router
from routes.clients import router as clients_router
from routes.calculations import router as calculations_router
from routes.tools import router as tools_router
from routes.portfolio import router as portfolio_router
from routes.subscriptions import router as subscriptions_router
from routes.market import router as market_router
from routes.ai_advisor import router as ai_advisor_router
from routes.coupons import router as coupons_router
from routes.analytics import router as analytics_router
from routes.net_worth import router as net_worth_router
from routes.audit import router as audit_router
from routes.payments import router as payments_router

# Include route modules
api_router.include_router(auth_router)
api_router.include_router(clients_router)
api_router.include_router(calculations_router)
api_router.include_router(tools_router)
api_router.include_router(portfolio_router)
api_router.include_router(subscriptions_router)
api_router.include_router(market_router)
api_router.include_router(ai_advisor_router)
api_router.include_router(coupons_router)
api_router.include_router(analytics_router)
api_router.include_router(net_worth_router)
api_router.include_router(audit_router)
api_router.include_router(payments_router)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "advisorypro-api"}

# Stripe webhook endpoint
from fastapi import Request
from emergentintegrations.payments.stripe.checkout import StripeCheckout

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        return {"status": "error", "message": "Stripe not configured"}
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Process the webhook event
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            # Update transaction and subscription
            db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}}
            )
        
        return {"status": "success", "event_type": webhook_response.event_type}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Include the main router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    """Create database indexes on startup"""
    # User indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    
    # Client indexes
    await db.clients.create_index("id", unique=True)
    await db.clients.create_index("advisor_id")
    await db.clients.create_index([("advisor_id", 1), ("created_at", -1)])
    
    # Calculation indexes
    await db.calculations.create_index("id", unique=True)
    await db.calculations.create_index([("client_id", 1), ("created_at", -1)])
    await db.calculations.create_index([("advisor_id", 1), ("calculator_type", 1)])
    
    # Financial analysis indexes
    await db.financial_analyses.create_index("client_id", unique=True)
    
    # Goals indexes
    await db.goals.create_index("id", unique=True)
    await db.goals.create_index([("client_id", 1), ("priority", 1)])
    
    # Meetings indexes
    await db.meetings.create_index("id", unique=True)
    await db.meetings.create_index([("client_id", 1), ("meeting_date", -1)])
    
    # Reviews indexes
    await db.reviews.create_index("client_id", unique=True)
    await db.reviews.create_index([("advisor_id", 1), ("next_review_date", 1)])
    
    # Portfolio indexes
    await db.portfolios.create_index("client_id", unique=True)
    
    # Loan comparisons indexes
    await db.loan_comparisons.create_index("id", unique=True)
    await db.loan_comparisons.create_index([("client_id", 1), ("created_at", -1)])
    
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
