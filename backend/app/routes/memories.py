from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.db.session import get_db

from app.schemas.room_memory import (
    RoomMemoryCreate,
    RoomMemoryResponse
)

from app.services.ai.memory_service import (
    create_room_memory
)

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User


router = APIRouter(
    prefix="/rooms",
    tags=["Memories"]
)


@router.post(
    "/{room_id}/memories",
    response_model=RoomMemoryResponse
)
async def add_room_memory(
    room_id: int,
    memory: RoomMemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    created_memory = (
        await create_room_memory(

            db=db,

            room_id=room_id,

            created_by=current_user.id,

            content=memory.content,

            memory_type=memory.memory_type
        )
    )

    return created_memory