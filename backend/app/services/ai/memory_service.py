from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.models.room_memory import (
    RoomMemory
)


async def create_room_memory(

    db: AsyncSession,

    room_id: int,

    created_by: int,

    content: str,

    embedding: list[float],

    memory_type: str = "note",

    source_type: str = "message",

    source_id: int | None = None,

    importance_score: int = 1,

    tags: list[str] | None = None,

    domain: str = "general",
):

    if tags is None:
        tags = []

    memory = RoomMemory(

        room_id=room_id,

        created_by=created_by,

        content=content,

        memory_type=memory_type,

        source_type=source_type,

        source_id=source_id,

        importance_score=importance_score,

        access_count=0,

        tags=tags,

        embedding=embedding,

        domain=domain,
    )

    db.add(memory)

    await db.flush()

    await db.refresh(memory)

    return memory