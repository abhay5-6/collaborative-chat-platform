from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.models.room_memory import (
    RoomMemory
)
from sqlalchemy import select
from datetime import datetime, timedelta


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

async def get_stale_memories(db: AsyncSession, room_id: int, days_old: int = 30):
    threshold_date = datetime.utcnow() - timedelta(days=days_old)
    query = select(RoomMemory).where(
        RoomMemory.room_id == room_id,
        RoomMemory.last_reinforced_at < threshold_date
    ).order_by(RoomMemory.last_reinforced_at.asc())
    
    result = await db.execute(query)
    return result.scalars().all()

async def reinforce_memory(db: AsyncSession, memory_id: int):
    query = select(RoomMemory).where(RoomMemory.id == memory_id)
    result = await db.execute(query)
    memory = result.scalars().first()
    if memory:
        memory.last_reinforced_at = datetime.utcnow()
        memory.confidence_score = min(1.0, memory.confidence_score + 0.2)
        await db.commit()
    return memory

async def delete_memory(db: AsyncSession, memory_id: int):
    query = select(RoomMemory).where(RoomMemory.id == memory_id)
    result = await db.execute(query)
    memory = result.scalars().first()
    if memory:
        await db.delete(memory)
        await db.commit()
        return True
    return False