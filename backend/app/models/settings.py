from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class Settings(SQLModel, table=True):
    """
    System settings model - singleton table (should only have one row)
    Stores school identity and system preferences
    """
    __tablename__ = "settings"
    
    id: int = Field(default=1, primary_key=True)  # Always 1 for singleton
    
    # School Identity
    school_name: str = Field(default="IDSMS", max_length=100)
    school_tagline: str = Field(
        default="Inphora Driving School Management System",
        max_length=200
    )
    contact_email: Optional[str] = Field(default=None, max_length=100)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=500)
    
    # Branding
    primary_color: str = Field(default="#3b82f6", max_length=7)  # Hex color
    logo_url: Optional[str] = Field(default=None, max_length=500)
    
    # System Preferences
    timezone: str = Field(default="Africa/Nairobi", max_length=50)
    currency: str = Field(default="KES", max_length=3)
    
    # Metadata
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
