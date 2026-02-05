from typing import Annotated, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import db
from app.models.vehicle import Vehicle, VehicleCreate, VehicleRead
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=VehicleRead)
async def create_vehicle(
    vehicle: VehicleCreate,
    session: Annotated[AsyncSession, Depends(db.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)]
):
    """
    Register a new vehicle (Admin only).
    """
    db_vehicle = Vehicle.model_validate(vehicle)
    session.add(db_vehicle)
    await session.commit()
    await session.refresh(db_vehicle)
    return db_vehicle

@router.get("/", response_model=List[VehicleRead])
async def read_vehicles(
    session: Annotated[AsyncSession, Depends(db.get_session)],
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True
):
    """
    List vehicles.
    """
    query = select(Vehicle)
    if active_only:
        query = query.where(Vehicle.is_active == True)
    
    result = await session.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{vehicle_id}", response_model=VehicleRead)
async def read_vehicle(
    vehicle_id: UUID,
    session: Annotated[AsyncSession, Depends(db.get_session)]
):
    """
    Get vehicle details.
    """
    vehicle = await session.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
