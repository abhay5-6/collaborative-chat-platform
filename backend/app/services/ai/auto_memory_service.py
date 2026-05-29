from datetime import datetime
import logging

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
from app.core.config import (
    MEMORY_MAX_CONTENT_LENGTH,
    MEMORY_MIN_CONTENT_LENGTH,
    MEMORY_MIN_IMPORTANCE_SCORE
)


logger = logging.getLogger(__name__)


async def process_message_for_memory(

    db,

    room_id: int,

    user_id: int,

    message_content: str
):
    print("Processing message for memory in room_id:", room_id, "by user_id:", user_id)

    result = await (
        extract_memory_from_text(
            message_content
        )
    )

    logger.debug(
        "memory_extraction_result",
        extra={
            "room_id": room_id,
            "user_id": user_id,
            "should_store": result.get(
                "should_store"
            )
        }
    )

    if not result.get(
        "should_store"
    ):
        return None

    content = str(
        result.get("content", "")
    ).strip()

    importance_score = int(
        result.get("importance_score", 0)
    )

    if (
        len(content) < MEMORY_MIN_CONTENT_LENGTH
        or len(content) > MEMORY_MAX_CONTENT_LENGTH
        or importance_score < MEMORY_MIN_IMPORTANCE_SCORE
    ):
        logger.info(
            "memory_rejected_quality_threshold",
            extra={
                "room_id": room_id,
                "user_id": user_id,
                "content_length": len(content),
                "importance_score": importance_score
            }
        )
        return None

    embedding = generate_embedding(
        content
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

        await db.flush()

        return similar_memory

    memory = await (
        create_room_memory(

            db=db,

            room_id=room_id,

            created_by=user_id,

            content=content,

            memory_type=result[
                "memory_type"
            ],

            embedding=embedding,

            importance_score=importance_score,

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

            async with db.begin():

                await process_message_for_memory(

                    db=db,

                    room_id=room_id,

                    user_id=user_id,

                    message_content=message_content
                )

        except Exception:

            logger.exception(
                "background_memory_processing_failed",
                extra={
                    "room_id": room_id,
                    "user_id": user_id
                }
            )
        