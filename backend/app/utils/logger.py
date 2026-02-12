"""
Structured logging configuration.

Provides JSON-formatted logs for production with correlation IDs.
"""
import logging
import sys
from typing import Any
import json
from datetime import datetime
from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "correlation_id"):
            log_data["correlation_id"] = record.correlation_id
        
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        
        return json.dumps(log_data)


def setup_logging() -> logging.Logger:
    """
    Configure application logging.
    
    Returns:
        logging.Logger: Configured logger instance
    """
    logger = logging.getLogger("idsms")
    
    # Set log level based on environment
    if settings.ENVIRONMENT == "production":
        logger.setLevel(logging.INFO)
    elif settings.ENVIRONMENT == "staging":
        logger.setLevel(logging.DEBUG)
    else:  # development
        logger.setLevel(logging.DEBUG)
    
    # Remove existing handlers
    logger.handlers = []
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Use JSON formatter for production, simple formatter for development
    if settings.ENVIRONMENT == "production":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Don't propagate to root logger
    logger.propagate = False
    
    return logger


# Global logger instance
logger = setup_logging()


def get_logger() -> logging.Logger:
    """Get the application logger"""
    return logger
