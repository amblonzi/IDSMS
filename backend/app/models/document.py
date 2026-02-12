from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel

from app.models.base import BaseModel


class DocumentType(str, Enum):
    """Types of documents that can be uploaded."""
    NATIONAL_ID = "national_id"
    PASSPORT = "passport"
    PASSPORT_PHOTO = "passport_photo"
    DRIVING_PERMIT = "driving_permit"
    MEDICAL_CERTIFICATE = "medical_certificate"
    PROOF_OF_ADDRESS = "proof_of_address"
    OTHER = "other"


class DocumentStatus(str, Enum):
    """Status of document verification."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DocumentBase(SQLModel):
    """Base document model with common fields."""
    user_id: UUID = Field(foreign_key="user.id")
    document_type: DocumentType
    file_path: str
    file_name: str
    file_size: int  # in bytes
    mime_type: str
    status: DocumentStatus = DocumentStatus.PENDING
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    verified_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None


class Document(DocumentBase, BaseModel, table=True):
    """Document database model."""
    pass


class DocumentCreate(SQLModel):
    """Schema for creating a document (used internally)."""
    user_id: UUID
    document_type: DocumentType
    file_path: str
    file_name: str
    file_size: int
    mime_type: str


class DocumentUpdate(SQLModel):
    """Schema for updating a document."""
    status: Optional[DocumentStatus] = None
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None


class DocumentRead(DocumentBase):
    """Schema for reading a document."""
    id: UUID
    created_at: datetime
    updated_at: datetime


class DocumentVerify(SQLModel):
    """Schema for verifying/rejecting a document."""
    status: DocumentStatus
    rejection_reason: Optional[str] = None
