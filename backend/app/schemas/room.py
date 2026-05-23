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

    owner_id: int

    is_member: bool

    role: str | None = None

    class Config:
        from_attributes = True

class RoomMemberResponse(BaseModel):

    user_id: int

    username: str

    role: str