from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str
    description: str | None = None
    is_private: bool = False


class RoomResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_private: bool

    class Config:
        from_attributes = True