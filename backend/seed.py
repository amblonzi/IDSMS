import asyncio
from sqlmodel import select
from app.core.db import engine, init_db
from app.models.user import User, UserRole
from app.models.course import Course, CourseBase
from app.core.security import get_password_hash
from app.core.db import AsyncSession
from sqlalchemy.orm import sessionmaker

async def seed_data():
    print("Beginning database seeding...")
    
    # Re-create tables (Optional: caution in prod)
    # await init_db() 
    
    async_session = sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # 1. Create Admin
        result = await session.execute(select(User).where(User.email == "admin@idsms.com"))
        if not result.scalars().first():
            admin = User(
                email="admin@idsms.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin)
            print("Created Admin user.")

        # 2. Create Instructor
        result = await session.execute(select(User).where(User.email == "instructor@idsms.com"))
        if not result.scalars().first():
            instructor = User(
                email="instructor@idsms.com",
                hashed_password=get_password_hash("password123"),
                full_name="John Doe (Instructor)",
                role=UserRole.INSTRUCTOR,
                is_active=True
            )
            session.add(instructor)
            print("Created Instructor user.")

        # 3. Create Courses
        courses_data = [
             {"name": "Class B (Light Vehicle)", "price": 15000, "duration_weeks": 4, "description": "Standard driving course for light vehicles."},
             {"name": "Class C (Light Truck)", "price": 18000, "duration_weeks": 5, "description": "Commercial light truck driving course."},
             {"name": "Class A (Motorcycle)", "price": 8000, "duration_weeks": 2, "description": "Motorcycle riding and safety course."},
        ]
        
        for c_data in courses_data:
            result = await session.execute(select(Course).where(Course.name == c_data["name"]))
            if not result.scalars().first():
                course = Course(**c_data)
                session.add(course)
                print(f"Created course: {c_data['name']}")

        await session.commit()
        print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
