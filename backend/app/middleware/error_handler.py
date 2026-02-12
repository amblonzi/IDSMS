"""
Global error handler middleware.

Catches all unhandled exceptions and returns user-friendly error messages.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.utils.logger import get_logger

logger = get_logger()


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all unhandled exceptions.
    
    Args:
        request: The FastAPI request
        exc: The exception that was raised
        
    Returns:
        JSONResponse: Error response
    """
    # Log the error
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "client": request.client.host if request.client else None
        }
    )
    
    # Return generic error in production, detailed in development
    from app.core.config import settings
    
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please try again later.",
                "error_id": "Please contact support with this timestamp: " + str(exc)[:50]
            }
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
                "path": request.url.path
            }
        )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle validation errors with clear messages.
    
    Args:
        request: The FastAPI request
        exc: The validation error
        
    Returns:
        JSONResponse: Validation error response
    """
    logger.warning(
        f"Validation error: {exc}",
        extra={
            "path": request.url.path,
            "errors": exc.errors()
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle database errors.
    
    Args:
        request: The FastAPI request
        exc: The database error
        
    Returns:
        JSONResponse: Database error response
    """
    logger.error(
        f"Database error: {exc}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )
    
    from app.core.config import settings
    
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Database service temporarily unavailable. Please try again later."
            }
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Database error",
                "error": str(exc)
            }
        )
