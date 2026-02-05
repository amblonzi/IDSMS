from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import security
from app.core.db import get_session
from app.models.user import User, UserCreate, UserRead, UserRole

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get current user.
    """
    return current_user

@router.post("/", response_model=UserRead)
async def create_user(
    user_in: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    # current_user: Annotated[User, Depends(deps.get_current_active_superuser)] # Uncomment to restrict to admin
):
    """
    Create new user.
    """
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
