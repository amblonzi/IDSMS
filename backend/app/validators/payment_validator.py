"""
Payment validation utilities.

Validates payment amounts, limits, and business rules.
"""
from decimal import Decimal
from typing import Optional, Tuple
from datetime import datetime

from app.core.config import settings


class PaymentValidator:
    """Validator for payment-related operations."""
    
    # Business rules
    MIN_PAYMENT_AMOUNT = Decimal("100.00")  # Minimum KES 100
    MAX_PAYMENT_AMOUNT = Decimal("500000.00")  # Maximum KES 500,000
    MAX_DAILY_PAYMENT_LIMIT = Decimal("1000000.00")  # KES 1M per day
    
    @staticmethod
    def validate_amount(amount: Decimal) -> Tuple[bool, Optional[str]]:
        """
        Validate payment amount.
        
        Args:
            amount: Payment amount to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if amount <= 0:
            return False, "Payment amount must be greater than zero"
        
        if amount < PaymentValidator.MIN_PAYMENT_AMOUNT:
            return False, f"Payment amount must be at least KES {PaymentValidator.MIN_PAYMENT_AMOUNT}"
        
        if amount > PaymentValidator.MAX_PAYMENT_AMOUNT:
            return False, f"Payment amount cannot exceed KES {PaymentValidator.MAX_PAYMENT_AMOUNT}"
        
        # Check for reasonable decimal places (max 2)
        if amount.as_tuple().exponent < -2:
            return False, "Payment amount cannot have more than 2 decimal places"
        
        return True, None
    
    @staticmethod
    def validate_payment_method(method: str) -> Tuple[bool, Optional[str]]:
        """
        Validate payment method.
        
        Args:
            method: Payment method (e.g., 'mpesa', 'cash', 'bank_transfer')
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        valid_methods = ['mpesa', 'cash', 'bank_transfer', 'card']
        
        if not method:
            return False, "Payment method is required"
        
        if method.lower() not in valid_methods:
            return False, f"Invalid payment method. Must be one of: {', '.join(valid_methods)}"
        
        return True, None
    
    @staticmethod
    def validate_mpesa_phone(phone: str) -> Tuple[bool, Optional[str]]:
        """
        Validate M-Pesa phone number (Kenyan format).
        
        Args:
            phone: Phone number to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        import re
        
        if not phone:
            return False, "Phone number is required for M-Pesa payments"
        
        # Remove spaces and common separators
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Kenyan phone number patterns
        # 254XXXXXXXXX (12 digits) or 07XXXXXXXX/01XXXXXXXX (10 digits)
        patterns = [
            r'^254[17]\d{8}$',  # 254 format
            r'^0[17]\d{8}$',    # 0 format
        ]
        
        if not any(re.match(pattern, cleaned) for pattern in patterns):
            return False, "Invalid Kenyan phone number format. Use 254XXXXXXXXX or 07XXXXXXXX"
        
        return True, None
    
    @staticmethod
    def validate_reference_number(reference: str, method: str) -> Tuple[bool, Optional[str]]:
        """
        Validate payment reference number.
        
        Args:
            reference: Reference number
            method: Payment method
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not reference:
            return False, "Payment reference number is required"
        
        # M-Pesa transaction IDs are typically 10 characters (e.g., QGK7XZYR4M)
        if method.lower() == 'mpesa':
            if len(reference) < 8 or len(reference) > 15:
                return False, "M-Pesa transaction ID should be 8-15 characters"
            
            if not reference.isalnum():
                return False, "M-Pesa transaction ID should contain only letters and numbers"
        
        # General reference validation
        if len(reference) > 100:
            return False, "Reference number is too long (max 100 characters)"
        
        return True, None
    
    @staticmethod
    async def validate_daily_limit(
        user_id: str,
        amount: Decimal,
        db_session,
        payment_date: Optional[datetime] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate daily payment limit for a user.
        
        Args:
            user_id: User ID
            amount: Payment amount
            db_session: Database session
            payment_date: Date to check (defaults to today)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        from sqlmodel import select, func
        from app.models.payment import Payment
        
        if payment_date is None:
            payment_date = datetime.utcnow()
        
        # Get start and end of day
        start_of_day = payment_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = payment_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Sum payments for the day
        statement = select(func.sum(Payment.amount)).where(
            Payment.user_id == user_id,
            Payment.created_at >= start_of_day,
            Payment.created_at <= end_of_day,
            Payment.status == 'completed'
        )
        
        result = await db_session.execute(statement)
        daily_total = result.scalar() or Decimal("0.00")
        
        # Check if adding this payment would exceed limit
        if daily_total + amount > PaymentValidator.MAX_DAILY_PAYMENT_LIMIT:
            return False, f"Daily payment limit of KES {PaymentValidator.MAX_DAILY_PAYMENT_LIMIT} would be exceeded"
        
        return True, None
    
    @staticmethod
    def validate_payment_data(
        amount: Decimal,
        method: str,
        reference: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Comprehensive payment data validation.
        
        Args:
            amount: Payment amount
            method: Payment method
            reference: Payment reference (optional)
            phone: Phone number for M-Pesa (optional)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Validate amount
        is_valid, error = PaymentValidator.validate_amount(amount)
        if not is_valid:
            return False, error
        
        # Validate method
        is_valid, error = PaymentValidator.validate_payment_method(method)
        if not is_valid:
            return False, error
        
        # M-Pesa specific validation
        if method.lower() == 'mpesa':
            if phone:
                is_valid, error = PaymentValidator.validate_mpesa_phone(phone)
                if not is_valid:
                    return False, error
            else:
                return False, "Phone number is required for M-Pesa payments"
        
        # Validate reference if provided
        if reference:
            is_valid, error = PaymentValidator.validate_reference_number(reference, method)
            if not is_valid:
                return False, error
        
        return True, None
