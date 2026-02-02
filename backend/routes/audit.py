"""
Audit Logging Routes for AdvisoryPro
Provides audit trail and security logging endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
from utils.auth import get_current_user
from utils.security import AuditAction, AuditLog, get_client_ip
import uuid
import os

router = APIRouter(prefix="/audit", tags=["Audit & Security"])

# Get database connection
from motor.motor_asyncio import AsyncIOMotorClient
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


async def log_audit_event(
    user_id: str,
    user_email: str,
    action: AuditAction,
    resource_type: str,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict] = None,
    success: bool = True
):
    """
    Log an audit event to the database
    """
    audit_entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc),
        "user_id": user_id,
        "user_email": user_email,
        "action": action.value,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "details": details,
        "success": success
    }
    
    await db.audit_logs.insert_one(audit_entry)
    return audit_entry


@router.get("/logs")
async def get_audit_logs(
    current_user: dict = Depends(get_current_user),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    days: int = 30,
    limit: int = 100
):
    """
    Get audit logs for the current advisor's actions
    Advisors can only see their own audit trail
    """
    # Build query - advisors can only see their own logs
    query = {"user_id": current_user["id"]}
    
    # Filter by date range
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    query["timestamp"] = {"$gte": start_date}
    
    if action:
        query["action"] = action
    
    if resource_type:
        query["resource_type"] = resource_type
    
    # Fetch logs
    cursor = db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    return {
        "total": len(logs),
        "period_days": days,
        "logs": logs
    }


@router.get("/summary")
async def get_security_summary(
    current_user: dict = Depends(get_current_user)
):
    """
    Get security summary for the current advisor
    """
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    
    # Count activities in last 30 days
    thirty_days_ago = now - timedelta(days=30)
    
    # Get login count
    login_count = await db.audit_logs.count_documents({
        "user_id": user_id,
        "action": AuditAction.LOGIN_SUCCESS.value,
        "timestamp": {"$gte": thirty_days_ago}
    })
    
    # Get client access count
    client_access_count = await db.audit_logs.count_documents({
        "user_id": user_id,
        "resource_type": "client",
        "timestamp": {"$gte": thirty_days_ago}
    })
    
    # Get failed login attempts
    failed_logins = await db.audit_logs.count_documents({
        "user_email": current_user["email"],
        "action": AuditAction.LOGIN_FAILED.value,
        "timestamp": {"$gte": thirty_days_ago}
    })
    
    # Get last login
    last_login = await db.audit_logs.find_one(
        {"user_id": user_id, "action": AuditAction.LOGIN_SUCCESS.value},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    # Get total clients
    total_clients = await db.clients.count_documents({"advisor_id": user_id})
    
    return {
        "user_id": user_id,
        "period": "last_30_days",
        "login_count": login_count,
        "client_access_count": client_access_count,
        "failed_login_attempts": failed_logins,
        "last_login": last_login["timestamp"] if last_login else None,
        "total_clients": total_clients,
        "security_status": "secure" if failed_logins < 3 else "review_recommended"
    }


@router.get("/data-access/{client_id}")
async def get_client_data_access_log(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    days: int = 90
):
    """
    Get all data access logs for a specific client
    Useful for POPIA compliance - showing who accessed client data
    """
    # Verify advisor owns this client
    client_doc = await db.clients.find_one({
        "id": client_id,
        "advisor_id": current_user["id"]
    })
    
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get access logs
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    cursor = db.audit_logs.find({
        "resource_id": client_id,
        "timestamp": {"$gte": start_date}
    }, {"_id": 0}).sort("timestamp", -1)
    
    logs = await cursor.to_list(length=500)
    
    return {
        "client_id": client_id,
        "client_name": f"{client_doc.get('first_name', '')} {client_doc.get('last_name', '')}",
        "period_days": days,
        "total_access_events": len(logs),
        "access_logs": logs
    }


@router.get("/privacy-report")
async def get_privacy_report(
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a POPIA compliance privacy report for the advisor
    """
    user_id = current_user["id"]
    
    # Get all clients
    clients = await db.clients.find(
        {"advisor_id": user_id},
        {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "created_at": 1}
    ).to_list(1000)
    
    # Get data categories stored
    from utils.security import POPIACompliance
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "advisor_id": user_id,
        "advisor_email": current_user["email"],
        "total_clients": len(clients),
        "data_categories": POPIACompliance.get_data_categories(),
        "client_rights": POPIACompliance.get_client_rights(),
        "consent_text": POPIACompliance.get_consent_text(),
        "data_retention_policy": {
            "active_clients": "Data retained for duration of advisory relationship",
            "inactive_clients": "Data retained for 7 years after last activity (regulatory requirement)",
            "audit_logs": "Retained for 5 years"
        },
        "security_measures": [
            "Password hashing using bcrypt",
            "JWT token authentication with expiry",
            "Data isolation between advisors",
            "Audit logging of all data access",
            "HTTPS encryption in transit",
            "MongoDB encryption at rest"
        ]
    }
