import logging

from sentence_transformers import SentenceTransformer

from app.core.config import EMBEDDING_MODEL_NAME


logger = logging.getLogger(__name__)
model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    global model
    print("Loading embedding model:", EMBEDDING_MODEL_NAME)

    if model is None:
        print("Loading embedding model:", EMBEDDING_MODEL_NAME)
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
    print("Generating embedding for text:", text)
    embedding = get_embedding_model().encode(
        text,
        normalize_embeddings=True
    )
    print(
    "Model object id:",
        id(model)
    )

    return embedding.tolist()
