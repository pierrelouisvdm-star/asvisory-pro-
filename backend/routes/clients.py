from fastapi import APIRouter, HTTPException, status, Depends, Request
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
from datetime import datetime, timezone
from models.client import Client, ClientCreate, ClientUpdate, FinancialData
from models.financial_plan import FinancialPlanAnalysis, FinancialDataUpdate
from utils.auth import get_current_user_id, get_current_user
from utils.financial_analyzer import analyze_financial_plan
from utils.security import AuditAction, get_client_ip
import os

router = APIRouter(prefix="/clients", tags=["Clients"])

# Get database connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000, socketTimeoutMS=30000)
db = client[db_name]


async def log_client_access(user_id: str, user_email: str, action: AuditAction, client_id: str = None, details: dict = None, request: Request = None):
    """Helper to log client data access"""
    from routes.audit import log_audit_event
    await log_audit_event(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource_type="client",
        resource_id=client_id,
        ip_address=get_client_ip(request) if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
        details=details
    )


@router.post("", response_model=Client)
async def create_client(
    client_data: ClientCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new client for the advisor"""
    user_id = current_user["id"]
    
    client_obj = Client(
        **client_data.model_dump(),
        advisor_id=user_id
    )
    
    # Save to database
    client_dict = client_obj.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    client_dict['updated_at'] = client_dict['updated_at'].isoformat()
    await db.clients.insert_one(client_dict)
    
    # Log audit event
    await log_client_access(
        user_id=user_id,
        user_email=current_user["email"],
        action=AuditAction.CLIENT_CREATE,
        client_id=client_obj.id,
        details={"client_name": f"{client_data.first_name} {client_data.last_name}"},
        request=request
    )
    
    return client_obj


@router.get("", response_model=List[Client])
async def get_clients(current_user: dict = Depends(get_current_user)):
    """Get all clients for the advisor"""
    clients = await db.clients.find(
        {"advisor_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return clients


@router.get("/{client_id}", response_model=Client)
async def get_client(
    client_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific client"""
    client_doc = await db.clients.find_one(
        {"id": client_id, "advisor_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not client_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Log audit event
    await log_client_access(
        user_id=current_user["id"],
        user_email=current_user["email"],
        action=AuditAction.CLIENT_VIEW,
        client_id=client_id,
        request=request
    )
    
    return Client(**client_doc)


@router.put("/{client_id}", response_model=Client)
async def update_client(
    client_id: str,
    update_data: ClientUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update client information"""
    user_id = current_user["id"]
    
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
    
    # Log audit event
    await log_client_access(
        user_id=user_id,
        user_email=current_user["email"],
        action=AuditAction.CLIENT_UPDATE,
        client_id=client_id,
        details={"updated_fields": list(update_dict.keys())},
        request=request
    )
    
    # Return updated client
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**updated)


@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete a client and all associated data"""
    user_id = current_user["id"]
    
    # Check client exists
    existing = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id}
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Log audit event BEFORE deletion
    await log_client_access(
        user_id=user_id,
        user_email=current_user["email"],
        action=AuditAction.CLIENT_DELETE,
        client_id=client_id,
        details={"client_name": f"{existing.get('first_name', '')} {existing.get('last_name', '')}"},
        request=request
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
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update client's financial data from calculator results"""
    user_id = current_user["id"]
    
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
    
    # Log audit event
    await log_client_access(
        user_id=user_id,
        user_email=current_user["email"],
        action=AuditAction.FINANCIAL_DATA_UPDATE,
        client_id=client_id,
        details={"updated_fields": list(financial_update.model_dump().keys())},
        request=request
    )
    
    # Return updated client
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**updated)


@router.get("/{client_id}/analysis", response_model=FinancialPlanAnalysis)
async def get_financial_analysis(
    client_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get or generate financial plan analysis for a client"""
    user_id = current_user["id"]
    
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
    
    # Log audit event
    await log_client_access(
        user_id=user_id,
        user_email=current_user["email"],
        action=AuditAction.FINANCIAL_DATA_VIEW,
        client_id=client_id,
        details={"analysis_type": "financial_plan"},
        request=request
    )
    
    return analysis


@router.post("/{client_id}/analysis/refresh", response_model=FinancialPlanAnalysis)
async def refresh_financial_analysis(
    client_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Force refresh the financial plan analysis"""
    return await get_financial_analysis(client_id, request, current_user)
