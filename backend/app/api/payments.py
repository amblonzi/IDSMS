from typing import Annotated, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api import deps
from app.core import db
from app.models.payment import Payment, PaymentCreate, PaymentRead, PaymentStatus
from app.models.course import Enrollment
from app.models.user import User

router = APIRouter()

class MPesaCallback(BaseModel):
    """
    Mock M-Pesa Callback Structure.
    In reality, this is a deeply nested JSON.
    """
    TransactionID: str
    Amount: float
    PhoneNumber: str
    ResultCode: int # 0 is success

@router.post("/simulate-mpesa/{enrollment_id}", response_model=PaymentRead)
async def simulate_payment(
    enrollment_id: UUID,
    amount: float,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Simulate initiating an M-Pesa STK Push.
    In a real app, this would call SafariCom API.
    Here, it creates a PENDING payment and schedules a fake callback.
    """
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Create Pending Payment
    payment = Payment(
        enrollment_id=enrollment_id,
        amount=amount,
        status=PaymentStatus.PENDING,
        external_ref=f"REQ_{enrollment_id.hex[:8]}" # Placeholder
    )
    session.add(payment)
    await session.commit()
    await session.refresh(payment)
    
    # Simulate Callback (Fake Async Process)
    # In reality, Safaricom calls US back. Here we just print.
    print(f"--- M-Pesa STK Push Initiated for {amount} KES ---")
    
    return payment

@router.post("/callback/mpesa")
async def mpesa_callback(
    callback_data: MPesaCallback,
    session: Annotated[AsyncSession, Depends(db.get_session)]
):
    """
    Receive M-Pesa Callback.
    """
    # Find payment by TransactionID or Metadata (not implemented fully here)
    # For demo, we assume we find the latest pending for an enrollment or matching ref
    # Here we just demo the logic
    
    # 1. Look up payment (Mock logic: find randomly or by ID if passed)
    # skipping precise lookup for mock
    print(f"--- Received M-Pesa Callback: {callback_data} ---")
    
    if callback_data.ResultCode == 0:
         # Success - Update enrollment
         # Logic would be:
         # payment = await session.get(Payment, payment_id)
         # payment.status = PaymentStatus.COMPLETED
         # payment.external_ref = callback_data.TransactionID
         # enrollment.total_paid += callback_data.Amount
         # await session.commit()
         return {"status": "Payment Processed"}
    else:
         # Failed
         return {"status": "Payment Failed"}

@router.get("/", response_model=List[PaymentRead])
async def read_payments(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)],
    skip: int = 0,
    limit: int = 100
):
    """
    List history of payments (Admin).
    """
    result = await session.execute(select(Payment).offset(skip).limit(limit))
    return result.scalars().all()
