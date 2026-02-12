from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship

from app.models.base import BaseModel

class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DROPPED = "dropped"
    PENDING = "pending"

class CourseBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    price: float = Field(default=0.0)
    duration_weeks: int = Field(default=4)

class Course(CourseBase, BaseModel, table=True):
    pass
    
class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

# Enrollment
class EnrollmentBase(SQLModel):
    start_date: date = Field(default_factory=date.today)
    status: EnrollmentStatus = Field(default=EnrollmentStatus.PENDING)
    student_id: UUID = Field(foreign_key="user.id")
    course_id: UUID = Field(foreign_key="course.id")
    total_paid: float = Field(default=0.0)

class Enrollment(EnrollmentBase, BaseModel, table=True):
    pass
    
class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentRead(EnrollmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
