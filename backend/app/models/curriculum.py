from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship

from app.models.base import BaseModel

# --- Enums ---
class ModuleType(str, Enum):
    THEORY = "theory"
    PRACTICAL = "practical"
    TEST_PREP = "test_prep"

# --- Models ---

class CurriculumBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    course_id: UUID = Field(foreign_key="course.id")
    version: str = Field(default="1.0")

class Curriculum(CurriculumBase, BaseModel, table=True):
    modules: List["Module"] = Relationship(back_populates="curriculum")

class CurriculumCreate(CurriculumBase):
    pass

class CurriculumRead(CurriculumBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

# --- Module Model ---

class ModuleBase(SQLModel):
    name: str  # e.g., "Model Town Board", "Basic Mechanics"
    description: Optional[str] = None
    curriculum_id: UUID = Field(foreign_key="curriculum.id")
    order_index: int = Field(default=0)
    module_type: ModuleType = Field(default=ModuleType.THEORY)

class Module(ModuleBase, BaseModel, table=True):
    curriculum: Curriculum = Relationship(back_populates="modules")
    topics: List["LessonTopic"] = Relationship(back_populates="module")

class ModuleCreate(ModuleBase):
    pass

class ModuleRead(ModuleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

# --- Lesson Topic Model ---

class LessonTopicBase(SQLModel):
    title: str
    description: Optional[str] = None
    module_id: UUID = Field(foreign_key="module.id")
    order_index: int = Field(default=0)
    is_mandatory: bool = Field(default=True)
    estimated_minutes: int = Field(default=60)

class LessonTopic(LessonTopicBase, BaseModel, table=True):
    module: Module = Relationship(back_populates="topics")

class LessonTopicCreate(LessonTopicBase):
    pass

class LessonTopicRead(LessonTopicBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

# --- Student Progress Model ---

class StudentProgressBase(SQLModel):
    enrollment_id: UUID = Field(foreign_key="enrollment.id")
    topic_id: UUID = Field(foreign_key="lessontopic.id")
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None
    instructor_verified: bool = Field(default=False)
    verified_by: Optional[UUID] = Field(default=None, foreign_key="user.id")

class StudentProgress(StudentProgressBase, BaseModel, table=True):
    pass

class StudentProgressCreate(StudentProgressBase):
    pass

class StudentProgressRead(StudentProgressBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
