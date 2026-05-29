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

    importance_score: int = 1,

    tags: list[str] | None = None,

    domain: str = "general",
):
    print("Creating new memory in room_id:", room_id, "with content length:", len(content))

    if tags is None:

        tags = []

    memory = RoomMemory(

        room_id=room_id,

        created_by=created_by,

        content=content,

        memory_type=memory_type,

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
    print("Memory created with id:", memory.id, "in room_id:", room_id)
