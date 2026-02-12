"""
Models package - exports all database models for easy import.
"""
from app.models.base import BaseModel, TimestampMixin, SoftDeleteMixin
from app.models.user import User, UserRole, UserCreate, UserRead
from app.models.course import Course, CourseCreate, CourseRead, Enrollment, EnrollmentCreate, EnrollmentRead, EnrollmentStatus
from app.models.payment import Payment, PaymentCreate, PaymentRead, PaymentStatus
from app.models.lesson import Lesson, LessonCreate, LessonRead, LessonStatus, LessonType
from app.models.vehicle import Vehicle, VehicleCreate, VehicleRead
from app.models.profile import Profile, ProfileCreate, ProfileRead
from app.models.token_blacklist import TokenBlacklist
from app.models.audit_log import AuditLog
from app.models.assessment import Assessment, AssessmentCreate, AssessmentRead, AssessmentUpdate, AssessmentType
from app.models.document import Document, DocumentCreate, DocumentRead, DocumentUpdate, DocumentType, DocumentStatus, DocumentVerify
from app.models.settings import Settings
from app.models.curriculum import (
    Curriculum, CurriculumCreate, CurriculumRead,
    Module, ModuleCreate, ModuleRead, ModuleType,
    LessonTopic, LessonTopicCreate, LessonTopicRead,
    StudentProgress, StudentProgressCreate, StudentProgressRead
)

__all__ = [
    # Base
    "BaseModel",
    "TimestampMixin",
    "SoftDeleteMixin",
    # User
    "User",
    "UserRole",
    "UserCreate",
    "UserRead",
    # Course & Enrollment
    "Course",
    "CourseCreate",
    "CourseRead",
    "Enrollment",
    "EnrollmentCreate",
    "EnrollmentRead",
    "EnrollmentStatus",
    # Payment
    "Payment",
    "PaymentCreate",
    "PaymentRead",
    "PaymentStatus",
    # Lesson
    "Lesson",
    "LessonCreate",
    "LessonRead",
    "LessonStatus",
    "LessonType",
    # Vehicle
    "Vehicle",
    "VehicleCreate",
    "VehicleRead",
    # Profile
    "Profile",
    "ProfileCreate",
    "ProfileRead",
    # Assessment
    "Assessment",
    "AssessmentCreate",
    "AssessmentRead",
    "AssessmentUpdate",
    "AssessmentType",
    # Document
    "Document",
    "DocumentCreate",
    "DocumentRead",
    "DocumentUpdate",
    "DocumentType",
    "DocumentStatus",
    "DocumentVerify",
    # Curriculum
    "Curriculum",
    "CurriculumCreate",
    "CurriculumRead",
    "Module",
    "ModuleCreate",
    "ModuleRead",
    "ModuleType",
    "LessonTopic",
    "LessonTopicCreate",
    "LessonTopicRead",
    "StudentProgress",
    "StudentProgressCreate",
    "StudentProgressRead",
    # Security
    "TokenBlacklist",
    "AuditLog",
    "Settings",
]
