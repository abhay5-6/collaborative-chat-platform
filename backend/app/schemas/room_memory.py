from pydantic import BaseModel
from datetime import datetime


class RoomMemoryCreate(
    BaseModel
):

    content: str

    memory_type: str = "note"


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