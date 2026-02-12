"""
Schedule validation utilities.

Validates lesson scheduling, prevents conflicts, and enforces business hours.
"""
from datetime import datetime, time, timedelta
from typing import Optional, Tuple, List


class ScheduleValidator:
    """Validator for schedule-related operations."""
    
    # Business hours (24-hour format)
    BUSINESS_START_HOUR = 7  # 7:00 AM
    BUSINESS_END_HOUR = 19   # 7:00 PM
    
    # Lesson duration constraints
    MIN_LESSON_DURATION_MINUTES = 30
    MAX_LESSON_DURATION_MINUTES = 180  # 3 hours
    
    # Scheduling constraints
    MIN_ADVANCE_BOOKING_HOURS = 2  # Must book at least 2 hours in advance
    MAX_ADVANCE_BOOKING_DAYS = 90  # Can book up to 90 days in advance
    
    # Break time between lessons
    MIN_BREAK_MINUTES = 15
    
    @staticmethod
    def validate_business_hours(start_time: datetime, end_time: datetime) -> Tuple[bool, Optional[str]]:
        """
        Validate that lesson is within business hours.
        
        Args:
            start_time: Lesson start time
            end_time: Lesson end time
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check if start time is within business hours
        if start_time.hour < ScheduleValidator.BUSINESS_START_HOUR:
            return False, f"Lessons cannot start before {ScheduleValidator.BUSINESS_START_HOUR}:00 AM"
        
        # Check if end time is within business hours
        if end_time.hour >= ScheduleValidator.BUSINESS_END_HOUR or \
           (end_time.hour == ScheduleValidator.BUSINESS_END_HOUR and end_time.minute > 0):
            return False, f"Lessons must end by {ScheduleValidator.BUSINESS_END_HOUR}:00 PM"
        
        # Check if lesson spans across business hours
        if start_time.hour >= ScheduleValidator.BUSINESS_END_HOUR:
            return False, "Lesson start time is outside business hours"
        
        return True, None
    
    @staticmethod
    def validate_lesson_duration(start_time: datetime, end_time: datetime) -> Tuple[bool, Optional[str]]:
        """
        Validate lesson duration.
        
        Args:
            start_time: Lesson start time
            end_time: Lesson end time
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if end_time <= start_time:
            return False, "Lesson end time must be after start time"
        
        duration_minutes = (end_time - start_time).total_seconds() / 60
        
        if duration_minutes < ScheduleValidator.MIN_LESSON_DURATION_MINUTES:
            return False, f"Lesson must be at least {ScheduleValidator.MIN_LESSON_DURATION_MINUTES} minutes"
        
        if duration_minutes > ScheduleValidator.MAX_LESSON_DURATION_MINUTES:
            return False, f"Lesson cannot exceed {ScheduleValidator.MAX_LESSON_DURATION_MINUTES} minutes"
        
        return True, None
    
    @staticmethod
    def validate_advance_booking(start_time: datetime) -> Tuple[bool, Optional[str]]:
        """
        Validate advance booking constraints.
        
        Args:
            start_time: Lesson start time
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        now = datetime.utcnow()
        
        # Check if lesson is in the past
        if start_time < now:
            return False, "Cannot schedule lessons in the past"
        
        # Check minimum advance booking
        min_booking_time = now + timedelta(hours=ScheduleValidator.MIN_ADVANCE_BOOKING_HOURS)
        if start_time < min_booking_time:
            return False, f"Lessons must be booked at least {ScheduleValidator.MIN_ADVANCE_BOOKING_HOURS} hours in advance"
        
        # Check maximum advance booking
        max_booking_time = now + timedelta(days=ScheduleValidator.MAX_ADVANCE_BOOKING_DAYS)
        if start_time > max_booking_time:
            return False, f"Cannot book lessons more than {ScheduleValidator.MAX_ADVANCE_BOOKING_DAYS} days in advance"
        
        return True, None
    
    @staticmethod
    def validate_weekend_scheduling(start_time: datetime) -> Tuple[bool, Optional[str]]:
        """
        Validate weekend scheduling rules.
        
        Args:
            start_time: Lesson start time
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Sunday is 6 in Python's weekday() (Monday is 0)
        if start_time.weekday() == 6:  # Sunday
            return False, "Lessons are not available on Sundays"
        
        # Optional: Different hours for Saturday
        if start_time.weekday() == 5:  # Saturday
            if start_time.hour < 8 or start_time.hour >= 17:
                return False, "Saturday lessons are only available between 8:00 AM and 5:00 PM"
        
        return True, None
    
    @staticmethod
    async def check_instructor_availability(
        instructor_id: str,
        start_time: datetime,
        end_time: datetime,
        db_session,
        exclude_lesson_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if instructor is available for the time slot.
        
        Args:
            instructor_id: Instructor ID
            start_time: Lesson start time
            end_time: Lesson end time
            db_session: Database session
            exclude_lesson_id: Lesson ID to exclude (for updates)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        from sqlmodel import select, or_, and_
        from app.models.lesson import Lesson
        
        # Add break time buffer
        buffer_start = start_time - timedelta(minutes=ScheduleValidator.MIN_BREAK_MINUTES)
        buffer_end = end_time + timedelta(minutes=ScheduleValidator.MIN_BREAK_MINUTES)
        
        # Query for conflicting lessons
        statement = select(Lesson).where(
            Lesson.instructor_id == instructor_id,
            Lesson.status.in_(['scheduled', 'in_progress']),
            or_(
                # New lesson starts during existing lesson
                and_(Lesson.start_time <= buffer_start, Lesson.end_time > buffer_start),
                # New lesson ends during existing lesson
                and_(Lesson.start_time < buffer_end, Lesson.end_time >= buffer_end),
                # New lesson completely contains existing lesson
                and_(Lesson.start_time >= buffer_start, Lesson.end_time <= buffer_end)
            )
        )
        
        if exclude_lesson_id:
            statement = statement.where(Lesson.id != exclude_lesson_id)
        
        result = await db_session.execute(statement)
        conflicts = result.scalars().all()
        
        if conflicts:
            return False, "Instructor is not available at this time (including required break time)"
        
        return True, None
    
    @staticmethod
    async def check_vehicle_availability(
        vehicle_id: str,
        start_time: datetime,
        end_time: datetime,
        db_session,
        exclude_lesson_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if vehicle is available for the time slot.
        
        Args:
            vehicle_id: Vehicle ID
            start_time: Lesson start time
            end_time: Lesson end time
            db_session: Database session
            exclude_lesson_id: Lesson ID to exclude (for updates)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        from sqlmodel import select, or_, and_
        from app.models.lesson import Lesson
        
        # Query for conflicting lessons
        statement = select(Lesson).where(
            Lesson.vehicle_id == vehicle_id,
            Lesson.status.in_(['scheduled', 'in_progress']),
            or_(
                and_(Lesson.start_time <= start_time, Lesson.end_time > start_time),
                and_(Lesson.start_time < end_time, Lesson.end_time >= end_time),
                and_(Lesson.start_time >= start_time, Lesson.end_time <= end_time)
            )
        )
        
        if exclude_lesson_id:
            statement = statement.where(Lesson.id != exclude_lesson_id)
        
        result = await db_session.execute(statement)
        conflicts = result.scalars().all()
        
        if conflicts:
            return False, "Vehicle is not available at this time"
        
        return True, None
    
    @staticmethod
    async def validate_schedule(
        start_time: datetime,
        end_time: datetime,
        instructor_id: str,
        vehicle_id: Optional[str],
        db_session,
        exclude_lesson_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Comprehensive schedule validation.
        
        Args:
            start_time: Lesson start time
            end_time: Lesson end time
            instructor_id: Instructor ID
            vehicle_id: Vehicle ID (optional for theory lessons)
            db_session: Database session
            exclude_lesson_id: Lesson ID to exclude (for updates)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Validate business hours
        is_valid, error = ScheduleValidator.validate_business_hours(start_time, end_time)
        if not is_valid:
            return False, error
        
        # Validate lesson duration
        is_valid, error = ScheduleValidator.validate_lesson_duration(start_time, end_time)
        if not is_valid:
            return False, error
        
        # Validate advance booking
        is_valid, error = ScheduleValidator.validate_advance_booking(start_time)
        if not is_valid:
            return False, error
        
        # Validate weekend scheduling
        is_valid, error = ScheduleValidator.validate_weekend_scheduling(start_time)
        if not is_valid:
            return False, error
        
        # Check instructor availability
        is_valid, error = await ScheduleValidator.check_instructor_availability(
            instructor_id, start_time, end_time, db_session, exclude_lesson_id
        )
        if not is_valid:
            return False, error
        
        # Check vehicle availability (if vehicle is required)
        if vehicle_id:
            is_valid, error = await ScheduleValidator.check_vehicle_availability(
                vehicle_id, start_time, end_time, db_session, exclude_lesson_id
            )
            if not is_valid:
                return False, error
        
        return True, None
