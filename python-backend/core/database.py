"""
Database configuration and connection management
"""
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData
import structlog

from .config import settings

logger = structlog.get_logger()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    """Base class for all database models"""
    metadata = MetaData()

async def init_db():
    """Initialize database tables"""
    try:
        async with engine.begin() as conn:
            # Import all models to register them
            from models import (
                user, domain, tld, staking, governance, 
                marketplace, ai, communication, satellite, 
                iot, audit, cst, analytics
            )
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def close_db():
    """Close database connections"""
    await engine.dispose()