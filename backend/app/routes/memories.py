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

from app.services.ai.retrieval_service import (
    search_room_memories
)

from app.services.ai.ollama_service import (
    generate_room_answer
)

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

            memory_type=memory.memory_type,
            importance_score=memory.importance_score,
            tags=memory.tags,
        )
    )

    return created_memory

@router.get(
    "/{room_id}/memories/search"
)
async def semantic_memory_search(
    room_id: int,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    memories = await (
        search_room_memories(
            db,
            room_id,
            query
        )
    )

    return memories

@router.get(
    "/{room_id}/ai"
)
async def room_ai_query(
    room_id: int,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    answer = await (
        generate_room_answer(
            db,
            room_id,
            query
        )
    )

    return {
        "answer": answer
    }