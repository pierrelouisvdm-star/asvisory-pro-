from pydantic import BaseModel
from typing import Optional


class CommunityProfileUpdate(BaseModel):
    specialty: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None


class CommunityProfileResponse(BaseModel):
    user_id: str
    specialty: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None


class CommunityMember(BaseModel):
    user_id: str
    full_name: str
    company: Optional[str] = None
    jurisdiction: str  # "ZA" or "US"
    specialty: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    is_me: bool = False
