from fastapi import APIRouter
from app.api import auth, users, courses, vehicles, lessons, payments

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
