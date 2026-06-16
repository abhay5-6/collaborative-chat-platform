import asyncio
import logging
from functools import partial

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

    loop = asyncio.get_event_loop()
    embedding = await loop.run_in_executor(
        None,
        partial(model.encode, text)
    )
    embedding = embedding.tolist()

    logger.info(
        "embedding_generation_finished",
        extra={
            "dimensions": len(
                embedding
            )
        }
    )

    return embedding