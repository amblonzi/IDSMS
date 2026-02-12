"""
Security utilities for authentication and authorization.

Includes:
- Password hashing and verification
- JWT token creation and verification
- Password strength validation
- Token blacklist management
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
import re
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

# In-memory token blacklist (in production, use Redis or database)
_token_blacklist: set[str] = set()


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password against security policy.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
    
    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if settings.PASSWORD_REQUIRE_DIGIT and not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        str: Encoded JWT token
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        
    Returns:
        str: Encoded JWT refresh token
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token to verify
        token_type: Type of token ("access" or "refresh")
        
    Returns:
        Optional[str]: The subject (user ID) if valid, None otherwise
    """
    try:
        # Check if token is blacklisted
        if is_token_blacklisted(token):
            return None
        
        # Select appropriate secret key
        secret_key = settings.REFRESH_SECRET_KEY if token_type == "refresh" else settings.SECRET_KEY
        
        # Decode token
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        # Get subject
        subject: str = payload.get("sub")
        if subject is None:
            return None
            
        return subject
        
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Uses constant-time comparison to prevent timing attacks.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)


def blacklist_token(token: str, expires_at: Optional[datetime] = None) -> None:
    """
    Add a token to the blacklist.
    
    In production, this should store in Redis or database.
    
    Args:
        token: The token to blacklist
        expires_at: When the token expires (for cleanup)
    """
    _token_blacklist.add(token)
    # TODO: In production, store in database or Redis with expiration


def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted.
    
    Args:
        token: The token to check
        
    Returns:
        bool: True if blacklisted, False otherwise
    """
    return token in _token_blacklist
    # TODO: In production, check database or Redis


def cleanup_expired_blacklist() -> None:
    """
    Remove expired tokens from blacklist.
    
    This should be run periodically (e.g., daily cron job).
    In production with Redis, use TTL instead.
    """
    # TODO: Implement cleanup logic for database-backed blacklist
    pass


def create_password_reset_token(user_id: Union[str, Any]) -> str:
    """
    Create a password reset token (expires in 1 hour by default).
    
    Args:
        user_id: The user ID to encode in the token
        
    Returns:
        str: Encoded JWT token for password reset
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "type": "password_reset"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify password reset token and return user_id.
    
    Args:
        token: The password reset token to verify
        
    Returns:
        Optional[str]: The user ID if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "password_reset":
            return None
        
        # Get subject (user ID)
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
            
        return user_id
        
    except JWTError:
        return None
