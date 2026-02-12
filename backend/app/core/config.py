from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "IDSMS - Inphora Driving School Management System"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    
    # Security - NO DEFAULTS, must be set via environment
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password Policy
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 5
    
    # Account Lockout
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@idsms.com"
    EMAILS_FROM_NAME: str = "IDSMS"
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 1
    FRONTEND_URL: str = "http://localhost:5173"
    
    # M-Pesa Configuration (Daraja API)
    MPESA_CONSUMER_KEY: str = "your_consumer_key"
    MPESA_CONSUMER_SECRET: str = "your_consumer_secret"
    MPESA_PASSKEY: str = "your_passkey"
    MPESA_SHORTCODE: str = "174379" # Default Sandbox Shortcode
    MPESA_CALLBACK_URL: str = "https://your-public-domain.com/api/payments/callback/mpesa"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    def validate_required_settings(self) -> None:
        """Validate that critical settings are properly configured"""
        if self.SECRET_KEY == "change_this_to_a_secure_random_string_in_production":
            raise ValueError("SECRET_KEY must be changed from default value!")
        
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long!")
        
        if self.ENVIRONMENT not in ["development", "staging", "production"]:
            raise ValueError(f"Invalid ENVIRONMENT: {self.ENVIRONMENT}")

settings = Settings()

# Validate settings on startup
if settings.ENVIRONMENT != "development":
    settings.validate_required_settings()
