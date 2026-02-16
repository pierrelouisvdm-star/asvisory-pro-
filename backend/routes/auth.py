from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User, UserCreate, UserLogin, UserInDB, Token
from utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
import os
import secrets
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Get database connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new advisor account"""
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if this is the owner/admin email
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower()
    is_admin = admin_email and user_data.email.lower() == admin_email
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        company=user_data.company,
        is_admin=is_admin
    )
    
    # Hash password and store
    user_in_db = UserInDB(
        **user.model_dump(),
        hashed_password=get_password_hash(user_data.password)
    )
    
    # Save to database
    user_dict = user_in_db.model_dump()
    now = datetime.now(timezone.utc)
    user_dict['created_at'] = now.isoformat()
    user_dict['last_login'] = now.isoformat()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, user=user)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with email and password"""
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last_login
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create user response (without hashed password)
    user = User(
        id=user_doc["id"],
        email=user_doc["email"],
        full_name=user_doc.get("full_name"),
        company=user_doc.get("company"),
        is_active=user_doc.get("is_active", True),
        is_admin=user_doc.get("is_admin", False)
    )
    
    # Create access token - 30 days if remember_me, else 7 days
    from datetime import timedelta
    if credentials.remember_me:
        expires_delta = timedelta(days=30)
    else:
        expires_delta = timedelta(days=7)
    
    access_token = create_access_token(data={"sub": user.id}, expires_delta=expires_delta)
    
    return Token(access_token=access_token, user=user)


@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user_doc = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "hashed_password": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(**user_doc)


# Password Reset Models
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Request a password reset token"""
    user = await db.users.find_one({"email": request.email.lower()})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"success": True, "message": "If an account exists with this email, a reset code has been generated."}
    
    # Generate a 6-digit reset code (easier for users to type)
    reset_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    # Store reset token with expiry (15 minutes)
    reset_data = {
        "user_id": user.get("id"),
        "email": request.email.lower(),
        "code": reset_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
        "used": False
    }
    
    # Remove any existing reset tokens for this user
    await db.password_resets.delete_many({"email": request.email.lower()})
    
    # Save new reset token
    await db.password_resets.insert_one(reset_data)
    
    # In production, you would send an email here
    # For now, we'll return the code (REMOVE IN PRODUCTION)
    return {
        "success": True, 
        "message": "If an account exists with this email, a reset code has been generated.",
        "reset_code": reset_code,  # REMOVE THIS IN PRODUCTION - only for testing
        "expires_in_minutes": 15
    }


@router.post("/verify-reset-code")
async def verify_reset_code(data: PasswordResetVerify):
    """Verify reset code and set new password"""
    # Find the reset token
    reset_record = await db.password_resets.find_one({
        "code": data.token,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code"
        )
    
    # Check if expired
    expires_at = reset_record.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one."
        )
    
    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Update user's password
    new_hash = get_password_hash(data.new_password)
    result = await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"hashed_password": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"success": True, "message": "Password has been reset successfully. You can now log in."}
