# backend/app/core/config.py

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    APP_NAME: str = "Audio Emotion Detection API"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # File Upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = [".mp3", ".wav"]

    # Model Configuration
    DEFAULT_SEGMENT_DURATION: int = 30  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()