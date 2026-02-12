import asyncio
from sqlmodel import select
from app.core.db import engine, init_db
from app.models.user import User, UserRole
from app.models.course import Course, CourseBase
from app.models.profile import Profile
from app.core.security import get_password_hash
from app.core.db import AsyncSession
from sqlalchemy.orm import sessionmaker

async def seed_data():
    print("Beginning database seeding...")
    
    async_session = sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # 1. Create Admins
        admin_data = [
            {"email": "admin@example.com", "password": "Admin@123", "name": "Admin User", "nid": "01010101"},
            {"email": "admin@idsms.com", "password": "Admin@123", "name": "System Admin", "nid": "02020202"},
        ]
        
        for a_data in admin_data:
            # Upsert User
            result = await session.execute(select(User).where(User.email == a_data["email"]))
            user = result.scalars().first()
            if not user:
                user = User(
                    email=a_data["email"],
                    hashed_password=get_password_hash(a_data["password"]),
                    full_name=a_data["name"],
                    role=UserRole.ADMIN,
                    is_active=True
                )
                session.add(user)
                await session.flush()
                print(f"Created Admin user: {a_data['email']}")
            else:
                user.hashed_password = get_password_hash(a_data["password"])
                session.add(user)
                print(f"Updated password for user: {a_data['email']}")
            
            # Upsert Profile
            result = await session.execute(select(Profile).where(Profile.user_id == user.id))
            profile = result.scalars().first()
            if not profile:
                # Check if NID is taken
                nid_result = await session.execute(select(Profile).where(Profile.national_id == a_data["nid"]))
                if not nid_result.scalars().first():
                    profile = Profile(
                        user_id=user.id,
                        phone_number="+254700000000",
                        national_id=a_data["nid"],
                        address="IDSMS HQ",
                        city="Nairobi"
                    )
                    session.add(profile)
                    print(f"Created profile for Admin: {a_data['email']}")
        
        # 2. Create Instructor
        instructor_data = {"email": "instructor@idsms.com", "password": "Password@123", "name": "John Doe (Instructor)", "nid": "11111111"}
        result = await session.execute(select(User).where(User.email == instructor_data["email"]))
        instructor = result.scalars().first()
        if not instructor:
            instructor = User(
                email=instructor_data["email"],
                hashed_password=get_password_hash(instructor_data["password"]),
                full_name=instructor_data["name"],
                role=UserRole.INSTRUCTOR,
                is_active=True
            )
            session.add(instructor)
            await session.flush()
            print("Created Instructor user.")
        else:
            instructor.hashed_password = get_password_hash(instructor_data["password"])
            session.add(instructor)
            print("Updated Instructor password.")
        
        # Instructor Profile
        result = await session.execute(select(Profile).where(Profile.user_id == instructor.id))
        if not result.scalars().first():
            profile = Profile(
                user_id=instructor.id,
                phone_number="+254711111111",
                national_id=instructor_data["nid"],
                license_number="DL-123456",
                address="Upper Hill",
                city="Nairobi"
            )
            session.add(profile)
            print("Created Instructor profile.")

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
