from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create Async Engine
# echo=True enables SQL logging, turn off for production
engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

async def get_session() -> AsyncSession:
    """
    Dependency to get an async database session.
    """
    async_session = sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

async def init_db():
    """
    Initialize database - usually used for initial creation or tests.
    In production, use Alembic.
    """
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.create_all)
        pass
