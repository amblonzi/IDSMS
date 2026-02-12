from typing import Optional
from uuid import UUID
from datetime import date, datetime
from sqlmodel import Field, SQLModel

from app.models.base import BaseModel

class VehicleBase(SQLModel):
    reg_number: str = Field(index=True, unique=True, description="Registration Number (e.g., KAA 123B)")
    type: str = Field(description="Manual, Automatic, Truck, Bicycle, etc.")
    make_model: Optional[str] = None
    insurance_expiry: Optional[date] = None
    next_service_date: Optional[date] = None
    is_active: bool = True

class Vehicle(VehicleBase, BaseModel, table=True):
    pass

class VehicleCreate(VehicleBase):
    pass

class VehicleRead(VehicleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
