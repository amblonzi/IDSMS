from pydantic_settings import BaseSettings
from typing import ClassVar

class Settings(BaseSettings):
    PROJECT_NAME: str = "IDSMS - Inphora Driving School Management System"
    DATABASE_URL: str
    SECRET_KEY: str = "change_this_to_a_secure_random_string_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ClassVar to avoid pydantic validation for internal config
    Config: ClassVar[dict] = {"env_file": ".env", "case_sensitive": True}

settings = Settings()
