from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room_memory import (
    RoomMemory
)

from app.services.ai.embedding_service import (
    generate_embedding
)


async def create_room_memory(
    db: AsyncSession,
    room_id: int,
    created_by: int,
    content: str,
    memory_type: str = "note"
):

    embedding = generate_embedding(
        content
    )

    memory = RoomMemory(

        room_id=room_id,

        created_by=created_by,

        content=content,

        memory_type=memory_type,

        embedding=embedding
    )

    db.add(memory)

    await db.commit()

    await db.refresh(memory)

    return memory