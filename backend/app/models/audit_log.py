"""
Audit Log Model for tracking sensitive operations.

Provides compliance and security monitoring capabilities.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON

from app.models.base import BaseModel


class AuditLog(BaseModel, table=True):
    """
    Tracks sensitive operations for compliance and security.
    
    Examples of logged actions:
    - User login/logout
    - Password changes
    - Payment processing
    - User creation/deletion
    - Role changes
    """
    user_id: Optional[UUID] = Field(
        foreign_key="user.id",
        description="User who performed the action"
    )
    action: str = Field(
        index=True,
        description="Action performed (e.g., 'login', 'create_user', 'delete_payment')"
    )
    resource_type: str = Field(
        index=True,
        description="Type of resource affected (e.g., 'user', 'payment', 'enrollment')"
    )
    resource_id: Optional[UUID] = Field(
        description="ID of the affected resource"
    )
    ip_address: Optional[str] = Field(
        description="IP address of the request"
    )
    user_agent: Optional[str] = Field(
        description="User agent string from the request"
    )
    details: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Additional context as JSON"
    )
    success: bool = Field(
        default=True,
        description="Whether the action succeeded"
    )
