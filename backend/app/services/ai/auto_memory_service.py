from datetime import datetime

from app.db.session import (
    AsyncSessionLocal
)

from app.services.ai.memory_extractor import (
    extract_memory_from_text
)

from app.services.ai.memory_service import (
    create_room_memory
)

from app.services.ai.embedding_service import (
    generate_embedding
)

from app.services.ai.memory_dedup_service import (
    find_similar_memory
)

from app.services.ai.memory_graph_service import (
    build_memory_relationships
)


async def process_message_for_memory(

    db,

    room_id: int,

    user_id: int,

    message_content: str
):

    result = await (
        extract_memory_from_text(
            message_content
        )
    )

    print(result)

    if not result.get(
        "should_store"
    ):
        return None

    embedding = generate_embedding(
        result["content"]
    )

    similar_memory = await (
        find_similar_memory(

            db,

            room_id,

            embedding
        )
    )

    if similar_memory:

        similar_memory.times_referenced += 1

        similar_memory.last_reinforced_at = (
            datetime.utcnow()
        )

        similar_memory.importance_score += 1

        await db.commit()

        return similar_memory

    memory = await (
        create_room_memory(

            db=db,

            room_id=room_id,

            created_by=user_id,

            content=result["content"],

            memory_type=result[
                "memory_type"
            ],

            embedding=embedding,

            importance_score=result[
                "importance_score"
            ],

            tags=result["tags"],

            domain=result["domain"]
        )
    )

    await build_memory_relationships(
        db,
        memory
    )

    return memory


async def process_memory_background(

    room_id: int,

    user_id: int,

    message_content: str
):

    async with AsyncSessionLocal() as db:

        try:

            await process_message_for_memory(

                db=db,

                room_id=room_id,

                user_id=user_id,

                message_content=message_content
            )

        except Exception as e:

            print(
                "BACKGROUND MEMORY ERROR:",
                e
            )