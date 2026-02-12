from fastapi import APIRouter
from app.api import auth, users, courses, vehicles, lessons, payments, onboarding, instructor, analytics, settings, assessments, curriculum

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(instructor.router, prefix="/instructor", tags=["instructor"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(curriculum.router, prefix="/curriculum", tags=["curriculum"])

