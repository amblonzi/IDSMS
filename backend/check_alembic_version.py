from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:postgres@db:5432/driving_school_db"

def check_version():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            print(f"Current Alembic Version: {version}")
        except Exception as e:
            print(f"Error checking version: {e}")

if __name__ == "__main__":
    check_version()
