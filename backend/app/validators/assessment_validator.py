"""
Assessment validation logic.

Validates assessment scores, instructor assignments, and business rules.
"""
from typing import Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.course import Enrollment
from app.models.lesson import Lesson


class AssessmentValidator:
    """Validator for assessment-related operations."""

    @staticmethod
    def validate_score(score: float, max_score: float) -> Tuple[bool, str]:
        """
        Validate that assessment score is within valid range.
        
        Args:
            score: The score achieved
            max_score: The maximum possible score
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if score < 0:
            return False, "Score cannot be negative"
        
        if max_score <= 0:
            return False, "Maximum score must be greater than zero"
        
        if score > max_score:
            return False, f"Score ({score}) cannot exceed maximum score ({max_score})"
        
        return True, ""

    @staticmethod
    def calculate_passed(score: float, max_score: float, passing_percentage: float = 60.0) -> bool:
        """
        Calculate if the assessment was passed based on score.
        
        Args:
            score: The score achieved
            max_score: The maximum possible score
            passing_percentage: Minimum percentage to pass (default 60%)
            
        Returns:
            True if passed, False otherwise
        """
        if max_score <= 0:
            return False
        
        percentage = (score / max_score) * 100
        return percentage >= passing_percentage

    @staticmethod
    async def validate_instructor_assignment(
        instructor_id: UUID,
        enrollment_id: UUID,
        session: AsyncSession
    ) -> Tuple[bool, str]:
        """
        Verify that the instructor is assigned to lessons for this enrollment.
        
        Args:
            instructor_id: ID of the instructor
            enrollment_id: ID of the enrollment
            session: Database session
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check if enrollment exists
        enrollment = await session.get(Enrollment, enrollment_id)
        if not enrollment:
            return False, "Enrollment not found"
        
        # Check if instructor has taught any lessons for this enrollment
        result = await session.execute(
            select(Lesson).where(
                Lesson.enrollment_id == enrollment_id,
                Lesson.instructor_id == instructor_id
            )
        )
        lessons = result.scalars().all()
        
        if not lessons:
            return False, "Instructor is not assigned to any lessons for this enrollment"
        
        return True, ""

    @staticmethod
    async def validate_enrollment_active(
        enrollment_id: UUID,
        session: AsyncSession
    ) -> Tuple[bool, str]:
        """
        Verify that the enrollment is active.
        
        Args:
            enrollment_id: ID of the enrollment
            session: Database session
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        enrollment = await session.get(Enrollment, enrollment_id)
        if not enrollment:
            return False, "Enrollment not found"
        
        if enrollment.status not in ["active", "pending"]:
            return False, f"Cannot assess enrollment with status: {enrollment.status}"
        
        return True, ""

    @staticmethod
    async def validate_lesson_exists(
        lesson_id: UUID,
        enrollment_id: UUID,
        session: AsyncSession
    ) -> Tuple[bool, str]:
        """
        Verify that the lesson exists and belongs to the enrollment.
        
        Args:
            lesson_id: ID of the lesson
            enrollment_id: ID of the enrollment
            session: Database session
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        lesson = await session.get(Lesson, lesson_id)
        if not lesson:
            return False, "Lesson not found"
        
        if lesson.enrollment_id != enrollment_id:
            return False, "Lesson does not belong to this enrollment"
        
        return True, ""
