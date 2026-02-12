"""
Rate limiting middleware using SlowAPI.

Protects against brute force attacks and API abuse.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings


def get_limiter() -> Limiter:
    """
    Create and configure rate limiter.
    
    Returns:
        Limiter: Configured rate limiter instance
    """
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
        storage_uri="memory://",  # In production, use Redis
        strategy="fixed-window"
    )
    
    return limiter


# Global limiter instance
limiter = get_limiter()
