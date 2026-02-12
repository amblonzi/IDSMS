from typing import Optional
from enum import Enum
from datetime import datetime
from sqlmodel import Field, SQLModel
from uuid import UUID

from app.models.base import BaseModel

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    INSTRUCTOR = "instructor"
    STUDENT = "student"

class UserBase(SQLModel):
    email: Optional[str] = Field(default=None, unique=True, index=True)
    is_active: bool = True
    role: UserRole = Field(default=UserRole.STUDENT)
    full_name: Optional[str] = None

class User(UserBase, BaseModel, table=True):
    hashed_password: Optional[str] = None
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(default=None)

class UserCreate(UserBase):
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class UserRead(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
