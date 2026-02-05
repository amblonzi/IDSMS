from typing import Annotated, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import db
from app.models.lesson import Lesson, LessonCreate, LessonRead, LessonStatus
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=LessonRead)
async def schedule_lesson(
    lesson: LessonCreate,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Schedule a lesson.
    """
    # Verify enrollment ownership (or if instructor/admin)
    # Simplified logic: Allow if user is linked to enrollment or is staff (omitted for brevity)
    
    # Check instructor availability (Simplistic check)
    query = select(Lesson).where(
        Lesson.instructor_id == lesson.instructor_id,
        Lesson.scheduled_at == lesson.scheduled_at,
        Lesson.status == LessonStatus.SCHEDULED
    )
    result = await session.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Instructor is busy at this time")

    db_lesson = Lesson.model_validate(lesson)
    session.add(db_lesson)
    await session.commit()
    await session.refresh(db_lesson)
    return db_lesson

@router.get("/", response_model=List[LessonRead])
async def read_lessons(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    start_date: datetime = None,
    end_date: datetime = None,
    instructor_id: UUID = None,
    student_id: UUID = None # requires join logic with enrollment
):
    """
    List lessons (Calendar view).
    """
    query = select(Lesson)
    
    if start_date:
        query = query.where(Lesson.scheduled_at >= start_date)
    if end_date:
        query = query.where(Lesson.scheduled_at <= end_date)
    if instructor_id:
        query = query.where(Lesson.instructor_id == instructor_id)
        
    result = await session.execute(query)
    return result.scalars().all()

@router.patch("/{lesson_id}/status", response_model=LessonRead)
async def update_lesson_status(
    lesson_id: UUID,
    status: LessonStatus,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)] # or instructor
):
    """
    Update lesson status (e.g. Completed).
    """
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    lesson.status = status
    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)
    return lesson
