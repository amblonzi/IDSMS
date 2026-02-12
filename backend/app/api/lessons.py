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
    Schedule a lesson with comprehensive validation.
    Validates business hours, conflicts, and resource availability.
    """
    from app.validators import ScheduleValidator
    from app.api.deps import log_audit
    
    # Extract start and end times from lesson data
    # Assuming LessonCreate has start_time and end_time fields
    start_time = lesson.start_time if hasattr(lesson, 'start_time') else lesson.scheduled_at
    end_time = lesson.end_time if hasattr(lesson, 'end_time') else None
    
    # If no end_time, calculate from duration (assume 1 hour default)
    if not end_time and hasattr(lesson, 'duration_minutes'):
        from datetime import timedelta
        end_time = start_time + timedelta(minutes=lesson.duration_minutes)
    elif not end_time:
        from datetime import timedelta
        end_time = start_time + timedelta(hours=1)  # Default 1 hour
    
    # Comprehensive schedule validation
    is_valid, error = await ScheduleValidator.validate_schedule(
        start_time=start_time,
        end_time=end_time,
        instructor_id=str(lesson.instructor_id),
        vehicle_id=str(lesson.vehicle_id) if hasattr(lesson, 'vehicle_id') and lesson.vehicle_id else None,
        db_session=session
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Verify enrollment ownership (or if instructor/admin)
    if hasattr(lesson, 'enrollment_id'):
        from app.models.course import Enrollment
        enrollment = await session.get(Enrollment, lesson.enrollment_id)
        if enrollment:
            if enrollment.user_id != current_user.id and current_user.role not in ["admin", "instructor"]:
                raise HTTPException(status_code=403, detail="Not authorized to schedule lessons for this enrollment")
    
    # Create lesson
    db_lesson = Lesson.model_validate(lesson)
    session.add(db_lesson)
    await session.commit()
    await session.refresh(db_lesson)
    
    # Log lesson scheduling
    await log_audit(
        session=session,
        user_id=current_user.id,
        action="lesson_scheduled",
        resource_type="lesson",
        resource_id=db_lesson.id,
        success=True,
        details={
            "instructor_id": str(lesson.instructor_id),
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
    )
    
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
