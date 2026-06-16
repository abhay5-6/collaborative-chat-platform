from datetime import datetime
import logging

from app.db.session import AsyncSessionLocal

from app.models.message import Message

from app.services.ai.embedding_service import (
    generate_embedding
)

from app.services.ai.memory_extractor import (
    extract_memory_from_text
)

from app.services.ai.memory_service import (
    create_room_memory
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
    MEMORY_MIN_IMPORTANCE_SCORE,
)

logger = logging.getLogger(__name__)


async def process_message_for_memory(
    db,
    room_id: int,
    user_id: int,
    message_id: int,
    message_content: str,
):
    logger.info(
        "message_ingestion_started",
        extra={
            "room_id": room_id,
            "user_id": user_id,
            "message_id": message_id,
        },
    )

    if not message_content or not message_content.strip():
        return None

    # STEP 1 - Embed and persist message

    message_embedding = await generate_embedding(
        message_content
    )

    print(f"STEP 1 DONE: Message embedding generated (dims={len(message_embedding)})")

    message = await db.get(
        Message,
        message_id
    )

    if message:
        message.embedding = message_embedding

        await db.flush()

        logger.debug(
            "message_embedding_saved",
            extra={
                "message_id": message_id,
            },
        )
        print(f"STEP 1 DONE: Message embedding persisted")

    # STEP 2 - Extract memory candidate

    result = await extract_memory_from_text(
        message_content
    )

    print(f"STEP 2 DONE: Memory extraction result={result}")

    if not result:
        print("STEP 2: No memory extracted, returning")
        return None

    content = str(
        result.get(
            "content",
            "",
        )
    ).strip()

    importance_score = int(
        result.get(
            "importance_score",
            1,
        )
    )

    if (
        len(content)
        < MEMORY_MIN_CONTENT_LENGTH
    ):
        return None

    if (
        len(content)
        > MEMORY_MAX_CONTENT_LENGTH
    ):
        return None

    if (
        importance_score
        < MEMORY_MIN_IMPORTANCE_SCORE
    ):
        return None

    # STEP 3 - Generate memory embedding

    embedding = await generate_embedding(
        content
    )

    print(f"STEP 3 DONE: Memory embedding generated (dims={len(embedding)})")

    # STEP 4 - Deduplication / reinforcement

    similar_memory = await find_similar_memory(
        db=db,
        room_id=room_id,
        embedding=embedding,
    )

    print(f"STEP 4 DONE: Dedup check, similar_memory={similar_memory is not None}")

    if similar_memory:

        similar_memory.times_referenced += 1

        similar_memory.importance_score += 1

        similar_memory.last_reinforced_at = (
            datetime.utcnow()
        )

        await db.flush()

        logger.info(
            "memory_reinforced",
            extra={
                "room_id": room_id,
                "memory_id": similar_memory.id,
                "message_id": message_id,
            },
        )

        print(f"STEP 4: Memory reinforced (id={similar_memory.id})")
        return similar_memory

    # STEP 5 - Create new memory

    memory = await create_room_memory(
        db=db,
        room_id=room_id,
        created_by=user_id,
        content=content,
        memory_type=result.get(
            "memory_type",
            "note",
        ),
        source_type="message",
        source_id=message_id,
        embedding=embedding,
        importance_score=importance_score,
        tags=result.get(
            "tags",
            [],
        ),
        domain=result.get(
            "domain",
            "general",
        ),
    )

    print(f"STEP 5 DONE: Memory created (id={memory.id})")

    # STEP 6 - Build graph relationships

    await build_memory_relationships(
        db=db,
        new_memory=memory,
    )

    logger.info(
        "memory_created",
        extra={
            "room_id": room_id,
            "memory_id": memory.id,
            "message_id": message_id,
        },
    )

    print(f"STEP 6 DONE: Graph relationships built for memory (id={memory.id})")

    return memory

async def process_memory_background(
    room_id: int,
    user_id: int,
    message_id: int,
    message_content: str,
):
    print(f"BACKGROUND TASK STARTED: room_id={room_id}, user_id={user_id}, message_id={message_id}")

    async with AsyncSessionLocal() as db:

        try:

            async with db.begin():

                await process_message_for_memory(
                    db=db,
                    room_id=room_id,
                    user_id=user_id,
                    message_id=message_id,
                    message_content=message_content,
                )

            print(f"BACKGROUND TASK COMPLETED: room_id={room_id}, message_id={message_id}")

        except Exception as e:

            print(f"BACKGROUND TASK FAILED: {str(e)}")

            logger.exception(
                "background_memory_processing_failed",
                extra={
                    "room_id": room_id,
                    "user_id": user_id,
                    "message_id": message_id,
                },
            )