from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.room import (
    RoomCreate,
    RoomResponse
)
from app.services.room_service import (
    create_room,
    get_rooms,
    join_room
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)


@router.post(
    "/",
    response_model=RoomResponse
)
async def create_new_room(
    room: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created_room = await create_room(
        db,
        room,
        current_user
    )

    if not created_room:
        raise HTTPException(
            status_code=400,
            detail="Room already exists"
        )

    return created_room


@router.get(
    "/",
    response_model=list[RoomResponse]
)
async def list_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_rooms(db)


@router.post("/{room_id}/join")
async def join_existing_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await join_room(
        db,
        room_id,
        current_user
    )

    if result == "room_not_found":
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if result == "already_joined":
        raise HTTPException(
            status_code=400,
            detail="Already joined"
        )

    return {
        "message": "Joined room successfully"
    }