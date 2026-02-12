from typing import List, Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api import deps
from app.core.db import get_session
from app.models.user import User, UserRole
from app.models.curriculum import (
    Curriculum, CurriculumRead, CurriculumCreate,
    Module, ModuleRead,
    LessonTopic, LessonTopicRead,
    StudentProgress, StudentProgressRead, StudentProgressCreate
)
from app.models.course import Enrollment

router = APIRouter()

@router.get("/", response_model=List[CurriculumRead])
async def read_curricula(
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100
):
    """Get all curricula."""
    result = await session.execute(select(Curriculum).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{curriculum_id}", response_model=CurriculumRead)
async def read_curriculum(
    curriculum_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get curriculum by ID."""
    curr = await session.get(Curriculum, curriculum_id)
    if not curr:
        raise HTTPException(status_code=404, detail="Curriculum not found")
    return curr

@router.get("/course/{course_id}", response_model=CurriculumRead)
async def read_curriculum_by_course(
    course_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get curriculum for a specific course."""
    result = await session.execute(select(Curriculum).where(Curriculum.course_id == course_id))
    curr = result.scalars().first()
    if not curr:
        raise HTTPException(status_code=404, detail="Curriculum for this course not found")
    return curr

@router.get("/{curriculum_id}/modules", response_model=List[ModuleRead])
async def read_modules(
    curriculum_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get modules for a curriculum."""
    result = await session.execute(
        select(Module).where(Module.curriculum_id == curriculum_id).order_by(Module.order_index)
    )
    return result.scalars().all()

@router.get("/modules/{module_id}/topics", response_model=List[LessonTopicRead])
async def read_topics(
    module_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Get topics for a module."""
    result = await session.execute(
        select(LessonTopic).where(LessonTopic.module_id == module_id).order_by(LessonTopic.order_index)
    )
    return result.scalars().all()

# --- Student Progress Endpoints ---

@router.get("/progress/{enrollment_id}", response_model=List[StudentProgressRead])
async def read_student_progress(
    enrollment_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """Get progress for a student enrollment."""
    # Check if user has access to this enrollment
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR] and current_user.id != enrollment.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this progress")

    result = await session.execute(
        select(StudentProgress).where(StudentProgress.enrollment_id == enrollment_id)
    )
    return result.scalars().all()

@router.post("/progress", response_model=StudentProgressRead)
async def mark_topic_completed(
    progress_in: StudentProgressCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """Mark a curriculum topic as completed (Instructor only)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR]:
        raise HTTPException(status_code=403, detail="Only staff can mark topics as completed")
    
    # Check if already completed
    query = select(StudentProgress).where(
        StudentProgress.enrollment_id == progress_in.enrollment_id,
        StudentProgress.topic_id == progress_in.topic_id
    )
    result = await session.execute(query)
    existing = result.scalars().first()
    
    if existing:
        existing.completed = progress_in.completed
        existing.completed_at = progress_in.completed_at or (datetime.utcnow() if progress_in.completed else None)
        existing.instructor_verified = True
        existing.verified_by = current_user.id
        session.add(existing)
        progress = existing
    else:
        from datetime import datetime
        progress = StudentProgress.model_validate(progress_in, update={
            "instructor_verified": True,
            "verified_by": current_user.id,
            "completed_at": progress_in.completed_at or (datetime.utcnow() if progress_in.completed else None)
        })
        session.add(progress)
    
    await session.commit()
    await session.refresh(progress)
    return progress
