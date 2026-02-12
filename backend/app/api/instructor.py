"""
Instructor dashboard and reporting API endpoints.

Provides instructors with schedule overview, student progress, and performance metrics.
"""
from typing import Annotated, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api import deps
from app.core import db
from app.models.user import User, UserRole
from app.models.lesson import Lesson, LessonStatus
from app.models.course import Enrollment
from app.models.payment import Payment, PaymentStatus

router = APIRouter()


class DashboardStats(BaseModel):
    """Instructor dashboard statistics."""
    total_lessons_today: int
    total_lessons_week: int
    completed_lessons_week: int
    upcoming_lessons: int
    total_students: int
    revenue_this_month: float


class LessonSummary(BaseModel):
    """Lesson summary for dashboard."""
    id: str
    student_name: str
    start_time: datetime
    end_time: datetime
    status: str
    vehicle_id: Optional[str]


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_instructor_dashboard_stats(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get instructor dashboard statistics.
    
    Returns:
    - Lessons today
    - Lessons this week
    - Completed lessons
    - Upcoming lessons
    - Total students
    - Revenue this month
    """
    # Verify instructor role
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only instructors can access this endpoint")
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_start = today_start - timedelta(days=today_start.weekday())
    week_end = week_start + timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Lessons today
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time >= today_start,
            Lesson.start_time < today_end
        )
    )
    total_lessons_today = result.scalar() or 0
    
    # Lessons this week
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time >= week_start,
            Lesson.start_time < week_end
        )
    )
    total_lessons_week = result.scalar() or 0
    
    # Completed lessons this week
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time >= week_start,
            Lesson.start_time < week_end,
            Lesson.status == LessonStatus.COMPLETED
        )
    )
    completed_lessons_week = result.scalar() or 0
    
    # Upcoming lessons
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time > now,
            Lesson.status == LessonStatus.SCHEDULED
        )
    )
    upcoming_lessons = result.scalar() or 0
    
    # Total unique students (from enrollments linked to lessons)
    result = await session.execute(
        select(func.count(func.distinct(Enrollment.user_id))).select_from(Lesson).join(
            Enrollment, Lesson.enrollment_id == Enrollment.id
        ).where(
            Lesson.instructor_id == current_user.id
        )
    )
    total_students = result.scalar() or 0
    
    # Revenue this month (if instructor gets commission - simplified)
    # In reality, this would be calculated based on payment splits
    result = await session.execute(
        select(func.sum(Payment.amount)).select_from(Payment).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).join(
            Lesson, Lesson.enrollment_id == Enrollment.id
        ).where(
            Lesson.instructor_id == current_user.id,
            Payment.created_at >= month_start,
            Payment.status == PaymentStatus.COMPLETED
        )
    )
    revenue_this_month = float(result.scalar() or 0.0)
    
    return DashboardStats(
        total_lessons_today=total_lessons_today,
        total_lessons_week=total_lessons_week,
        completed_lessons_week=completed_lessons_week,
        upcoming_lessons=upcoming_lessons,
        total_students=total_students,
        revenue_this_month=revenue_this_month
    )


@router.get("/dashboard/schedule", response_model=List[dict])
async def get_instructor_schedule(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    status: Optional[LessonStatus] = Query(None)
):
    """
    Get instructor's lesson schedule.
    
    Optionally filter by date range and status.
    """
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only instructors can access this endpoint")
    
    # Default to next 7 days if no dates provided
    if not start_date:
        start_date = datetime.utcnow()
    if not end_date:
        end_date = start_date + timedelta(days=7)
    
    # Build query
    query = select(Lesson).where(
        Lesson.instructor_id == current_user.id,
        Lesson.start_time >= start_date,
        Lesson.start_time <= end_date
    )
    
    if status:
        query = query.where(Lesson.status == status)
    
    query = query.order_by(Lesson.start_time)
    
    result = await session.execute(query)
    lessons = result.scalars().all()
    
    # Enrich with student information
    enriched_lessons = []
    for lesson in lessons:
        # Get enrollment and student info
        enrollment = await session.get(Enrollment, lesson.enrollment_id) if hasattr(lesson, 'enrollment_id') else None
        student = await session.get(User, enrollment.user_id) if enrollment else None
        
        enriched_lessons.append({
            "id": str(lesson.id),
            "start_time": lesson.start_time.isoformat(),
            "end_time": lesson.end_time.isoformat() if hasattr(lesson, 'end_time') else None,
            "status": lesson.status,
            "student_name": f"{student.email}" if student else "Unknown",
            "vehicle_id": str(lesson.vehicle_id) if hasattr(lesson, 'vehicle_id') and lesson.vehicle_id else None,
            "notes": lesson.notes if hasattr(lesson, 'notes') else None
        })
    
    return enriched_lessons


@router.get("/reports/performance", response_model=dict)
async def get_performance_report(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """
    Get instructor performance report.
    
    Includes:
    - Lesson completion rate
    - Average lessons per day
    - Student satisfaction (if ratings exist)
    - Revenue breakdown
    """
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only instructors can access this endpoint")
    
    # Default to last 30 days
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Total lessons in period
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time >= start_date,
            Lesson.start_time <= end_date
        )
    )
    total_lessons = result.scalar() or 0
    
    # Completed lessons
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time >= start_date,
            Lesson.start_time <= end_date,
            Lesson.status == LessonStatus.COMPLETED
        )
    )
    completed_lessons = result.scalar() or 0
    
    # Cancelled lessons
    result = await session.execute(
        select(func.count(Lesson.id)).where(
            Lesson.instructor_id == current_user.id,
            Lesson.start_time >= start_date,
            Lesson.start_time <= end_date,
            Lesson.status == LessonStatus.CANCELLED
        )
    )
    cancelled_lessons = result.scalar() or 0
    
    # Calculate metrics
    completion_rate = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    days_in_period = (end_date - start_date).days or 1
    avg_lessons_per_day = total_lessons / days_in_period
    
    # Revenue in period
    result = await session.execute(
        select(func.sum(Payment.amount)).select_from(Payment).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).join(
            Lesson, Lesson.enrollment_id == Enrollment.id
        ).where(
            Lesson.instructor_id == current_user.id,
            Payment.created_at >= start_date,
            Payment.created_at <= end_date,
            Payment.status == PaymentStatus.COMPLETED
        )
    )
    total_revenue = float(result.scalar() or 0.0)
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days_in_period
        },
        "lessons": {
            "total": total_lessons,
            "completed": completed_lessons,
            "cancelled": cancelled_lessons,
            "completion_rate": round(completion_rate, 2)
        },
        "metrics": {
            "avg_lessons_per_day": round(avg_lessons_per_day, 2),
            "total_revenue": total_revenue,
            "avg_revenue_per_lesson": round(total_revenue / total_lessons, 2) if total_lessons > 0 else 0
        }
    }


@router.get("/students/list", response_model=List[dict])
async def get_instructor_students(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get list of students taught by this instructor.
    """
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only instructors can access this endpoint")
    
    # Get unique students from lessons
    result = await session.execute(
        select(User).select_from(Lesson).join(
            Enrollment, Lesson.enrollment_id == Enrollment.id
        ).join(
            User, Enrollment.user_id == User.id
        ).where(
            Lesson.instructor_id == current_user.id
        ).distinct()
    )
    students = result.scalars().all()
    
    # Enrich with lesson count
    student_list = []
    for student in students:
        # Count lessons for this student
        result = await session.execute(
            select(func.count(Lesson.id)).select_from(Lesson).join(
                Enrollment, Lesson.enrollment_id == Enrollment.id
            ).where(
                Lesson.instructor_id == current_user.id,
                Enrollment.user_id == student.id
            )
        )
        lesson_count = result.scalar() or 0
        
        # Count completed lessons
        result = await session.execute(
            select(func.count(Lesson.id)).select_from(Lesson).join(
                Enrollment, Lesson.enrollment_id == Enrollment.id
            ).where(
                Lesson.instructor_id == current_user.id,
                Enrollment.user_id == student.id,
                Lesson.status == LessonStatus.COMPLETED
            )
        )
        completed_count = result.scalar() or 0
        
        student_list.append({
            "id": str(student.id),
            "email": student.email,
            "total_lessons": lesson_count,
            "completed_lessons": completed_count,
            "progress": round((completed_count / lesson_count * 100), 2) if lesson_count > 0 else 0
        })
    
    return student_list
