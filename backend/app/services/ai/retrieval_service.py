from datetime import (
    datetime,
    timezone
)

from sqlalchemy import (
    select
)

from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.models.room_memory import (
    RoomMemory
)

from app.services.ai.embedding_service import (
    generate_embedding
)

from app.services.ai.memory_decay_service import (
    calculate_decay_factor
)

from app.services.ai.memory_resurfacing_service import (
    calculate_resurfacing_boost
)

from app.services.ai.consensus_service import (
    calculate_consensus_score
)


def calculate_recency_weight(
    created_at
):

    now = datetime.now(
        timezone.utc
    )

    if created_at.tzinfo is None:

        created_at = (
            created_at.replace(
                tzinfo=timezone.utc
            )
        )

    age_days = (
        now - created_at
    ).days

    if age_days <= 1:
        return 1.0

    elif age_days <= 7:
        return 0.8

    elif age_days <= 30:
        return 0.5

    return 0.2


async def search_room_memories(

    db: AsyncSession,

    room_id: int,

    query: str,

    top_k: int = 5
):
    print("Searching room memories for room_id:", room_id, "with query:", query)

    query_embedding =await(
        generate_embedding(query)
    )

    similarity_expr = (
        1 -
        RoomMemory.embedding.cosine_distance(
            query_embedding
        )
    ).label(
        "similarity"
    )

    stmt = (

        select(
            RoomMemory,
            similarity_expr
        )

        .where(
            RoomMemory.room_id
            == room_id
        )

        .order_by(
            RoomMemory.embedding.cosine_distance(
                query_embedding
            )
        )

        .limit(
            top_k * 5
        )
    )

    result = await db.execute(
        stmt
    )

    rows = result.all()

    scored_memories = []

    for memory, similarity in rows:

        if similarity is None:
            continue

        if similarity < 0.45:
            continue

        importance_weight = (
            memory.importance_score
            * 0.15
        )

        access_weight = min(

            memory.access_count
            * 0.02,

            0.3
        )

        recency_weight = (
            calculate_recency_weight(
                memory.created_at
            )
        )

        base_score = (

            similarity * 0.7

            +

            importance_weight * 0.15

            +

            access_weight * 0.1

            +

            recency_weight * 0.05
        )

        decay_factor = (
            calculate_decay_factor(
                memory
            )
        )

        resurfacing_boost = (
            calculate_resurfacing_boost(

                similarity,

                memory
            )
        )

        confidence_weight = getattr(

            memory,

            "confidence_score",

            1.0
        )

        consensus_score = (
            calculate_consensus_score(
                memory
            )
        )

        final_score = (

            base_score

            * decay_factor

            * resurfacing_boost

            * confidence_weight

            * consensus_score
        )

        scored_memories.append(

            (
                final_score,
                memory
            )
        )

    scored_memories.sort(

        key=lambda x: x[0],

        reverse=True
    )

    top_memories = [

        memory

        for _, memory in (
            scored_memories[:top_k]
        )
    ]

    for memory in top_memories:

        memory.access_count += 1

        memory.last_accessed_at = (
            datetime.utcnow()
        )

    await db.commit()

    return top_memories
    print("Completed searching room memories for room_id:", room_id, "with query:", query, "retrieved memories count:", len(top_memories))