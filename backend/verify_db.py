import asyncio
from app.core.security import verify_password
from app.core.db import engine, AsyncSession
from app.models.user import User
from sqlmodel import select
from sqlalchemy.orm import sessionmaker

async def verify():
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            match = verify_password("Admin@123", u.hashed_password)
            print(f"User: {u.email} | Matches 'Admin@123': {match}")
            if not match:
                match_old = verify_password("admin123", u.hashed_password)
                print(f"  Matches 'admin123': {match_old}")

if __name__ == "__main__":
    asyncio.run(verify())
