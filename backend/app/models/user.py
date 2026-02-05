from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel
from uuid import UUID, uuid4

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    INSTRUCTOR = "instructor"
    STUDENT = "student"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = True
    role: UserRole = Field(default=UserRole.STUDENT)
    full_name: Optional[str] = None

class User(UserBase, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: UUID
