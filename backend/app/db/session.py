from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator
from app.config import settings

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import UUID, JSONB

@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "VARCHAR(36)"

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

# Create async engine with settings configuration
engine_args = {"future": True, "echo": settings.DEBUG}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite compatibility arguments
    engine_args["connect_args"] = {"timeout": 30}
else:
    # Postgres specific pooling settings
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_args
)

# Create session maker for active connections
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency generator to retrieve an active database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
