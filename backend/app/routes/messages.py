import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.message import (
    MessageCreate,
    MessageResponse
)
from app.services.message_service import (
    send_message,
    get_room_messages
)
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/rooms",
    tags=["Messages"]
)
from app.services.ai.auto_memory_service import (
    process_memory_background
)
from fastapi import BackgroundTasks

@router.post(
    "/{room_id}/messages",
    response_model=MessageResponse
)
async def create_message(

    room_id: int,

    message: MessageCreate,

    background_tasks: BackgroundTasks,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):

    created_message = await send_message(

        db,

        room_id,

        current_user,

        message
    )

    if not created_message:

        raise HTTPException(

            status_code=403,

            detail=(
                "You are not a member "
                "of this room"
            )
        )

    background_tasks.add_task(

        process_memory_background,

        room_id,

        current_user.id,

        message.content
    )

    return created_message
@router.get(
    "/{room_id}/messages",
    response_model=list[MessageResponse]
)
async def list_room_messages(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = await get_room_messages(
        db,
        room_id,
        current_user
    )

    if messages is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this room"
        )

    return messages