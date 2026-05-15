from sqlalchemy import ForeignKey
from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.db.database import Base


class RoomMembership(Base):
    __tablename__ = "room_memberships"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id")
    )