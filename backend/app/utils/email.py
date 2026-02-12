"""
Email utility functions for sending notifications.

Supports password reset, welcome emails, lesson reminders, and payment receipts.
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from typing import Optional

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger()

# Set up Jinja2 environment for email templates
template_dir = Path(__file__).parent.parent / "email_templates"
jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))


async def send_email(
    email_to: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send an email using configured SMTP server.
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        html_content: HTML email body
        text_content: Plain text email body (optional)
        
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = email_to
        message["Subject"] = subject
        
        # Add plain text version if provided
        if text_content:
            part1 = MIMEText(text_content, "plain")
            message.attach(part1)
        
        # Add HTML version
        part2 = MIMEText(html_content, "html")
        message.attach(part2)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True
        )
        
        logger.info(f"Email sent successfully to {email_to}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {str(e)}")
        return False


async def send_password_reset_email(
    email_to: str,
    reset_token: str,
    full_name: str = ""
) -> bool:
    """
    Send password reset email with token link.
    
    Args:
        email_to: Recipient email address
        reset_token: Password reset token
        full_name: User's full name (optional)
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # Generate reset link
    # In production, use actual frontend URL from settings
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    # Render template
    template = jinja_env.get_template("password_reset.html")
    html_content = template.render(
        full_name=full_name or "User",
        reset_link=reset_link,
        expiry_hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS
    )
    
    # Plain text version
    text_content = f"""
Hello {full_name or 'User'},

You requested a password reset for your IDSMS account.

Click the link below to reset your password:
{reset_link}

This link will expire in {settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS} hour(s).

If you didn't request this, please ignore this email.

Best regards,
IDSMS Team
    """.strip()
    
    return await send_email(
        email_to=email_to,
        subject="Reset Your IDSMS Password",
        html_content=html_content,
        text_content=text_content
    )


async def send_welcome_email(
    email_to: str,
    full_name: str
) -> bool:
    """
    Send welcome email to new users.
    
    Args:
        email_to: Recipient email address
        full_name: User's full name
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # Render template
    template = jinja_env.get_template("welcome.html")
    html_content = template.render(
        full_name=full_name,
        login_url=f"{settings.FRONTEND_URL}/login"
    )
    
    # Plain text version
    text_content = f"""
Welcome to IDSMS, {full_name}!

Thank you for registering with Inphora Driving School Management System.

You can now log in to your account at:
{settings.FRONTEND_URL}/login

If you have any questions, please don't hesitate to contact us.

Best regards,
IDSMS Team
    """.strip()
    
    return await send_email(
        email_to=email_to,
        subject="Welcome to IDSMS!",
        html_content=html_content,
        text_content=text_content
    )


async def send_lesson_reminder_email(
    email_to: str,
    full_name: str,
    lesson_date: str,
    lesson_time: str,
    instructor_name: str,
    vehicle_info: Optional[str] = None
) -> bool:
    """
    Send lesson reminder email (24 hours before lesson).
    
    Args:
        email_to: Recipient email address
        full_name: Student's full name
        lesson_date: Lesson date
        lesson_time: Lesson time
        instructor_name: Instructor's name
        vehicle_info: Vehicle information (optional)
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # Render template
    template = jinja_env.get_template("lesson_reminder.html")
    html_content = template.render(
        full_name=full_name,
        lesson_date=lesson_date,
        lesson_time=lesson_time,
        instructor_name=instructor_name,
        vehicle_info=vehicle_info
    )
    
    # Plain text version
    text_content = f"""
Hello {full_name},

This is a reminder about your upcoming driving lesson:

Date: {lesson_date}
Time: {lesson_time}
Instructor: {instructor_name}
{f'Vehicle: {vehicle_info}' if vehicle_info else ''}

Please arrive 10 minutes early and bring your learner's permit.

If you need to reschedule, please contact us as soon as possible.

Best regards,
IDSMS Team
    """.strip()
    
    return await send_email(
        email_to=email_to,
        subject="Reminder: Upcoming Driving Lesson",
        html_content=html_content,
        text_content=text_content
    )


async def send_payment_receipt_email(
    email_to: str,
    full_name: str,
    amount: float,
    payment_method: str,
    transaction_id: str,
    payment_date: str
) -> bool:
    """
    Send payment receipt email.
    
    Args:
        email_to: Recipient email address
        full_name: Student's full name
        amount: Payment amount
        payment_method: Payment method used
        transaction_id: Transaction ID
        payment_date: Payment date
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # Render template
    template = jinja_env.get_template("payment_receipt.html")
    html_content = template.render(
        full_name=full_name,
        amount=amount,
        payment_method=payment_method,
        transaction_id=transaction_id,
        payment_date=payment_date
    )
    
    # Plain text version
    text_content = f"""
Hello {full_name},

Thank you for your payment!

Payment Details:
Amount: KES {amount:,.2f}
Method: {payment_method}
Transaction ID: {transaction_id}
Date: {payment_date}

This is your official receipt. Please keep it for your records.

Best regards,
IDSMS Team
    """.strip()
    
    return await send_email(
        email_to=email_to,
        subject="Payment Receipt - IDSMS",
        html_content=html_content,
        text_content=text_content
    )
