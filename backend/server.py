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
    title="WealthCalc API",
    description="Financial Advisor Suite - Backend API",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import routes
from routes.auth import router as auth_router
from routes.clients import router as clients_router
from routes.calculations import router as calculations_router

# Include route modules
api_router.include_router(auth_router)
api_router.include_router(clients_router)
api_router.include_router(calculations_router)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "wealthcalc-api"}

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
    
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
