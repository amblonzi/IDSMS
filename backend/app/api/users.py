from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.core import security
from app.core.db import get_session
from app.models.user import User, UserCreate, UserRead, UserRole
from app.models.profile import Profile, ProfileRead
from app.models.course import Enrollment, Course, EnrollmentRead

router = APIRouter()

class UserDetailRead(UserRead):
    profile: Optional[ProfileRead] = None

class EnrollmentWithCourse(EnrollmentRead):
    course: Optional[dict] = None

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get current user.
    """
    return current_user

@router.get("/{user_id}", response_model=UserDetailRead)
async def read_user_by_id(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    """
    Get a specific user by ID.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions (Admin/Manager or self)
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")
        
    # Fetch profile
    result = await session.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalars().first()
    
    # Construct response manually or let Pydantic handle it if structure matches
    # Since UserDetailRead inherits UserRead, we can return user and attach profile
    user_dict = user.model_dump()
    user_dict["profile"] = profile
    return user_dict

@router.get("/{user_id}/enrollments", response_model=List[EnrollmentWithCourse])
async def read_user_enrollments(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
):
    """
    Get enrollments for a specific user.
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these enrollments")

    query = select(Enrollment).where(Enrollment.user_id == user_id)
    result = await session.execute(query)
    enrollments = result.scalars().all()
    
    # Enrich with course data
    response_data = []
    for enrollment in enrollments:
        course = await session.get(Course, enrollment.course_id)
        enrollment_dict = enrollment.model_dump()
        if course:
            enrollment_dict["course"] = {
                "name": course.name,
                "price": course.price,
                "duration_weeks": course.duration_weeks
            }
        response_data.append(enrollment_dict)
        
    return response_data

@router.post("/", response_model=UserRead)
async def create_user(
    user_in: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    # current_user: Annotated[User, Depends(deps.get_current_active_superuser)] # Uncomment to restrict to admin
):
    """
    Create new user with comprehensive validation.
    """
    from app.validators import UserValidator
    from app.api.deps import log_audit
    
    # Validate user data
    is_valid, error = UserValidator.validate_user_data(
        email=user_in.email,
        phone=user_in.phone if user_in.phone else "0700000000", # Default for legacy/system users if missing
        first_name=user_in.first_name if user_in.first_name else (user_in.email.split('@')[0] if user_in.email else "User"),
        last_name=user_in.last_name if user_in.last_name else "Staff",
        national_id=None, # Not required for basic staff creation
        date_of_birth=None
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Validate password strength
    is_valid, error = security.validate_password(user_in.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Check if user exists
    result = await session.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Create user
    user = User.model_validate(user_in, update={"hashed_password": security.get_password_hash(user_in.password)})
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    # Log user creation
    await log_audit(
        session=session,
        user_id=None,
        action="user_created",
        resource_type="user",
        resource_id=user.id,
        success=True,
        details={"email": user.email, "role": user.role}
    )
    
    return user

@router.get("/", response_model=List[UserRead])
async def read_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)],
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve users.
    """
    result = await session.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users
