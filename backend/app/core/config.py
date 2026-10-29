import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LabCare AI"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./labcare.db"
    SECRET_KEY: str = "labcare-ai-super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Heartbeat & Monitoring
    HEARTBEAT_TIMEOUT_SECONDS: int = 90
    OFFLINE_THRESHOLD_SECONDS: int = 180
    METRIC_COLLECTION_INTERVAL_SECONDS: int = 15
    DEMO_MODE: bool = True
    
    # Warning Thresholds
    CPU_WARNING_THRESHOLD: float = 80.0
    CPU_SUSTAINED_MINUTES: int = 3
    RAM_WARNING_THRESHOLD: float = 85.0
    DISK_WARNING_THRESHOLD: float = 90.0
    FAILED_PING_THRESHOLD: int = 3
    
    # Optional LLM
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
