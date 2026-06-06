from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import socket
import logging

logger = logging.getLogger("SuRakshaSentinel.Config")

def is_postgres_running() -> bool:
    try:
        s = socket.socket()
        s.settimeout(0.5)
        s.connect(("localhost", 5432))
        s.close()
        return True
    except Exception:
        return False

# Establish default database URL
db_url = "postgresql+asyncpg://postgres:postgres@localhost:5432/suraksha_sentinel"
if not is_postgres_running():
    db_url = "sqlite+aiosqlite:///./suraksha_sentinel.db"
    logger.warning("PostgreSQL port 5432 not reachable. Falling back to local SQLite: %s", db_url)

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "SuRaksha Sentinel"
    ENV: str = "development"
    DEBUG: bool = True
    
    # Security & Auth
    SECRET_KEY: str = Field(default="SUPER_SECRET_REGLOOP_JWT_KEY_MIN_32_CHARS_LONG", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = Field(
        default=db_url,
        env="DATABASE_URL"
    )

    # AI Layer
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")

    # Object Storage (S3 / MinIO)
    S3_ENDPOINT: Optional[str] = Field(default="http://localhost:9000", env="S3_ENDPOINT")
    S3_ACCESS_KEY: Optional[str] = Field(default="minioadmin", env="S3_ACCESS_KEY")
    S3_SECRET_KEY: Optional[str] = Field(default="minioadmin", env="S3_SECRET_KEY")
    S3_BUCKET_NAME: str = Field(default="suraksha-sentinel-vault", env="S3_BUCKET_NAME")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

