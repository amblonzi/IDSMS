from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from datetime import datetime, timezone

from app.core.db import get_session
from app.models.settings import Settings
from app.models.user import User, UserRole
from app.schemas.settings import SettingsRead, SettingsUpdate
from app.api.deps import get_current_user, require_role

router = APIRouter()


@router.get("", response_model=SettingsRead)
async def get_settings(session: Annotated[AsyncSession, Depends(get_session)]):
    """
    Get system settings (public endpoint - no auth required)
    This is needed for branding on login page
    """
    result = await session.execute(select(Settings).where(Settings.id == 1))
    settings = result.scalars().first()
    
    if not settings:
        # Create default settings if none exist
        settings = Settings(id=1)
        session.add(settings)
        await session.commit()
        await session.refresh(settings)
    
    return settings


@router.put("", response_model=SettingsRead)
async def update_settings(
    settings_update: SettingsUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
):
    """
    Update system settings (admin only)
    """
    result = await session.execute(select(Settings).where(Settings.id == 1))
    settings = result.scalars().first()
    
    if not settings:
        # Create settings if none exist
        settings = Settings(id=1)
        session.add(settings)
    
    # Update only provided fields
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    # Update metadata
    settings.updated_at = datetime.now(timezone.utc)
    settings.updated_by = current_user.id
    
    await session.commit()
    await session.refresh(settings)
    
    return settings
