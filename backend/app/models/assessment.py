from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel

from app.models.base import BaseModel


class AssessmentType(str, Enum):
    """Types of assessments in the driving school."""
    THEORY_TEST = "theory_test"
    PRACTICAL_EVAL = "practical_eval"
    FINAL_EXAM = "final_exam"
    PROGRESS_CHECK = "progress_check"
    # NTSA Specific
    NTSA_THEORY = "ntsa_theory"
    NTSA_PRACTICAL = "ntsa_practical"


class AssessmentBase(SQLModel):
    """Base assessment model with common fields."""
    enrollment_id: UUID = Field(foreign_key="enrollment.id")
    instructor_id: UUID = Field(foreign_key="user.id")
    assessment_type: AssessmentType
    score: float = Field(ge=0)
    max_score: float = Field(gt=0)
    passed: bool
    notes: Optional[str] = None
    assessment_date: datetime = Field(default_factory=datetime.utcnow)
    lesson_id: Optional[UUID] = Field(default=None, foreign_key="lesson.id")
    
    # NTSA Test Booking Details
    booking_reference: Optional[str] = Field(default=None, description="NTSA Booking Reference Number")
    test_center: Optional[str] = Field(default=None, description="NTSA Test Center Location")


class Assessment(AssessmentBase, BaseModel, table=True):
    """Assessment database model."""
    pass


class AssessmentCreate(SQLModel):
    """Schema for creating an assessment."""
    enrollment_id: UUID
    instructor_id: UUID
    assessment_type: AssessmentType
    score: float
    max_score: float
    notes: Optional[str] = None
    lesson_id: Optional[UUID] = None
    booking_reference: Optional[str] = None
    test_center: Optional[str] = None


class AssessmentUpdate(SQLModel):
    """Schema for updating an assessment."""
    score: Optional[float] = None
    max_score: Optional[float] = None
    notes: Optional[str] = None
    passed: Optional[bool] = None


class AssessmentRead(AssessmentBase):
    """Schema for reading an assessment."""
    id: UUID
    created_at: datetime
    updated_at: datetime
