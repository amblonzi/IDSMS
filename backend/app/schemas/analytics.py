"""
Analytics schemas for API responses.

Includes schemas for:
- Dashboard statistics
- Revenue analytics
- Enrollment trends
- Instructor performance
- Vehicle utilization
"""
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
from uuid import UUID


class UserCountByRole(BaseModel):
    """User count breakdown by role."""
    admin: int = 0
    manager: int = 0
    instructor: int = 0
    student: int = 0
    total: int = 0


class EnrollmentStats(BaseModel):
    """Enrollment statistics."""
    total: int = 0
    active: int = 0
    completed: int = 0
    dropped: int = 0
    pending: int = 0


class RevenueStats(BaseModel):
    """Revenue statistics."""
    total: float = 0.0
    completed: float = 0.0
    pending: float = 0.0
    this_month: float = 0.0
    last_month: float = 0.0


class LessonStats(BaseModel):
    """Lesson statistics."""
    total: int = 0
    scheduled: int = 0
    completed: int = 0
    cancelled: int = 0
    no_show: int = 0


class VehicleStats(BaseModel):
    """Vehicle statistics."""
    total: int = 0
    active: int = 0
    inactive: int = 0
    maintenance_due: int = 0


class RecentActivity(BaseModel):
    """Recent activity item."""
    id: UUID
    type: str  # 'enrollment', 'payment', 'lesson'
    description: str
    timestamp: datetime
    user_name: Optional[str] = None


class DashboardStats(BaseModel):
    """Overall dashboard statistics."""
    users: UserCountByRole
    enrollments: EnrollmentStats
    revenue: RevenueStats
    lessons: LessonStats
    vehicles: VehicleStats
    recent_activities: List[RecentActivity] = []


class RevenueDataPoint(BaseModel):
    """Single revenue data point for charts."""
    date: str  # ISO date string
    amount: float
    count: int  # number of payments


class PaymentMethodBreakdown(BaseModel):
    """Payment breakdown by method."""
    method: str
    amount: float
    count: int


class CourseRevenueBreakdown(BaseModel):
    """Revenue breakdown by course."""
    course_id: UUID
    course_name: str
    amount: float
    enrollment_count: int


class RevenueAnalytics(BaseModel):
    """Revenue analytics with trends and breakdowns."""
    total_revenue: float
    completed_revenue: float
    pending_revenue: float
    trend_data: List[RevenueDataPoint]
    by_payment_method: List[PaymentMethodBreakdown]
    by_course: List[CourseRevenueBreakdown]


class EnrollmentDataPoint(BaseModel):
    """Single enrollment data point for charts."""
    date: str  # ISO date string (year-month)
    count: int
    status: Optional[str] = None


class EnrollmentTrends(BaseModel):
    """Enrollment trends over time."""
    total_enrollments: int
    trend_data: List[EnrollmentDataPoint]
    by_status: EnrollmentStats


class InstructorPerformanceItem(BaseModel):
    """Individual instructor performance metrics."""
    instructor_id: UUID
    instructor_name: str
    total_lessons: int
    completed_lessons: int
    cancelled_lessons: int
    completion_rate: float  # percentage
    active_students: int


class InstructorPerformance(BaseModel):
    """Instructor performance analytics."""
    instructors: List[InstructorPerformanceItem]


class VehicleUtilizationItem(BaseModel):
    """Individual vehicle utilization metrics."""
    vehicle_id: UUID
    reg_number: str
    type: str
    total_lessons: int
    is_active: bool
    next_service_date: Optional[date] = None
    insurance_expiry: Optional[date] = None


class VehicleUtilization(BaseModel):
    """Vehicle utilization analytics."""
    vehicles: List[VehicleUtilizationItem]
    total_vehicles: int
    active_vehicles: int
