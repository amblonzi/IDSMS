"""
Token Blacklist Model for JWT token invalidation.

Used to track invalidated tokens (logout functionality).
"""
from datetime import datetime
from sqlmodel import Field, SQLModel

from app.models.base import BaseModel


class TokenBlacklist(BaseModel, table=True):
    """
    Stores invalidated JWT tokens.
    
    Tokens are added here when users logout or when tokens
    need to be forcibly invalidated.
    """
    token: str = Field(index=True, unique=True, description="JWT token string")
    expires_at: datetime = Field(description="When the token expires naturally")
    reason: str = Field(default="logout", description="Reason for blacklisting")
