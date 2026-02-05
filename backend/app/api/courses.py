from typing import Annotated, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import db
from app.models.course import Course, CourseCreate, CourseRead, Enrollment, EnrollmentRead
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[CourseRead])
async def read_courses(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    skip: int = 0,
    limit: int = 100
):
    """
    List all available courses.
    """
    result = await session.execute(select(Course).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/", response_model=CourseRead)
async def create_course(
    course: CourseCreate,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)]
):
    """
    Create a new course (Admin only).
    """
    db_course = Course.model_validate(course)
    session.add(db_course)
    await session.commit()
    await session.refresh(db_course)
    return db_course

@router.post("/{course_id}/enroll", response_model=EnrollmentRead)
async def enroll_student(
    course_id: UUID,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Enroll current user in a course.
    """
    # Check if course exists
    course = await session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Check if already enrolled (naive check)
    query = select(Enrollment).where(
        Enrollment.course_id == course_id,
        Enrollment.student_id == current_user.id
    )
    result = await session.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    enrollment = Enrollment(course_id=course_id, student_id=current_user.id, total_paid=0.0)
    session.add(enrollment)
    await session.commit()
    await session.refresh(enrollment)
    return enrollment

@router.get("/my-enrollments", response_model=List[EnrollmentRead])
async def read_my_enrollments(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    List enrollments for the current user.
    """
    query = select(Enrollment).where(Enrollment.student_id == current_user.id)
    result = await session.execute(query)
    return result.scalars().all()
