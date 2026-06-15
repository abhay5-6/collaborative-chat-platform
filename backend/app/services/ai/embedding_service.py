import logging

from google import genai

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_EMBEDDING_MODEL
)

logger = logging.getLogger(__name__)

client = genai.Client(
    api_key=GEMINI_API_KEY
)


async def generate_embedding(
    text: str
):

    logger.info(
        "embedding_generation_started"
    )

    response = await client.embeddings.create(
        model=GEMINI_EMBEDDING_MODEL,
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