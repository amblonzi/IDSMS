from typing import Optional
from uuid import UUID, uuid4
from datetime import date
from sqlmodel import Field, SQLModel

class VehicleBase(SQLModel):
    reg_number: str = Field(index=True, unique=True, description="Registration Number (e.g., KAA 123B)")
    type: str = Field(description="Manual, Automatic, Truck, Bicycle, etc.")
    make_model: Optional[str] = None
    insurance_expiry: Optional[date] = None
    next_service_date: Optional[date] = None
    is_active: bool = True

class Vehicle(VehicleBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)

class VehicleCreate(VehicleBase):
    pass

class VehicleRead(VehicleBase):
    id: UUID
