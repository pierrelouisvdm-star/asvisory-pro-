from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
from models.calculation import Calculation, CalculationCreate, CalculatorType
from utils.auth import get_current_user_id
import os

router = APIRouter(prefix="/calculations", tags=["Calculations"])

# Get database connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000, socketTimeoutMS=30000)
db = client[db_name]


@router.post("", response_model=Calculation)
async def save_calculation(
    calc_data: CalculationCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Save a calculation for a client"""
    # Verify client belongs to advisor
    client_doc = await db.clients.find_one(
        {"id": calc_data.client_id, "advisor_id": user_id}
    )
    if not client_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Create calculation
    calculation = Calculation(
        **calc_data.model_dump(),
        advisor_id=user_id
    )
    
    # Save to database
    calc_dict = calculation.model_dump()
    calc_dict['created_at'] = calc_dict['created_at'].isoformat()
    calc_dict['calculator_type'] = calc_dict['calculator_type'].value
    await db.calculations.insert_one(calc_dict)
    
    return calculation


@router.get("/client/{client_id}", response_model=List[Calculation])
async def get_client_calculations(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get all calculations for a specific client"""
    # Verify client belongs to advisor
    client_doc = await db.clients.find_one(
        {"id": client_id, "advisor_id": user_id}
    )
    if not client_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    calculations = await db.calculations.find(
        {"client_id": client_id, "advisor_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return calculations


@router.get("/client/{client_id}/type/{calc_type}", response_model=List[Calculation])
async def get_calculations_by_type(
    client_id: str,
    calc_type: CalculatorType,
    user_id: str = Depends(get_current_user_id)
):
    """Get calculations for a client filtered by calculator type"""
    calculations = await db.calculations.find(
        {
            "client_id": client_id, 
            "advisor_id": user_id,
            "calculator_type": calc_type.value
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return calculations


@router.get("/{calc_id}", response_model=Calculation)
async def get_calculation(
    calc_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific calculation"""
    calc_doc = await db.calculations.find_one(
        {"id": calc_id, "advisor_id": user_id},
        {"_id": 0}
    )
    
    if not calc_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    return Calculation(**calc_doc)


@router.delete("/{calc_id}")
async def delete_calculation(
    calc_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a calculation"""
    result = await db.calculations.delete_one(
        {"id": calc_id, "advisor_id": user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )
    
    return {"message": "Calculation deleted successfully"}
