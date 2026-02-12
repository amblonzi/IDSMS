"""
User validation utilities.

Validates user data including email, phone, and national ID.
"""
import re
from typing import Optional, Tuple


class UserValidator:
    """Validator for user-related operations."""
    
    @staticmethod
    def validate_email(email: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Validate email address format.
        
        Args:
            email: Email address to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not email:
            return True, None
        
        # Basic email regex pattern
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(pattern, email):
            return False, "Invalid email address format"
        
        # Check length
        if len(email) > 254:  # RFC 5321
            return False, "Email address is too long"
        
        # Check for common typos
        common_domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
        domain = email.split('@')[1].lower()
        
        # Warn about potential typos (but don't reject)
        typo_patterns = {
            'gmial.com': 'gmail.com',
            'gmai.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'outlok.com': 'outlook.com',
        }
        
        if domain in typo_patterns:
            return False, f"Did you mean {typo_patterns[domain]}?"
        
        return True, None
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
        """
        Validate Kenyan phone number.
        
        Args:
            phone: Phone number to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not phone:
            return False, "Phone number is required"
        
        # Remove spaces and common separators
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Kenyan phone number patterns
        patterns = [
            r'^254[17]\d{8}$',  # 254 format (12 digits)
            r'^0[17]\d{8}$',    # 0 format (10 digits)
            r'^\+254[17]\d{8}$', # +254 format
        ]
        
        if not any(re.match(pattern, cleaned) for pattern in patterns):
            return False, "Invalid Kenyan phone number. Use format: 254XXXXXXXXX or 07XXXXXXXX"
        
        return True, None
    
    @staticmethod
    def validate_national_id(national_id: str) -> Tuple[bool, Optional[str]]:
        """
        Validate Kenyan National ID number.
        
        Args:
            national_id: National ID to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not national_id:
            return False, "National ID is required"
        
        # Remove spaces and dashes
        cleaned = re.sub(r'[\s\-]', '', national_id)
        
        # Kenyan National ID is 7-8 digits
        if not re.match(r'^\d{7,8}$', cleaned):
            return False, "Invalid National ID format. Should be 7-8 digits"
        
        # Check for obviously invalid patterns
        if cleaned == '0' * len(cleaned):
            return False, "Invalid National ID number"
        
        return True, None
    
    @staticmethod
    def validate_name(name: str, field_name: str = "Name") -> Tuple[bool, Optional[str]]:
        """
        Validate person's name.
        
        Args:
            name: Name to validate
            field_name: Field name for error messages
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not name:
            return False, f"{field_name} is required"
        
        # Remove extra whitespace
        cleaned = ' '.join(name.split())
        
        # Check length
        if len(cleaned) < 2:
            return False, f"{field_name} is too short (minimum 2 characters)"
        
        if len(cleaned) > 100:
            return False, f"{field_name} is too long (maximum 100 characters)"
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-']+$", cleaned):
            return False, f"{field_name} contains invalid characters"
        
        # Check for excessive special characters
        if cleaned.count('-') > 2 or cleaned.count("'") > 2:
            return False, f"{field_name} has too many special characters"
        
        return True, None
    
    @staticmethod
    def validate_age(date_of_birth: str) -> Tuple[bool, Optional[str]]:
        """
        Validate age requirements for driving school.
        
        Args:
            date_of_birth: Date of birth in ISO format (YYYY-MM-DD)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        from datetime import datetime, timedelta
        
        if not date_of_birth:
            return False, "Date of birth is required"
        
        try:
            dob = datetime.fromisoformat(date_of_birth.replace('Z', '+00:00'))
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD"
        
        # Calculate age
        today = datetime.utcnow()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        
        # Minimum age for driving in Kenya is 18
        if age < 18:
            return False, "Must be at least 18 years old to enroll"
        
        # Maximum reasonable age (e.g., 100)
        if age > 100:
            return False, "Invalid date of birth"
        
        # Check if date is in the future
        if dob > today:
            return False, "Date of birth cannot be in the future"
        
        return True, None
    
    @staticmethod
    def validate_user_data(
        email: str,
        phone: str,
        first_name: str,
        last_name: str,
        national_id: Optional[str] = None,
        date_of_birth: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Comprehensive user data validation.
        
        Args:
            email: Email address
            phone: Phone number
            first_name: First name
            last_name: Last name
            national_id: National ID (optional)
            date_of_birth: Date of birth (optional)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Validate email
        is_valid, error = UserValidator.validate_email(email)
        if not is_valid:
            return False, error
        
        # Validate phone
        is_valid, error = UserValidator.validate_phone(phone)
        if not is_valid:
            return False, error
        
        # Validate first name
        is_valid, error = UserValidator.validate_name(first_name, "First name")
        if not is_valid:
            return False, error
        
        # Validate last name
        is_valid, error = UserValidator.validate_name(last_name, "Last name")
        if not is_valid:
            return False, error
        
        # Validate national ID if provided
        if national_id:
            is_valid, error = UserValidator.validate_national_id(national_id)
            if not is_valid:
                return False, error
        
        # Validate age if date of birth provided
        if date_of_birth:
            is_valid, error = UserValidator.validate_age(date_of_birth)
            if not is_valid:
                return False, error
        
        return True, None
