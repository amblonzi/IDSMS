import asyncio
from sqlmodel import select
from app.core.db import engine, AsyncSession
from app.models.user import User
from app.models.audit_log import AuditLog
from sqlalchemy.orm import sessionmaker

async def check():
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        # Check users
        result = await session.execute(select(User))
        users = result.scalars().all()
        print("--- USERS ---")
        for u in users:
            hash_start = u.hashed_password[:10] if u.hashed_password else "None"
            print(f"Email: {u.email} | HashStart: {hash_start} | Active: {u.is_active} | Locked: {u.locked_until}")
        
        # Check recent failed login attempts
        result = await session.execute(
            select(AuditLog)
            .where(AuditLog.action == "login_failed")
            .order_by(AuditLog.created_at.desc())
            .limit(5)
        )
        logs = result.scalars().all()
        print("\n--- RECENT FAILED LOGINS ---")
        for l in logs:
            email = l.details.get('email') if l.details else 'N/A'
            reason = l.details.get('reason') if l.details else 'N/A'
            print(f"{l.created_at} | Email: {email} | Reason: {reason}")

if __name__ == "__main__":
    asyncio.run(check())
