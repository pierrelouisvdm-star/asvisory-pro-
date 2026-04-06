from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User, UserCreate, UserLogin, UserInDB, Token
from utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
import os
import secrets
import uuid
import asyncio
import resend
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

# Get database connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000, socketTimeoutMS=30000)
db = client[db_name]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'support@advisorypro.co.za')


async def send_password_reset_email(to_email: str, reset_code: str, user_name: str = None):
    """Send password reset email via Resend"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AdvisoryPro</h1>
            <p style="color: #94a3b8; margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <p style="font-size: 16px;">Hi{' ' + user_name if user_name else ''},</p>
        
        <p style="font-size: 16px;">We received a request to reset your password. Use the code below to complete the process:</p>
        
        <div style="background: #f1f5f9; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
            <p style="font-size: 14px; color: #64748b; margin: 0 0 10px 0;">Your reset code:</p>
            <h2 style="font-size: 36px; letter-spacing: 8px; color: #1e293b; margin: 0; font-family: monospace;">{reset_code}</h2>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">This code will expire in <strong>15 minutes</strong>.</p>
        
        <p style="font-size: 14px; color: #64748b;">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            © 2026 AdvisoryPro. All rights reserved.<br>
            This is an automated message, please do not reply.
        </p>
    </body>
    </html>
    """
    
    params = {
        "from": f"AdvisoryPro <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": "Reset Your AdvisoryPro Password",
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {to_email}, email_id: {email.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
        return False


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
    # Find user (case-insensitive email match)
    user_doc = await db.users.find_one(
        {"email": {"$regex": f"^{credentials.email}$", "$options": "i"}}, 
        {"_id": 0}
    )
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
        return {"success": True, "message": "If an account exists with this email, a reset link has been sent."}
    
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
    
    # Send password reset email
    user_name = user.get("full_name", "").split()[0] if user.get("full_name") else None
    email_sent = await send_password_reset_email(request.email.lower(), reset_code, user_name)
    
    if not email_sent:
        logger.warning(f"Failed to send password reset email to {request.email}")
    
    return {
        "success": True, 
        "message": "If an account exists with this email, a reset code has been sent.",
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
    
    # Handle timezone-naive datetimes by assuming UTC
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
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
