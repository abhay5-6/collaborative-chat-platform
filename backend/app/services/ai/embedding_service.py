import logging

from sentence_transformers import SentenceTransformer

from app.core.config import EMBEDDING_MODEL_NAME


logger = logging.getLogger(__name__)
model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    global model

    if model is None:
        logger.info(
            "embedding_model_loading",
            extra={
                "model": EMBEDDING_MODEL_NAME
            }
        )
        model = SentenceTransformer(
            EMBEDDING_MODEL_NAME
        )

    return model


def generate_embedding(
    text: str
):
    embedding = get_embedding_model().encode(
        text
    )

    return embedding.tolist()
