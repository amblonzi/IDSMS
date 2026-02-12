from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SettingsBase(BaseModel):
    """Base settings schema"""
    school_name: str = Field(..., min_length=1, max_length=100)
    school_tagline: str = Field(..., min_length=1, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    primary_color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    logo_url: Optional[str] = Field(None, max_length=500)
    timezone: str = Field(..., max_length=50)
    currency: str = Field(..., min_length=3, max_length=3)


class SettingsRead(SettingsBase):
    """Settings response schema"""
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    """Settings update schema - all fields optional for partial updates"""
    school_name: Optional[str] = Field(None, min_length=1, max_length=100)
    school_tagline: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    logo_url: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
