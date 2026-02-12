from typing import Annotated, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api import deps
from app.core import db
from app.models.payment import Payment, PaymentCreate, PaymentRead, PaymentStatus
from app.models.course import Enrollment
from app.models.user import User

router = APIRouter()

@router.post("/initiate/mpesa/{enrollment_id}", response_model=PaymentRead)
async def initiate_payment(
    enrollment_id: UUID,
    amount: float,
    phone_number: str,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Initiate an M-Pesa STK Push.
    """
    from decimal import Decimal
    from app.validators import PaymentValidator
    from app.api.deps import log_audit
    from app.services.mpesa import MpesaService
    
    # Convert amount to Decimal for validation
    amount_decimal = Decimal(str(amount))
    
    # Validate payment amount
    is_valid, error = PaymentValidator.validate_amount(amount_decimal)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Check daily payment limit
    is_valid, error = await PaymentValidator.validate_daily_limit(
        user_id=str(current_user.id),
        amount=amount_decimal,
        db_session=session
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Verify enrollment exists
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Create Pending Payment Record FIRST
    payment = Payment(
        enrollment_id=enrollment_id,
        amount=amount_decimal,
        status=PaymentStatus.PENDING,
        method="MPESA",
        external_ref=f"PENDING_{datetime.now().timestamp()}" # Temporary ref
    )
    session.add(payment)
    await session.commit()
    await session.refresh(payment)
    
    # Initiate STK Push
    try:
        mpesa_response = await MpesaService.stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=f"INV-{str(enrollment_id)[:8].upper()}",
            transaction_desc=f"Payment for Enrollment {str(enrollment_id)[:8]}"
        )
        
        # Update payment with CheckoutRequestID
        checkout_request_id = mpesa_response.get('CheckoutRequestID')
        payment.external_ref = checkout_request_id
        session.add(payment)
        await session.commit()
        
    except Exception as e:
        # If STK Push fails, mark payment as failed
        payment.status = PaymentStatus.FAILED
        session.add(payment)
        await session.commit()
        raise HTTPException(status_code=400, detail=f"M-Pesa Initiation Failed: {str(e)}")
    
    # Log payment initiation
    await log_audit(
        session=session,
        user_id=current_user.id,
        action="payment_initiated",
        resource_type="payment",
        resource_id=payment.id,
        success=True,
        details={"amount": float(amount_decimal), "method": "mpesa", "phone": phone_number}
    )
    
    return payment

@router.post("/callback/mpesa")
async def mpesa_callback(
    request: Request,
    session: Annotated[AsyncSession, Depends(db.get_session)]
):
    """
    Receive M-Pesa Callback.
    """
    payload = await request.json()
    print(f"--- Received M-Pesa Callback: {payload} ---")
    
    try:
        stk_callback = payload.get('Body', {}).get('stkCallback', {})
        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        # Find payment by CheckoutRequestID (stored in external_ref)
        result = await session.execute(
            select(Payment).where(Payment.external_ref == checkout_request_id)
        )
        payment = result.scalars().first()
        
        if not payment:
            print(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
            return {"status": "Payment not found"}
        
        if result_code == 0:
            # Success
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            amount = next((item.get('Value') for item in callback_metadata if item.get('Name') == 'Amount'), 0)
            mpesa_receipt_number = next((item.get('Value') for item in callback_metadata if item.get('Name') == 'MpesaReceiptNumber'), None)
            
            payment.status = PaymentStatus.COMPLETED
            # Update external_ref to the actual Receipt Number for future reference
            payment.external_ref = mpesa_receipt_number 
            
            # Update Enrollment Total Paid
            enrollment = await session.get(Enrollment, payment.enrollment_id)
            if enrollment:
                enrollment.total_paid += float(amount)
                # Check if fully paid (logic depends on course price, implemented naively here)
                
        else:
            # Failed or Cancelled
            payment.status = PaymentStatus.FAILED
            
        session.add(payment)
        await session.commit()
        
        return {"status": "Callback Processed"}
        
    except Exception as e:
        print(f"Error processing callback: {e}")
        return {"status": "Error"}

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
