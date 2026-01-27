from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
from datetime import datetime, timezone
from models.client import Client, ClientCreate, ClientUpdate, FinancialData
from models.financial_plan import FinancialPlanAnalysis, FinancialDataUpdate
from utils.auth import get_current_user_id
from utils.financial_analyzer import analyze_financial_plan
import os

router = APIRouter(prefix="/clients", tags=["Clients"])

# Get database connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


@router.post("", response_model=Client)
async def create_client(
    client_data: ClientCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new client for the advisor"""
    client_obj = Client(
        **client_data.model_dump(),
        advisor_id=user_id
    )
    
    # Save to database
    client_dict = client_obj.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    client_dict['updated_at'] = client_dict['updated_at'].isoformat()
    await db.clients.insert_one(client_dict)
    
    return client_obj


@router.get("", response_model=List[Client])
async def get_clients(user_id: str = Depends(get_current_user_id)):
    """Get all clients for the advisor"""
    clients = await db.clients.find(
        {"advisor_id": user_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return clients


@router.get("/{client_id}", response_model=Client)
async def get_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific client"""
    client_doc = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    
    if not client_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    return Client(**client_doc)


@router.put("/{client_id}", response_model=Client)
async def update_client(
    client_id: str,
    update_data: ClientUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update client information"""
    # Check client exists
    existing = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id}
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Update only provided fields
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.clients.update_one(
        {"id": client_id},
        {"$set": update_dict}
    )
    
    # Return updated client
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**updated)


@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a client and all associated data"""
    # Check client exists
    existing = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id}
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Delete client and associated calculations
    await db.clients.delete_one({"id": client_id})
    await db.calculations.delete_many({"client_id": client_id})
    await db.financial_analyses.delete_many({"client_id": client_id})
    
    return {"message": "Client deleted successfully"}


@router.put("/{client_id}/financial-data", response_model=Client)
async def update_financial_data(
    client_id: str,
    financial_update: FinancialDataUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update client's financial data from calculator results"""
    # Check client exists
    existing = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Merge financial data updates
    current_financial = existing.get('financial_data', {})
    update_dict = {f"financial_data.{k}": v for k, v in financial_update.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.clients.update_one(
        {"id": client_id},
        {"$set": update_dict}
    )
    
    # Return updated client
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**updated)


@router.get("/{client_id}/analysis", response_model=FinancialPlanAnalysis)
async def get_financial_analysis(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get or generate financial plan analysis for a client"""
    # Get client
    client_doc = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id},
        {"_id": 0}
    )
    if not client_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Parse financial data
    financial_data = FinancialData(**client_doc.get('financial_data', {}))
    
    # Generate analysis
    analysis = analyze_financial_plan(client_id, user_id, financial_data)
    
    # Save analysis to database
    analysis_dict = analysis.model_dump()
    analysis_dict['created_at'] = analysis_dict['created_at'].isoformat()
    
    # Upsert - replace existing analysis
    await db.financial_analyses.update_one(
        {"client_id": client_id},
        {"$set": analysis_dict},
        upsert=True
    )
    
    return analysis


@router.post("/{client_id}/analysis/refresh", response_model=FinancialPlanAnalysis)
async def refresh_financial_analysis(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Force refresh the financial plan analysis"""
    return await get_financial_analysis(client_id, user_id)
