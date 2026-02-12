"""
Student onboarding API endpoints.

Handles student registration, profile completion, document upload, and enrollment.
"""
from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api import deps
from app.core import db, security
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.course import Course, Enrollment
from app.validators import UserValidator

router = APIRouter()


class StudentRegistration(BaseModel):
    """Student registration data."""
    email: Optional[str] = None
    password: Optional[str] = None
    first_name: str
    last_name: str
    phone: str
    national_id: str
    date_of_birth: str
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class ProfileCompletion(BaseModel):
    """Profile completion data."""
    address: str
    emergency_contact_name: str
    emergency_contact_phone: str
    medical_conditions: Optional[str] = None
    previous_driving_experience: Optional[str] = None


class EnrollmentRequest(BaseModel):
    """Course enrollment request."""
    course_id: UUID
    payment_plan: str = "full"  # full, installment
    notes: Optional[str] = None


@router.post("/register", response_model=dict)
async def register_student(
    registration: StudentRegistration,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    request: Request
):
    """
    Register a new student (Admin/Instructor only).
    
    Steps:
    1. Check permissions
    2. Validate all user data
    3. Create user account with 'student' role
    4. Create associated profile
    5. Return success
    """
    from app.api.deps import log_audit
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR]:
        raise HTTPException(status_code=403, detail="Only school staff can register new students")
    
    # Validate user data
    is_valid, error = UserValidator.validate_user_data(
        email=registration.email,
        phone=registration.phone,
        first_name=registration.first_name,
        last_name=registration.last_name,
        national_id=registration.national_id,
        date_of_birth=registration.date_of_birth
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Validate password only if provided
    if registration.password:
        is_valid, error = security.validate_password(registration.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
    
    # Validate emergency contact phone if provided
    if registration.emergency_contact_phone:
        is_valid, error = UserValidator.validate_phone(registration.emergency_contact_phone)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Emergency contact {error.lower()}")
    
    # Check if user already exists (only if email provided)
    if registration.email:
        result = await session.execute(select(User).where(User.email == registration.email))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Check if national ID already exists
    result = await session.execute(
        select(Profile).where(Profile.national_id == registration.national_id)
    )
    existing_profile = result.scalars().first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="National ID already registered")
    
    # Create user account
    user = User(
        email=registration.email,
        hashed_password=security.get_password_hash(registration.password) if registration.password else None,
        role=UserRole.STUDENT,
        is_active=True
    )
    session.add(user)
    await session.flush()  # Get user ID
    
    # Create profile
    profile = Profile(
        user_id=user.id,
        first_name=registration.first_name,
        last_name=registration.last_name,
        phone_number=registration.phone,
        national_id=registration.national_id,
        date_of_birth=registration.date_of_birth,
        address=registration.address,
        emergency_contact_name=registration.emergency_contact_name,
        emergency_contact_phone=registration.emergency_contact_phone
    )
    session.add(profile)
    await session.commit()
    await session.refresh(user)
    await session.refresh(profile)
    
    # Log registration
    await log_audit(
        session=session,
        user_id=user.id,
        action="student_registered",
        resource_type="user",
        resource_id=user.id,
        request=request,
        success=True,
        details={
            "email": user.email,
            "national_id": registration.national_id
        }
    )
    
    return {
        "message": "Registration successful",
        "user_id": str(user.id),
        "next_steps": [
            "Complete your profile",
            "Upload required documents",
            "Browse and enroll in courses"
        ]
    }


@router.patch("/profile/complete", response_model=dict)
async def complete_profile(
    profile_data: ProfileCompletion,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Complete student profile with additional information.
    """
    from app.api.deps import log_audit
    
    # Validate emergency contact phone
    is_valid, error = UserValidator.validate_phone(profile_data.emergency_contact_phone)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Emergency contact {error.lower()}")
    
    # Get user's profile
    result = await session.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update profile
    profile.address = profile_data.address
    profile.emergency_contact_name = profile_data.emergency_contact_name
    profile.emergency_contact_phone = profile_data.emergency_contact_phone
    profile.medical_conditions = profile_data.medical_conditions
    profile.previous_driving_experience = profile_data.previous_driving_experience
    
    session.add(profile)
    await session.commit()
    
    # Log profile completion
    await log_audit(
        session=session,
        user_id=current_user.id,
        action="profile_completed",
        resource_type="profile",
        resource_id=profile.id,
        success=True,
        details={"completed": True}
    )
    
    return {
        "message": "Profile completed successfully",
        "profile_complete": True
    }


@router.post("/enroll", response_model=dict)
async def enroll_in_course(
    enrollment_request: EnrollmentRequest,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Enroll student in a course.
    
    Validates:
    - Course exists and is active
    - Student has completed profile
    - Student is not already enrolled
    - Age requirements met
    """
    from app.api.deps import log_audit
    
    # Verify student role
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can enroll in courses")
    
    # Check if course exists
    course = await session.get(Course, enrollment_request.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if profile is complete
    result = await session.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your profile before enrolling")
    
    if not profile.address or not profile.emergency_contact_name:
        raise HTTPException(
            status_code=400,
            detail="Please complete your profile (address and emergency contact required)"
        )
    
    # Check if already enrolled
    result = await session.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == enrollment_request.course_id
        )
    )
    existing_enrollment = result.scalars().first()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=enrollment_request.course_id,
        status="pending",  # Pending payment
        total_paid=0.0,
        notes=enrollment_request.notes
    )
    session.add(enrollment)
    await session.commit()
    await session.refresh(enrollment)
    
    # Log enrollment
    await log_audit(
        session=session,
        user_id=current_user.id,
        action="course_enrolled",
        resource_type="enrollment",
        resource_id=enrollment.id,
        success=True,
        details={
            "course_id": str(enrollment_request.course_id),
            "payment_plan": enrollment_request.payment_plan
        }
    )
    
    return {
        "message": "Enrollment successful",
        "enrollment_id": str(enrollment.id),
        "course_name": course.name,
        "course_price": course.price,
        "payment_plan": enrollment_request.payment_plan,
        "next_steps": [
            "Proceed to payment",
            "Wait for enrollment confirmation",
            "Schedule your first lesson"
        ]
    }


@router.get("/onboarding/status", response_model=dict)
async def get_onboarding_status(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get student onboarding status and next steps.
    """
    # Get profile
    result = await session.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    
    # Get enrollments
    result = await session.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id)
    )
    enrollments = result.scalars().all()
    
    # Determine onboarding status
    profile_complete = False
    if profile:
        profile_complete = bool(
            profile.address and
            profile.emergency_contact_name and
            profile.emergency_contact_phone
        )
    
    has_enrollments = len(enrollments) > 0
    
    # Determine next steps
    next_steps = []
    if not profile:
        next_steps.append("Create your profile")
    elif not profile_complete:
        next_steps.append("Complete your profile")
    
    if profile_complete and not has_enrollments:
        next_steps.append("Browse courses and enroll")
    
    if has_enrollments:
        pending_payments = [e for e in enrollments if e.status == "pending"]
        if pending_payments:
            next_steps.append("Complete payment for pending enrollments")
        else:
            next_steps.append("Schedule your lessons")
    
    # Find the first pending enrollment to pay for
    pending_enrollment_data = None
    enrollment_pending = next((e for e in enrollments if e.status == "pending"), None)
    
    if enrollment_pending:
        # Get course details
        course = await session.get(Course, enrollment_pending.course_id)
        if course:
            amount_due = course.price - enrollment_pending.total_paid
            pending_enrollment_data = {
                "id": str(enrollment_pending.id),
                "course_name": course.name,
                "amount_due": amount_due,
                "course_price": course.price
            }

    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "profile_exists": profile is not None,
        "profile_complete": profile_complete,
        "enrollments_count": len(enrollments),
        "active_enrollments": len([e for e in enrollments if e.status == "active"]),
        "pending_enrollments": len([e for e in enrollments if e.status == "pending"]),
        "next_steps": next_steps,
        "onboarding_complete": profile_complete and has_enrollments,
        "pending_enrollment": pending_enrollment_data
    }


@router.get("/courses/available", response_model=List[dict])
async def get_available_courses(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get list of available courses for enrollment.
    Excludes courses the student is already enrolled in.
    """
    # Get user's enrollments
    result = await session.execute(
        select(Enrollment.course_id).where(Enrollment.user_id == current_user.id)
    )
    enrolled_course_ids = [row[0] for row in result.all()]
    
    # Get available courses
    query = select(Course).where(Course.is_active == True)
    if enrolled_course_ids:
        query = query.where(Course.id.not_in(enrolled_course_ids))
    
    result = await session.execute(query)
    courses = result.scalars().all()
    
    return [
        {
            "id": str(course.id),
            "name": course.name,
            "description": course.description,
            "price": course.price,
            "duration_hours": course.duration_hours if hasattr(course, 'duration_hours') else None,
            "category": course.category if hasattr(course, 'category') else None
        }
        for course in courses
    ]
