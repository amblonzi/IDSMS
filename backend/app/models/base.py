"""
Base model with common fields for all database tables.

Provides:
- UUID primary key
- Timestamps (created_at, updated_at)
- Soft delete support (deleted_at)
"""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel


class TimestampMixin(SQLModel):
    """Mixin for timestamp fields"""
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when record was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when record was last updated"
    )


class SoftDeleteMixin(SQLModel):
    """Mixin for soft delete functionality"""
    deleted_at: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="Timestamp when record was soft deleted"
    )
    
    @property
    def is_deleted(self) -> bool:
        """Check if record is soft deleted"""
        return self.deleted_at is not None
    
    def soft_delete(self) -> None:
        """Mark record as deleted"""
        self.deleted_at = datetime.utcnow()
    
    def restore(self) -> None:
        """Restore soft deleted record"""
        self.deleted_at = None


class BaseModel(TimestampMixin, SoftDeleteMixin):
    """
    Base model for all database tables.
    
    Includes:
    - UUID primary key
    - created_at timestamp
    - updated_at timestamp
    - deleted_at timestamp (for soft delete)
    """
    id: Optional[UUID] = Field(
        default_factory=uuid4,
        primary_key=True,
        nullable=False
    )
