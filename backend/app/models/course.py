from typing import Optional, List
from uuid import UUID, uuid4
from datetime import date
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship

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

class Course(CourseBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    
class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: UUID

# Enrollment
class EnrollmentBase(SQLModel):
    start_date: date = Field(default_factory=date.today)
    status: EnrollmentStatus = Field(default=EnrollmentStatus.PENDING)
    student_id: UUID = Field(foreign_key="user.id")
    course_id: UUID = Field(foreign_key="course.id")
    total_paid: float = Field(default=0.0)

class Enrollment(EnrollmentBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    
class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentRead(EnrollmentBase):
    id: UUID
