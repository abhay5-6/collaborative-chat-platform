from typing import List

from fastapi import (
    APIRouter,
    Depends,
    Request
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

from app.services.ai.embedding_service import (
    generate_embedding
)

from app.core.dependencies import (
    get_current_user
)

from app.core.config import settings

from app.core.rate_limit import limiter

from app.models.user import User

from app.services.ai.retrieval_service import (
    search_room_memories
)

from app.services.ai.ai_client import (
    generate_room_answer
)

from app.services.ai.hybrid_retrieval_service import (
    retrieve_context
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

    embedding = await generate_embedding(
        memory.content
    )

    created_memory = await create_room_memory(
        db=db,
        room_id=room_id,
        created_by=current_user.id,
        content=memory.content,
        embedding=embedding,
        memory_type=memory.memory_type,
        importance_score=memory.importance_score,
        tags=memory.tags,
    )

    await db.commit()

    return created_memory


@router.get(
    "/{room_id}/memories/search",
    response_model=List[RoomMemoryResponse]
)
@limiter.limit(settings.ai_rate_limit)
async def semantic_memory_search(
    request: Request,
    room_id: int,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    memories = await search_room_memories(
        db,
        room_id,
        query
    )

    return memories


@router.get("/{room_id}/search")
@limiter.limit(settings.ai_rate_limit)
async def hybrid_search(
    request: Request,
    room_id: int,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    result = await retrieve_context(
        db=db,
        room_id=room_id,
        query=query,
        memory_limit=5,
        message_limit=10
    )

    return result


@router.get(
    "/{room_id}/ai"
)
@limiter.limit(settings.ai_rate_limit)
async def room_ai_query(
    request: Request,
    room_id: int,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    answer = await generate_room_answer(
        db,
        room_id,
        query
    )

    return {
        "answer": answer
    }