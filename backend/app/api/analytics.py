"""
Analytics API endpoints.

Provides analytics and reporting data for admin dashboard.
Requires admin or manager role.
"""
from typing import Annotated, Optional
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, and_, extract
from uuid import UUID

from app.core.db import get_session
from app.api.deps import get_current_user, require_any_role
from app.models.user import User, UserRole
from app.models.course import Enrollment, Course, EnrollmentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.lesson import Lesson, LessonStatus
from app.models.vehicle import Vehicle
from app.schemas.analytics import (
    DashboardStats,
    UserCountByRole,
    EnrollmentStats,
    RevenueStats,
    LessonStats,
    VehicleStats,
    RecentActivity,
    RevenueAnalytics,
    RevenueDataPoint,
    PaymentMethodBreakdown,
    CourseRevenueBreakdown,
    EnrollmentTrends,
    EnrollmentDataPoint,
    InstructorPerformance,
    InstructorPerformanceItem,
    VehicleUtilization,
    VehicleUtilizationItem,
)

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardStats,
    dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def get_dashboard_stats(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> DashboardStats:
    """
    Get dashboard statistics.
    
    Returns comprehensive statistics for the admin dashboard including:
    - User counts by role
    - Enrollment statistics
    - Revenue statistics
    - Lesson statistics
    - Vehicle statistics
    - Recent activities
    """
    
    # User counts by role
    user_counts_query = select(
        User.role,
        func.count(User.id).label('count')
    ).where(
        User.deleted_at.is_(None)
    ).group_by(User.role)
    
    user_counts_result = await session.execute(user_counts_query)
    user_counts_raw = user_counts_result.all()
    
    user_counts = UserCountByRole()
    for role, count in user_counts_raw:
        if role == UserRole.ADMIN:
            user_counts.admin = count
        elif role == UserRole.MANAGER:
            user_counts.manager = count
        elif role == UserRole.INSTRUCTOR:
            user_counts.instructor = count
        elif role == UserRole.STUDENT:
            user_counts.student = count
        user_counts.total += count
    
    # Enrollment statistics
    enrollment_counts_query = select(
        Enrollment.status,
        func.count(Enrollment.id).label('count')
    ).where(
        Enrollment.deleted_at.is_(None)
    ).group_by(Enrollment.status)
    
    enrollment_counts_result = await session.execute(enrollment_counts_query)
    enrollment_counts_raw = enrollment_counts_result.all()
    
    enrollment_stats = EnrollmentStats()
    for status, count in enrollment_counts_raw:
        if status == EnrollmentStatus.ACTIVE:
            enrollment_stats.active = count
        elif status == EnrollmentStatus.COMPLETED:
            enrollment_stats.completed = count
        elif status == EnrollmentStatus.DROPPED:
            enrollment_stats.dropped = count
        elif status == EnrollmentStatus.PENDING:
            enrollment_stats.pending = count
        enrollment_stats.total += count
    
    # Revenue statistics
    revenue_query = select(
        Payment.status,
        func.sum(Payment.amount).label('total')
    ).where(
        Payment.deleted_at.is_(None)
    ).group_by(Payment.status)
    
    revenue_result = await session.execute(revenue_query)
    revenue_raw = revenue_result.all()
    
    revenue_stats = RevenueStats()
    for status, total in revenue_raw:
        total_amount = float(total) if total else 0.0
        if status == PaymentStatus.COMPLETED:
            revenue_stats.completed = total_amount
        elif status == PaymentStatus.PENDING:
            revenue_stats.pending = total_amount
        revenue_stats.total += total_amount
    
    # This month revenue
    now = datetime.now()
    first_day_this_month = datetime(now.year, now.month, 1)
    
    this_month_query = select(
        func.sum(Payment.amount)
    ).where(
        and_(
            Payment.deleted_at.is_(None),
            Payment.status == PaymentStatus.COMPLETED,
            Payment.timestamp >= first_day_this_month
        )
    )
    
    this_month_result = await session.execute(this_month_query)
    this_month_total = this_month_result.scalar()
    revenue_stats.this_month = float(this_month_total) if this_month_total else 0.0
    
    # Last month revenue
    if now.month == 1:
        first_day_last_month = datetime(now.year - 1, 12, 1)
        first_day_this_month_calc = datetime(now.year, 1, 1)
    else:
        first_day_last_month = datetime(now.year, now.month - 1, 1)
        first_day_this_month_calc = datetime(now.year, now.month, 1)
    
    last_month_query = select(
        func.sum(Payment.amount)
    ).where(
        and_(
            Payment.deleted_at.is_(None),
            Payment.status == PaymentStatus.COMPLETED,
            Payment.timestamp >= first_day_last_month,
            Payment.timestamp < first_day_this_month_calc
        )
    )
    
    last_month_result = await session.execute(last_month_query)
    last_month_total = last_month_result.scalar()
    revenue_stats.last_month = float(last_month_total) if last_month_total else 0.0
    
    # Lesson statistics
    lesson_counts_query = select(
        Lesson.status,
        func.count(Lesson.id).label('count')
    ).where(
        Lesson.deleted_at.is_(None)
    ).group_by(Lesson.status)
    
    lesson_counts_result = await session.execute(lesson_counts_query)
    lesson_counts_raw = lesson_counts_result.all()
    
    lesson_stats = LessonStats()
    for status, count in lesson_counts_raw:
        if status == LessonStatus.SCHEDULED:
            lesson_stats.scheduled = count
        elif status == LessonStatus.COMPLETED:
            lesson_stats.completed = count
        elif status == LessonStatus.CANCELLED:
            lesson_stats.cancelled = count
        elif status == LessonStatus.NO_SHOW:
            lesson_stats.no_show = count
        lesson_stats.total += count
    
    # Vehicle statistics
    vehicle_total_query = select(func.count(Vehicle.id)).where(Vehicle.deleted_at.is_(None))
    vehicle_total_result = await session.execute(vehicle_total_query)
    vehicle_total = vehicle_total_result.scalar() or 0
    
    vehicle_active_query = select(func.count(Vehicle.id)).where(
        and_(Vehicle.deleted_at.is_(None), Vehicle.is_active == True)
    )
    vehicle_active_result = await session.execute(vehicle_active_query)
    vehicle_active = vehicle_active_result.scalar() or 0
    
    # Vehicles needing maintenance (service date in past or within 7 days)
    maintenance_due_date = date.today() + timedelta(days=7)
    vehicle_maintenance_query = select(func.count(Vehicle.id)).where(
        and_(
            Vehicle.deleted_at.is_(None),
            Vehicle.is_active == True,
            Vehicle.next_service_date.is_not(None),
            Vehicle.next_service_date <= maintenance_due_date
        )
    )
    vehicle_maintenance_result = await session.execute(vehicle_maintenance_query)
    vehicle_maintenance = vehicle_maintenance_result.scalar() or 0
    
    vehicle_stats = VehicleStats(
        total=vehicle_total,
        active=vehicle_active,
        inactive=vehicle_total - vehicle_active,
        maintenance_due=vehicle_maintenance
    )
    
    # Recent activities (last 10)
    recent_activities = []
    
    # Recent enrollments
    recent_enrollments_query = select(Enrollment, User, Course).join(
        User, Enrollment.student_id == User.id
    ).join(
        Course, Enrollment.course_id == Course.id
    ).where(
        Enrollment.deleted_at.is_(None)
    ).order_by(Enrollment.created_at.desc()).limit(5)
    
    recent_enrollments_result = await session.execute(recent_enrollments_query)
    recent_enrollments = recent_enrollments_result.all()
    
    for enrollment, user, course in recent_enrollments:
        recent_activities.append(RecentActivity(
            id=enrollment.id,
            type="enrollment",
            description=f"{user.full_name or user.email} enrolled in {course.name}",
            timestamp=enrollment.created_at,
            user_name=user.full_name or user.email
        ))
    
    # Recent payments
    recent_payments_query = select(Payment, Enrollment, User).join(
        Enrollment, Payment.enrollment_id == Enrollment.id
    ).join(
        User, Enrollment.student_id == User.id
    ).where(
        Payment.deleted_at.is_(None)
    ).order_by(Payment.created_at.desc()).limit(5)
    
    recent_payments_result = await session.execute(recent_payments_query)
    recent_payments = recent_payments_result.all()
    
    for payment, enrollment, user in recent_payments:
        recent_activities.append(RecentActivity(
            id=payment.id,
            type="payment",
            description=f"{user.full_name or user.email} paid KES {payment.amount:,.2f}",
            timestamp=payment.created_at,
            user_name=user.full_name or user.email
        ))
    
    # Sort all activities by timestamp
    recent_activities.sort(key=lambda x: x.timestamp, reverse=True)
    recent_activities = recent_activities[:10]
    
    return DashboardStats(
        users=user_counts,
        enrollments=enrollment_stats,
        revenue=revenue_stats,
        lessons=lesson_stats,
        vehicles=vehicle_stats,
        recent_activities=recent_activities
    )


@router.get(
    "/revenue",
    response_model=RevenueAnalytics,
    dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def get_revenue_analytics(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: Optional[date] = Query(None, description="Start date for filtering"),
    end_date: Optional[date] = Query(None, description="End date for filtering"),
    course_id: Optional[UUID] = Query(None, description="Filter by course"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method")
) -> RevenueAnalytics:
    """
    Get revenue analytics with trends and breakdowns.
    
    Supports filtering by date range, course, and payment method.
    """
    
    # Build base query conditions
    conditions = [Payment.deleted_at.is_(None)]
    
    if start_date:
        conditions.append(Payment.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        conditions.append(Payment.timestamp <= datetime.combine(end_date, datetime.max.time()))
    if payment_method:
        conditions.append(Payment.method == payment_method)
    if course_id:
        conditions.append(Enrollment.course_id == course_id)
    
    # Total revenue
    if course_id:
        total_revenue_query = select(
            func.sum(Payment.amount)
        ).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).where(and_(*conditions))
    else:
        total_revenue_query = select(
            func.sum(Payment.amount)
        ).where(and_(*conditions))
    
    total_revenue_result = await session.execute(total_revenue_query)
    total_revenue = total_revenue_result.scalar() or 0.0
    
    # Completed revenue
    completed_conditions = conditions + [Payment.status == PaymentStatus.COMPLETED]
    if course_id:
        completed_revenue_query = select(
            func.sum(Payment.amount)
        ).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).where(and_(*completed_conditions))
    else:
        completed_revenue_query = select(
            func.sum(Payment.amount)
        ).where(and_(*completed_conditions))
    
    completed_revenue_result = await session.execute(completed_revenue_query)
    completed_revenue = completed_revenue_result.scalar() or 0.0
    
    # Pending revenue
    pending_conditions = conditions + [Payment.status == PaymentStatus.PENDING]
    if course_id:
        pending_revenue_query = select(
            func.sum(Payment.amount)
        ).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).where(and_(*pending_conditions))
    else:
        pending_revenue_query = select(
            func.sum(Payment.amount)
        ).where(and_(*pending_conditions))
    
    pending_revenue_result = await session.execute(pending_revenue_query)
    pending_revenue = pending_revenue_result.scalar() or 0.0
    
    # Trend data (daily aggregation)
    trend_conditions = conditions + [Payment.status == PaymentStatus.COMPLETED]
    if course_id:
        trend_query = select(
            func.date(Payment.timestamp).label('date'),
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).where(
            and_(*trend_conditions)
        ).group_by(func.date(Payment.timestamp)).order_by(func.date(Payment.timestamp))
    else:
        trend_query = select(
            func.date(Payment.timestamp).label('date'),
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).where(
            and_(*trend_conditions)
        ).group_by(func.date(Payment.timestamp)).order_by(func.date(Payment.timestamp))
    
    trend_result = await session.execute(trend_query)
    trend_raw = trend_result.all()
    
    trend_data = [
        RevenueDataPoint(
            date=row.date.isoformat(),
            amount=float(row.amount),
            count=row.count
        )
        for row in trend_raw
    ]
    
    # By payment method
    method_conditions = conditions + [Payment.status == PaymentStatus.COMPLETED]
    if course_id:
        method_query = select(
            Payment.method,
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).join(
            Enrollment, Payment.enrollment_id == Enrollment.id
        ).where(
            and_(*method_conditions)
        ).group_by(Payment.method)
    else:
        method_query = select(
            Payment.method,
            func.sum(Payment.amount).label('amount'),
            func.count(Payment.id).label('count')
        ).where(
            and_(*method_conditions)
        ).group_by(Payment.method)
    
    method_result = await session.execute(method_query)
    method_raw = method_result.all()
    
    by_payment_method = [
        PaymentMethodBreakdown(
            method=row.method,
            amount=float(row.amount),
            count=row.count
        )
        for row in method_raw
    ]
    
    # By course
    course_conditions = conditions + [Payment.status == PaymentStatus.COMPLETED]
    course_query = select(
        Course.id,
        Course.name,
        func.sum(Payment.amount).label('amount'),
        func.count(func.distinct(Enrollment.id)).label('enrollment_count')
    ).join(
        Enrollment, Payment.enrollment_id == Enrollment.id
    ).join(
        Course, Enrollment.course_id == Course.id
    ).where(
        and_(*course_conditions)
    ).group_by(Course.id, Course.name).order_by(func.sum(Payment.amount).desc())
    
    course_result = await session.execute(course_query)
    course_raw = course_result.all()
    
    by_course = [
        CourseRevenueBreakdown(
            course_id=row.id,
            course_name=row.name,
            amount=float(row.amount),
            enrollment_count=row.enrollment_count
        )
        for row in course_raw
    ]
    
    return RevenueAnalytics(
        total_revenue=float(total_revenue),
        completed_revenue=float(completed_revenue),
        pending_revenue=float(pending_revenue),
        trend_data=trend_data,
        by_payment_method=by_payment_method,
        by_course=by_course
    )


@router.get(
    "/enrollments",
    response_model=EnrollmentTrends,
    dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def get_enrollment_trends(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: Optional[date] = Query(None, description="Start date for filtering"),
    end_date: Optional[date] = Query(None, description="End date for filtering"),
    status: Optional[EnrollmentStatus] = Query(None, description="Filter by status")
) -> EnrollmentTrends:
    """
    Get enrollment trends over time.
    """
    
    # Build conditions
    conditions = [Enrollment.deleted_at.is_(None)]
    
    if start_date:
        conditions.append(Enrollment.start_date >= start_date)
    if end_date:
        conditions.append(Enrollment.start_date <= end_date)
    if status:
        conditions.append(Enrollment.status == status)
    
    # Total enrollments
    total_query = select(func.count(Enrollment.id)).where(and_(*conditions))
    total_result = await session.execute(total_query)
    total_enrollments = total_result.scalar() or 0
    
    # Trend data (monthly aggregation)
    trend_query = select(
        extract('year', Enrollment.start_date).label('year'),
        extract('month', Enrollment.start_date).label('month'),
        func.count(Enrollment.id).label('count')
    ).where(
        and_(*conditions)
    ).group_by(
        extract('year', Enrollment.start_date),
        extract('month', Enrollment.start_date)
    ).order_by(
        extract('year', Enrollment.start_date),
        extract('month', Enrollment.start_date)
    )
    
    trend_result = await session.execute(trend_query)
    trend_raw = trend_result.all()
    
    trend_data = [
        EnrollmentDataPoint(
            date=f"{int(row.year)}-{int(row.month):02d}",
            count=row.count
        )
        for row in trend_raw
    ]
    
    # By status
    status_query = select(
        Enrollment.status,
        func.count(Enrollment.id).label('count')
    ).where(
        Enrollment.deleted_at.is_(None)
    ).group_by(Enrollment.status)
    
    status_result = await session.execute(status_query)
    status_raw = status_result.all()
    
    by_status = EnrollmentStats()
    for status_val, count in status_raw:
        if status_val == EnrollmentStatus.ACTIVE:
            by_status.active = count
        elif status_val == EnrollmentStatus.COMPLETED:
            by_status.completed = count
        elif status_val == EnrollmentStatus.DROPPED:
            by_status.dropped = count
        elif status_val == EnrollmentStatus.PENDING:
            by_status.pending = count
        by_status.total += count
    
    return EnrollmentTrends(
        total_enrollments=total_enrollments,
        trend_data=trend_data,
        by_status=by_status
    )


@router.get(
    "/instructors",
    response_model=InstructorPerformance,
    dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def get_instructor_performance(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> InstructorPerformance:
    """
    Get instructor performance metrics.
    """
    
    # Get all instructors
    instructors_query = select(User).where(
        and_(
            User.deleted_at.is_(None),
            User.role == UserRole.INSTRUCTOR
        )
    )
    
    instructors_result = await session.execute(instructors_query)
    instructors = instructors_result.scalars().all()
    
    instructor_items = []
    
    for instructor in instructors:
        # Total lessons
        total_lessons_query = select(func.count(Lesson.id)).where(
            and_(
                Lesson.deleted_at.is_(None),
                Lesson.instructor_id == instructor.id
            )
        )
        total_lessons_result = await session.execute(total_lessons_query)
        total_lessons = total_lessons_result.scalar() or 0
        
        # Completed lessons
        completed_lessons_query = select(func.count(Lesson.id)).where(
            and_(
                Lesson.deleted_at.is_(None),
                Lesson.instructor_id == instructor.id,
                Lesson.status == LessonStatus.COMPLETED
            )
        )
        completed_lessons_result = await session.execute(completed_lessons_query)
        completed_lessons = completed_lessons_result.scalar() or 0
        
        # Cancelled lessons
        cancelled_lessons_query = select(func.count(Lesson.id)).where(
            and_(
                Lesson.deleted_at.is_(None),
                Lesson.instructor_id == instructor.id,
                Lesson.status == LessonStatus.CANCELLED
            )
        )
        cancelled_lessons_result = await session.execute(cancelled_lessons_query)
        cancelled_lessons = cancelled_lessons_result.scalar() or 0
        
        # Completion rate
        completion_rate = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0.0
        
        # Active students (distinct students with active enrollments)
        active_students_query = select(func.count(func.distinct(Enrollment.student_id))).join(
            Lesson, Lesson.enrollment_id == Enrollment.id
        ).where(
            and_(
                Lesson.deleted_at.is_(None),
                Enrollment.deleted_at.is_(None),
                Lesson.instructor_id == instructor.id,
                Enrollment.status == EnrollmentStatus.ACTIVE
            )
        )
        active_students_result = await session.execute(active_students_query)
        active_students = active_students_result.scalar() or 0
        
        instructor_items.append(InstructorPerformanceItem(
            instructor_id=instructor.id,
            instructor_name=instructor.full_name or instructor.email,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            cancelled_lessons=cancelled_lessons,
            completion_rate=round(completion_rate, 2),
            active_students=active_students
        ))
    
    # Sort by total lessons descending
    instructor_items.sort(key=lambda x: x.total_lessons, reverse=True)
    
    return InstructorPerformance(instructors=instructor_items)


@router.get(
    "/vehicles",
    response_model=VehicleUtilization,
    dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def get_vehicle_utilization(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> VehicleUtilization:
    """
    Get vehicle utilization metrics.
    """
    
    # Get all vehicles
    vehicles_query = select(Vehicle).where(Vehicle.deleted_at.is_(None))
    vehicles_result = await session.execute(vehicles_query)
    vehicles = vehicles_result.scalars().all()
    
    vehicle_items = []
    active_count = 0
    
    for vehicle in vehicles:
        # Count lessons for this vehicle
        lessons_query = select(func.count(Lesson.id)).where(
            and_(
                Lesson.deleted_at.is_(None),
                Lesson.vehicle_id == vehicle.id
            )
        )
        lessons_result = await session.execute(lessons_query)
        total_lessons = lessons_result.scalar() or 0
        
        if vehicle.is_active:
            active_count += 1
        
        vehicle_items.append(VehicleUtilizationItem(
            vehicle_id=vehicle.id,
            reg_number=vehicle.reg_number,
            type=vehicle.type,
            total_lessons=total_lessons,
            is_active=vehicle.is_active,
            next_service_date=vehicle.next_service_date,
            insurance_expiry=vehicle.insurance_expiry
        ))
    
    # Sort by total lessons descending
    vehicle_items.sort(key=lambda x: x.total_lessons, reverse=True)
    
    return VehicleUtilization(
        vehicles=vehicle_items,
        total_vehicles=len(vehicles),
        active_vehicles=active_count
    )
