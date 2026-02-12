"""
Assessment API endpoints.

Provides CRUD operations for student assessments and progress tracking.
"""
from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api import deps
from app.core import db
from app.models.user import User, UserRole
from app.models.assessment import Assessment, AssessmentCreate, AssessmentRead, AssessmentUpdate, AssessmentType
from app.models.course import Enrollment
from app.validators import AssessmentValidator

router = APIRouter()


@router.post("/", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    assessment_data: AssessmentCreate,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    request: Request
):
    """
    Create a new assessment.
    
    Only instructors and admins can create assessments.
    Instructors can only assess their own students.
    """
    # Check permissions
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors and admins can create assessments"
        )
    
    # Validate score
    is_valid, error = AssessmentValidator.validate_score(
        assessment_data.score,
        assessment_data.max_score
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Validate enrollment is active
    is_valid, error = await AssessmentValidator.validate_enrollment_active(
        assessment_data.enrollment_id,
        session
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Validate instructor assignment (unless admin)
    if current_user.role == UserRole.INSTRUCTOR:
        is_valid, error = await AssessmentValidator.validate_instructor_assignment(
            assessment_data.instructor_id,
            assessment_data.enrollment_id,
            session
        )
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
        
        # Ensure instructor is assessing their own students
        if assessment_data.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Instructors can only create assessments for their own students"
            )
    
    # Validate lesson if provided
    if assessment_data.lesson_id:
        is_valid, error = await AssessmentValidator.validate_lesson_exists(
            assessment_data.lesson_id,
            assessment_data.enrollment_id,
            session
        )
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Calculate passed status
    passed = AssessmentValidator.calculate_passed(
        assessment_data.score,
        assessment_data.max_score
    )
    
    # Create assessment
    assessment = Assessment(
        **assessment_data.model_dump(),
        passed=passed
    )
    
    session.add(assessment)
    await session.commit()
    await session.refresh(assessment)
    
    # Log audit
    await deps.log_audit(
        session=session,
        user_id=current_user.id,
        action="assessment_created",
        resource_type="assessment",
        resource_id=assessment.id,
        request=request,
        details={
            "enrollment_id": str(assessment_data.enrollment_id),
            "assessment_type": assessment_data.assessment_type.value,
            "score": assessment_data.score,
            "passed": passed
        },
        success=True
    )
    
    return assessment


@router.get("/enrollment/{enrollment_id}", response_model=List[AssessmentRead])
async def get_enrollment_assessments(
    enrollment_id: UUID,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    assessment_type: Optional[AssessmentType] = None
):
    """
    Get all assessments for a specific enrollment.
    
    Students can only view their own assessments.
    Instructors and admins can view all assessments.
    """
    # Get enrollment
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    
    # Check permissions
    if current_user.role == UserRole.STUDENT:
        if enrollment.student_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own assessments"
            )
    
    # Build query
    query = select(Assessment).where(Assessment.enrollment_id == enrollment_id)
    
    if assessment_type:
        query = query.where(Assessment.assessment_type == assessment_type)
    
    query = query.order_by(Assessment.assessment_date.desc())
    
    result = await session.execute(query)
    assessments = result.scalars().all()
    
    return assessments


@router.get("/student/me", response_model=List[AssessmentRead])
async def get_my_assessments(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """
    Get all assessments for the current student.
    
    Only students can use this endpoint.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only for students"
        )
    
    # Get all enrollments for this student
    enrollments_result = await session.execute(
        select(Enrollment).where(Enrollment.student_id == current_user.id)
    )
    enrollments = enrollments_result.scalars().all()
    enrollment_ids = [e.id for e in enrollments]
    
    if not enrollment_ids:
        return []
    
    # Get all assessments for these enrollments
    result = await session.execute(
        select(Assessment)
        .where(Assessment.enrollment_id.in_(enrollment_ids))
        .order_by(Assessment.assessment_date.desc())
    )
    assessments = result.scalars().all()
    
    return assessments


@router.get("/{assessment_id}", response_model=AssessmentRead)
async def get_assessment(
    assessment_id: UUID,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)]
):
    """Get a specific assessment by ID."""
    assessment = await session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    
    # Check permissions
    if current_user.role == UserRole.STUDENT:
        # Get enrollment to check if student owns it
        enrollment = await session.get(Enrollment, assessment.enrollment_id)
        if not enrollment or enrollment.student_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own assessments"
            )
    
    return assessment


@router.put("/{assessment_id}", response_model=AssessmentRead)
async def update_assessment(
    assessment_id: UUID,
    assessment_update: AssessmentUpdate,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_user)],
    request: Request
):
    """
    Update an assessment.
    
    Only the instructor who created it or admins can update assessments.
    """
    # Get assessment
    assessment = await session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    
    # Check permissions
    if current_user.role == UserRole.INSTRUCTOR:
        if assessment.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own assessments"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors and admins can update assessments"
        )
    
    # Update fields
    update_data = assessment_update.model_dump(exclude_unset=True)
    
    # Validate score if being updated
    if "score" in update_data or "max_score" in update_data:
        new_score = update_data.get("score", assessment.score)
        new_max_score = update_data.get("max_score", assessment.max_score)
        
        is_valid, error = AssessmentValidator.validate_score(new_score, new_max_score)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        
        # Recalculate passed status
        update_data["passed"] = AssessmentValidator.calculate_passed(new_score, new_max_score)
    
    for key, value in update_data.items():
        setattr(assessment, key, value)
    
    await session.commit()
    await session.refresh(assessment)
    
    # Log audit
    await deps.log_audit(
        session=session,
        user_id=current_user.id,
        action="assessment_updated",
        resource_type="assessment",
        resource_id=assessment.id,
        request=request,
        details=update_data,
        success=True
    )
    
    return assessment


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: UUID,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)],
    request: Request
):
    """
    Delete an assessment.
    
    Only admins can delete assessments.
    """
    assessment = await session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    
    await session.delete(assessment)
    await session.commit()
    
    # Log audit
    await deps.log_audit(
        session=session,
        user_id=current_user.id,
        action="assessment_deleted",
        resource_type="assessment",
        resource_id=assessment_id,
        request=request,
        success=True
    )
    
    return None
