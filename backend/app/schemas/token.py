"""
Token schema for authentication responses.
"""
from pydantic import BaseModel


class Token(BaseModel):
    """OAuth2 token response"""
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str | None = None
    exp: int | None = None
    type: str | None = None
