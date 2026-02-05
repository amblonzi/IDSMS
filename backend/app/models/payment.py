from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentBase(SQLModel):
    amount: float
    external_ref: Optional[str] = Field(description="M-Pesa Transaction ID", index=True, default=None)
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    timestamp: datetime = Field(default_factory=datetime.now)
    enrollment_id: UUID = Field(foreign_key="enrollment.id")
    method: str = Field(default="MPESA")

class Payment(PaymentBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)

class PaymentCreate(PaymentBase):
    pass

class PaymentRead(PaymentBase):
    id: UUID
