"""Database models and connection logic."""

from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to provide a DB session."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
