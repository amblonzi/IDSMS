"""
Dependencies for API endpoints.

Includes:
- Authentication dependencies
- Role-based access control (RBAC)
- Audit logging
- Request context extraction
"""
from typing import Annotated, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core import security
from app.core.config import settings
from app.core.db import get_session
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from datetime import datetime, timezone

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
        # Check if token is blacklisted
        if security.is_token_blacklisted(token):
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    result = await session.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked until {user.locked_until.isoformat()}"
        )
    
    return user


async def get_current_active_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Verify that the current user is an admin.
    
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


def require_role(required_role: UserRole):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(UserRole.ADMIN))])
    
    Args:
        required_role: The role required to access the endpoint
        
    Returns:
        Dependency function
    """
    async def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. {required_role.value} access required."
            )
        return current_user
    
    return role_checker


def require_any_role(required_roles: list[UserRole]):
    """
    Dependency factory for role-based access control (any of multiple roles).
    
    Usage:
        @router.get("/staff-only", dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.MANAGER]))])
    
    Args:
        required_roles: List of roles, user must have at least one
        
    Returns:
        Dependency function
    """
    async def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in required_roles:
            roles_str = ", ".join([r.value for r in required_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. One of these roles required: {roles_str}"
            )
        return current_user
    
    return role_checker


def get_request_context(request: Request) -> dict:
    """
    Extract context information from the request.
    
    Used for audit logging.
    
    Args:
        request: FastAPI request object
        
    Returns:
        dict: Context information (IP, user agent, etc.)
    """
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "path": str(request.url.path),
        "method": request.method
    }


async def log_audit(
    session: AsyncSession,
    user_id: Optional[UUID],
    action: str,
    resource_type: str,
    resource_id: Optional[UUID] = None,
    request: Optional[Request] = None,
    details: Optional[dict] = None,
    success: bool = True
) -> None:
    """
    Log an audit event.
    
    Args:
        session: Database session
        user_id: ID of user performing the action
        action: Action being performed
        resource_type: Type of resource being acted upon
        resource_id: ID of the resource (if applicable)
        request: FastAPI request object (for context)
        details: Additional details as dict
        success: Whether the action succeeded
    """
    context = get_request_context(request) if request else {}
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=context.get("ip_address"),
        user_agent=context.get("user_agent"),
        details=details,
        success=success
    )
    
    session.add(audit_log)
    await session.commit()
