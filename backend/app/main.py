"""
Main FastAPI application.

Includes:
- CORS middleware
- Rate limiting
- Error handling
- Structured logging
- Health check endpoints
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.core.config import settings
from app.utils.logger import get_logger
from app.middleware.error_handler import (
    global_exception_handler,
    validation_exception_handler,
    database_exception_handler
)
from app.middleware.rate_limit import limiter, _rate_limit_exceeded_handler

logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Validate settings in non-development environments
    if settings.ENVIRONMENT != "development":
        try:
            settings.validate_required_settings()
            logger.info("Configuration validated successfully")
        except ValueError as e:
            logger.error(f"Configuration validation failed: {e}")
            raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add error handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)

# CORS - Load origins from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None
        }
    )
    response = await call_next(request)
    return response


# Health check endpoints
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """
    Basic health check endpoint.
    
    Returns 200 if the application is running.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/ready", tags=["Health"])
async def readiness_check() -> dict:
    """
    Readiness check endpoint.
    
    Checks if the application is ready to serve requests (DB connection, etc.)
    """
    from app.core.db import engine
    
    try:
        # Test database connection
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        
        return {
            "status": "ready",
            "database": "connected",
            "service": settings.PROJECT_NAME
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(e) if settings.ENVIRONMENT != "production" else "Database unavailable"
            }
        )


# Include API routes
from app.api.api import api_router
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/api/docs" if settings.ENVIRONMENT != "production" else "Documentation disabled in production",
        "health": "/health"
    }
