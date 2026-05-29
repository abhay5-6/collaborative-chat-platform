import logging

from openai import AsyncOpenAI

from app.core.config import (
    OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL,
)

logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    api_key=OPENAI_API_KEY
)


async def generate_embedding(
    text: str
):

    logger.info(
        "embedding_generation_started"
    )

    response = await client.embeddings.create(
        model=OPENAI_EMBEDDING_MODEL,
        input=text
    )

    embedding = (
        response.data[0]
        .embedding
    )

    logger.info(
        "embedding_generation_finished",
        extra={
            "dimensions": len(
                embedding
            )
        }
    )

    return embedding