from typing import Optional
from uuid import UUID
from datetime import datetime, date
from sqlmodel import Field, SQLModel, Relationship

from app.models.base import BaseModel

class ProfileBase(SQLModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    phone_number: str = Field(index=True, description="Kenyan Phone format +254...")
    national_id: str = Field(unique=True, index=True, description="NTSA requirement")
    license_number: Optional[str] = Field(default=None, description="Driving License for Instructors")
    
    # PDL Tracking (Kenyan Requirement)
    pdl_number: Optional[str] = Field(default=None, description="Provisional Driving License Number")
    pdl_issue_date: Optional[date] = None
    pdl_expiry_date: Optional[date] = None

    address: Optional[str] = None
    city: Optional[str] = "Nairobi"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
class Profile(ProfileBase, BaseModel, table=True):
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    
    # Check circular import if defining relationship back to User
    # user: User = Relationship(back_populates="profile")

class ProfileCreate(ProfileBase):
    pass

class ProfileRead(ProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
