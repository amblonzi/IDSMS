from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel

class LessonStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class LessonType(str, Enum):
    THEORY = "theory"
    PRACTICAL = "practical"
    EXAM = "exam"

class LessonBase(SQLModel):
    scheduled_at: datetime
    status: LessonStatus = Field(default=LessonStatus.SCHEDULED)
    type: LessonType = Field(default=LessonType.PRACTICAL)
    notes: Optional[str] = None
    duration_minutes: int = Field(default=60)
    
    enrollment_id: UUID = Field(foreign_key="enrollment.id")
    instructor_id: UUID = Field(foreign_key="user.id")
    vehicle_id: Optional[UUID] = Field(default=None, foreign_key="vehicle.id")

class Lesson(LessonBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)

class LessonCreate(LessonBase):
    pass

class LessonRead(LessonBase):
    id: UUID
