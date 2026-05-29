from dataclasses import dataclass
import os

from dotenv import load_dotenv


load_dotenv()


def _get_required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}"
        )

    return value


def _get_csv_env(name: str, default: str = "") -> list[str]:
    raw_value = os.getenv(name, default)

    return [
        value.strip()
        for value in raw_value.split(",")
        if value.strip()
    ]


def _get_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)

    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError as exc:
        raise RuntimeError(
            f"{name} must be an integer"
        ) from exc


@dataclass(frozen=True)
class Settings:
    app_env: str
    database_url: str
    jwt_secret: str
    algorithm: str
    access_token_expire_minutes: int
    frontend_url: str
    backend_cors_origins: list[str]
    websocket_allowed_origins: list[str]
    openai_api_key: str | None
    websocket_message_rate_limit: int
    websocket_rate_limit_window_seconds: int
    websocket_max_message_length: int
    ollama_generate_url: str
    login_rate_limit: str
    register_rate_limit: str
    message_rate_limit: str
    ai_rate_limit: str
    embedding_model_name: str
    ollama_timeout_seconds: int
    memory_min_importance_score: int
    memory_min_content_length: int
    memory_max_content_length: int
    openai_model: str
    openai_embedding_model: str


def load_settings() -> Settings:
    jwt_secret = (
        os.getenv("JWT_SECRET")
        or os.getenv("SECRET_KEY")
    )

    if not jwt_secret:
        raise RuntimeError(
            "Missing required environment variable: JWT_SECRET"
        )

    frontend_url = _get_required_env(
        "FRONTEND_URL"
    )

    cors_origins = _get_csv_env(
        "BACKEND_CORS_ORIGINS",
        frontend_url
    )

    websocket_origins = _get_csv_env(
        "WEBSOCKET_ALLOWED_ORIGINS",
        ",".join(cors_origins)
    )

    if "*" in cors_origins:
        raise RuntimeError(
            "BACKEND_CORS_ORIGINS cannot include '*'"
        )

    if "*" in websocket_origins:
        raise RuntimeError(
            "WEBSOCKET_ALLOWED_ORIGINS cannot include '*'"
        )

    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        database_url=_get_required_env("DATABASE_URL"),
        jwt_secret=jwt_secret,
        algorithm=os.getenv("ALGORITHM", "HS256"),
        access_token_expire_minutes=_get_int_env(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            60
        ),
        frontend_url=frontend_url,
        backend_cors_origins=cors_origins,
        websocket_allowed_origins=websocket_origins,
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        websocket_message_rate_limit=_get_int_env(
            "WEBSOCKET_MESSAGE_RATE_LIMIT",
            15
        ),
        websocket_rate_limit_window_seconds=_get_int_env(
            "WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS",
            10
        ),
        websocket_max_message_length=_get_int_env(
            "WEBSOCKET_MAX_MESSAGE_LENGTH",
            5000
        ),
        ollama_generate_url=_get_required_env(
            "OLLAMA_GENERATE_URL"
        ),
        login_rate_limit=os.getenv(
            "LOGIN_RATE_LIMIT",
            "5/minute"
        ),
        register_rate_limit=os.getenv(
            "REGISTER_RATE_LIMIT",
            "3/minute"
        ),
        message_rate_limit=os.getenv(
            "MESSAGE_RATE_LIMIT",
            "30/minute"
        ),
        ai_rate_limit=os.getenv(
            "AI_RATE_LIMIT",
            "10/minute"
        ),
        embedding_model_name=os.getenv(
            "EMBEDDING_MODEL_NAME",
            "all-MiniLM-L6-v2"
        ),
        ollama_timeout_seconds=_get_int_env(
            "OLLAMA_TIMEOUT_SECONDS",
            3000
        ),
        memory_min_importance_score=_get_int_env(
            "MEMORY_MIN_IMPORTANCE_SCORE",
            3
        ),
        memory_min_content_length=_get_int_env(
            "MEMORY_MIN_CONTENT_LENGTH",
            24
        ),
        memory_max_content_length=_get_int_env(
            "MEMORY_MAX_CONTENT_LENGTH",
            4000
        ),
        openai_model=os.getenv(
            "OPENAI_MODEL",
            "gpt-4o-mini"
        ),
        openai_embedding_model=os.getenv(
            "OPENAI_EMBEDDING_MODEL",
            "text-embedding-3-small"
        )
    )


settings = load_settings()

DATABASE_URL = settings.database_url
APP_ENV = settings.app_env
SECRET_KEY = settings.jwt_secret
JWT_SECRET = settings.jwt_secret
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = (
    settings.access_token_expire_minutes
)
FRONTEND_URL = settings.frontend_url
BACKEND_CORS_ORIGINS = settings.backend_cors_origins
WEBSOCKET_ALLOWED_ORIGINS = (
    settings.websocket_allowed_origins
)
OPENAI_API_KEY = settings.openai_api_key
OLLAMA_GENERATE_URL = settings.ollama_generate_url
LOGIN_RATE_LIMIT = settings.login_rate_limit
REGISTER_RATE_LIMIT = settings.register_rate_limit
MESSAGE_RATE_LIMIT = settings.message_rate_limit
AI_RATE_LIMIT = settings.ai_rate_limit
EMBEDDING_MODEL_NAME = settings.embedding_model_name
OLLAMA_TIMEOUT_SECONDS = settings.ollama_timeout_seconds
MEMORY_MIN_IMPORTANCE_SCORE = (
    settings.memory_min_importance_score
)
MEMORY_MIN_CONTENT_LENGTH = settings.memory_min_content_length
MEMORY_MAX_CONTENT_LENGTH = settings.memory_max_content_length
OPENAI_MODEL = settings.openai_model
OPENAI_EMBEDDING_MODEL = settings.openai_embedding_model