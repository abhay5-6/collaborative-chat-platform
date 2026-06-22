from pydantic import BaseModel
from datetime import datetime


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


class SearchResult(
    BaseModel
):

    messages: list[
        SearchMessage
    ]

    memories: list[
        RoomMemoryResponse
    ]