"""
Authentication endpoints.

Provides:
- Login (with access and refresh tokens)
- Logout (token blacklisting)
- Token refresh
- Password change
- Password reset flow
"""
from datetime import timedelta, datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core import security
from app.core.config import settings
from app.core.db import get_session
from app.models.user import User
from app.schemas.token import Token
from app.api import deps
from pydantic import BaseModel, EmailStr

from app.utils.logger import get_logger

logger = get_logger()
router = APIRouter()


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request
) -> Token:
    """
    OAuth2 compatible token login.
    
    Returns both access and refresh tokens.
    Implements account lockout after failed attempts.
    """
    # 1. Fetch user by email (case-insensitive)
    username = form_data.username.lower().strip()
    logger.info(f"Login attempt for user: {username}")
    result = await session.execute(select(User).where(User.email == username))
    user = result.scalars().first()
    
    # 2. Check if user exists
    if not user:
        # Log failed attempt
        await deps.log_audit(
            session=session,
            user_id=None,
            action="login_failed",
            resource_type="user",
            request=request,
            details={"email": form_data.username, "reason": "user_not_found"},
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # 3. Check if account is locked
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        await deps.log_audit(
            session=session,
            user_id=user.id,
            action="login_failed",
            resource_type="user",
            request=request,
            details={"reason": "account_locked", "locked_until": user.locked_until.isoformat()},
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked until {user.locked_until.isoformat()}"
        )
    
    # 4. Verify password
    if not security.verify_password(form_data.password, user.hashed_password):
        # Increment failed login attempts
        user.failed_login_attempts += 1
        
        # Lock account if too many failed attempts
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            await session.commit()
            
            await deps.log_audit(
                session=session,
                user_id=user.id,
                action="account_locked",
                resource_type="user",
                request=request,
                details={"reason": "too_many_failed_attempts", "attempts": user.failed_login_attempts},
                success=True
            )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to too many failed login attempts. Try again after {settings.LOCKOUT_DURATION_MINUTES} minutes."
            )
        
        await session.commit()
        
        await deps.log_audit(
            session=session,
            user_id=user.id,
            action="login_failed",
            resource_type="user",
            request=request,
            details={"reason": "invalid_password", "failed_attempts": user.failed_login_attempts},
            success=False
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # 5. Check if user is active
    if not user.is_active:
        await deps.log_audit(
            session=session,
            user_id=user.id,
            action="login_failed",
            resource_type="user",
            request=request,
            details={"reason": "inactive_user"},
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # 6. Reset failed login attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    await session.commit()
    
    # 7. Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(subject=user.id)
    
    # 8. Log successful login
    await deps.log_audit(
        session=session,
        user_id=user.id,
        action="login_success",
        resource_type="user",
        request=request,
        details={"role": user.role.value},
        success=True
    )
    
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request
) -> Token:
    """
    Get a new access token using a refresh token.
    """
    # Verify refresh token
    user_id = security.verify_token(refresh_request.refresh_token, token_type="refresh")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Get user
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # Log token refresh
    await deps.log_audit(
        session=session,
        user_id=user.id,
        action="token_refresh",
        resource_type="user",
        request=request,
        success=True
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(deps.get_current_user)],
    token: Annotated[str, Depends(deps.oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request
) -> dict:
    """
    Logout by blacklisting the current token.
    """
    # Blacklist the token
    security.blacklist_token(token)
    
    # Log logout
    await deps.log_audit(
        session=session,
        user_id=current_user.id,
        action="logout",
        resource_type="user",
        request=request,
        success=True
    )
    
    return {"message": "Successfully logged out"}


@router.post("/change-password")
async def change_password(
    password_change: PasswordChangeRequest,
    current_user: Annotated[User, Depends(deps.get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request
) -> dict:
    """
    Change the current user's password.
    """
    # Verify current password
    if not security.verify_password(password_change.current_password, current_user.hashed_password):
        await deps.log_audit(
            session=session,
            user_id=current_user.id,
            action="password_change_failed",
            resource_type="user",
            request=request,
            details={"reason": "invalid_current_password"},
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Validate new password
    is_valid, error_message = security.validate_password(password_change.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Update password
    current_user.hashed_password = security.get_password_hash(password_change.new_password)
    await session.commit()
    
    # Log password change
    await deps.log_audit(
        session=session,
        user_id=current_user.id,
        action="password_changed",
        resource_type="user",
        request=request,
        success=True
    )
    
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    reset_request: PasswordResetRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request
) -> dict:
    """
    Request a password reset.
    
    Sends an email with a password reset link if the email exists.
    Always returns success to prevent email enumeration.
    """
    from app.utils.email import send_password_reset_email
    
    # Find user
    result = await session.execute(select(User).where(User.email == reset_request.email))
    user = result.scalars().first()
    
    # Always return success to prevent email enumeration
    if user:
        # Generate reset token
        reset_token = security.create_password_reset_token(user.id)
        
        # Send email (async, don't wait for result to prevent timing attacks)
        try:
            await send_password_reset_email(
                email_to=user.email,
                reset_token=reset_token,
                full_name=user.full_name or ""
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
        
        # Log audit
        await deps.log_audit(
            session=session,
            user_id=user.id,
            action="password_reset_requested",
            resource_type="user",
            request=request,
            success=True
        )
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_confirm: PasswordResetConfirm,
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request
) -> dict:
    """
    Reset password using a reset token.
    
    Verifies the token and updates the user's password.
    """
    # Verify token
    user_id = security.verify_password_reset_token(reset_confirm.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Get user
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate new password
    is_valid, error_message = security.validate_password(reset_confirm.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Update password
    user.hashed_password = security.get_password_hash(reset_confirm.new_password)
    
    # Reset failed login attempts and unlock account
    user.failed_login_attempts = 0
    user.locked_until = None
    
    await session.commit()
    
    # Log audit
    await deps.log_audit(
        session=session,
        user_id=user.id,
        action="password_reset_completed",
        resource_type="user",
        request=request,
        success=True
    )
    
    return {"message": "Password reset successfully"}
