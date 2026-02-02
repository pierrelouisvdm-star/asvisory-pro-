"""
Security and Audit Logging Module for AdvisoryPro
POPIA-compliant security measures for financial advisor data protection
"""

from datetime import datetime, timezone
from typing import Optional, List
from fastapi import Request
from pydantic import BaseModel
from enum import Enum
import hashlib
import os


class AuditAction(str, Enum):
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    
    # Client Data
    CLIENT_CREATE = "client_create"
    CLIENT_VIEW = "client_view"
    CLIENT_UPDATE = "client_update"
    CLIENT_DELETE = "client_delete"
    CLIENT_EXPORT = "client_export"
    
    # Financial Data
    FINANCIAL_DATA_VIEW = "financial_data_view"
    FINANCIAL_DATA_UPDATE = "financial_data_update"
    CALCULATION_PERFORMED = "calculation_performed"
    REPORT_GENERATED = "report_generated"
    
    # Admin Actions
    COUPON_GENERATED = "coupon_generated"
    USER_DEACTIVATED = "user_deactivated"


class AuditLog(BaseModel):
    """Audit log entry for tracking all data access"""
    id: str
    timestamp: datetime
    user_id: str
    user_email: str
    action: AuditAction
    resource_type: str  # e.g., "client", "calculation", "report"
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[dict] = None
    success: bool = True


class SecurityConfig:
    """Security configuration constants"""
    # Password requirements
    MIN_PASSWORD_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True
    
    # Session settings
    MAX_SESSION_DURATION_DAYS = 30
    IDLE_TIMEOUT_HOURS = 24
    
    # Rate limiting
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15
    
    # Data retention (POPIA compliance)
    AUDIT_LOG_RETENTION_DAYS = 365 * 5  # 5 years
    INACTIVE_CLIENT_ARCHIVE_DAYS = 365 * 7  # 7 years


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements
    Returns (is_valid, error_message)
    """
    if len(password) < SecurityConfig.MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {SecurityConfig.MIN_PASSWORD_LENGTH} characters"
    
    if SecurityConfig.REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if SecurityConfig.REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if SecurityConfig.REQUIRE_DIGIT and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    if SecurityConfig.REQUIRE_SPECIAL:
        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        if not any(c in special_chars for c in password):
            return False, "Password must contain at least one special character"
    
    return True, ""


def mask_sensitive_data(data: dict, fields_to_mask: List[str]) -> dict:
    """
    Mask sensitive fields in data for logging purposes
    """
    masked = data.copy()
    for field in fields_to_mask:
        if field in masked:
            value = str(masked[field])
            if len(value) > 4:
                masked[field] = value[:2] + "*" * (len(value) - 4) + value[-2:]
            else:
                masked[field] = "****"
    return masked


def hash_for_comparison(value: str) -> str:
    """
    Create a hash for secure comparison without storing raw data
    """
    salt = os.environ.get("JWT_SECRET", "default-salt")
    return hashlib.sha256(f"{salt}{value}".encode()).hexdigest()[:16]


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request, handling proxies
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class DataIsolationPolicy:
    """
    Enforces data isolation between advisors
    Each advisor can only access their own clients' data
    """
    
    SENSITIVE_FIELDS = [
        "id_number",
        "passport_number", 
        "bank_account",
        "tax_number",
        "phone",
        "email",
        "address"
    ]
    
    @staticmethod
    def get_advisor_filter(user_id: str) -> dict:
        """
        Returns a MongoDB filter that ensures data isolation
        """
        return {"advisor_id": user_id}
    
    @staticmethod
    def verify_ownership(resource: dict, user_id: str) -> bool:
        """
        Verify that a resource belongs to the specified advisor
        """
        return resource.get("advisor_id") == user_id


# POPIA Compliance helpers
class POPIACompliance:
    """
    POPIA (Protection of Personal Information Act) compliance utilities
    """
    
    @staticmethod
    def get_consent_text() -> str:
        return """
        By using AdvisoryPro, you consent to the collection, processing, and storage 
        of personal information in accordance with the Protection of Personal Information 
        Act (POPIA). Your data will only be used for financial planning purposes and 
        will not be shared with third parties without your explicit consent.
        """
    
    @staticmethod
    def get_data_categories() -> List[dict]:
        """Categories of personal data collected"""
        return [
            {
                "category": "Identity Information",
                "examples": ["Name", "ID Number", "Date of Birth"],
                "purpose": "Client identification and regulatory compliance",
                "retention": "Duration of advisory relationship + 7 years"
            },
            {
                "category": "Contact Information", 
                "examples": ["Email", "Phone", "Address"],
                "purpose": "Communication and service delivery",
                "retention": "Duration of advisory relationship + 7 years"
            },
            {
                "category": "Financial Information",
                "examples": ["Income", "Assets", "Liabilities", "Tax Information"],
                "purpose": "Financial planning and advice",
                "retention": "Duration of advisory relationship + 7 years"
            },
            {
                "category": "Risk Profile",
                "examples": ["Risk tolerance", "Investment preferences"],
                "purpose": "Suitable product recommendations",
                "retention": "Duration of advisory relationship + 7 years"
            }
        ]
    
    @staticmethod
    def get_client_rights() -> List[str]:
        """Client rights under POPIA"""
        return [
            "Right to be informed about data collection",
            "Right to access your personal information",
            "Right to request correction of inaccurate data",
            "Right to request deletion of data (subject to legal retention requirements)",
            "Right to object to processing",
            "Right to withdraw consent",
            "Right to lodge a complaint with the Information Regulator"
        ]
