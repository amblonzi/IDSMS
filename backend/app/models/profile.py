from typing import Optional
from uuid import UUID
from sqlmodel import Field, SQLModel, Relationship
from app.models.user import User

class ProfileBase(SQLModel):
    phone_number: str = Field(index=True, description="Kenyan Phone format +254...")
    national_id: str = Field(unique=True, index=True, description="NTSA requirement")
    license_number: Optional[str] = Field(default=None, description="Driving License for Instructors")
    address: Optional[str] = None
    city: Optional[str] = "Nairobi"
    
class Profile(ProfileBase, table=True):
    id: Optional[UUID] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    
    # Check circular import if defining relationship back to User
    # user: User = Relationship(back_populates="profile")

class ProfileCreate(ProfileBase):
    pass

class ProfileRead(ProfileBase):
    id: UUID
    user_id: UUID
