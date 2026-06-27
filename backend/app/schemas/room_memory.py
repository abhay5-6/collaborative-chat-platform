from pydantic import BaseModel, field_validator
from datetime import datetime, timezone


class RoomMemoryCreate(
    BaseModel
):

    content: str

    memory_type: str = "note"

    importance_score: int = 1

    tags: list[str] = []


class RoomMemoryResponse(
    BaseModel
):

    id: int

    room_id: int

    created_by: int

    content: str

    memory_type: str

    created_at: datetime

    @field_validator("created_at", mode="after")
    @classmethod
    def ensure_tz(cls, v: datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:

        from_attributes = True


class SearchMessage(
    BaseModel
):

    type: str

    id: int

    content: str

    created_at: datetime

    score: float

    @field_validator("created_at", mode="after")
    @classmethod
    def ensure_tz(cls, v: datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class SearchResult(
    BaseModel
):

    messages: list[
        SearchMessage
    ]

    memories: list[
        RoomMemoryResponse
    ]