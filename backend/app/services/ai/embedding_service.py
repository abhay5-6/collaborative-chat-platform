import logging

from sentence_transformers import (
    SentenceTransformer
)

logger = logging.getLogger(__name__)

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


async def generate_embedding(
    text: str
):
    logger.info(
        "embedding_generation_started"
    )

    embedding = (
        model.encode(text)
        .tolist()
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