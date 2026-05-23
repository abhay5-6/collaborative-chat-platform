from sqlalchemy import (
    Integer,
    ForeignKey,
    Text,
    String,
    DateTime,
    JSON
)

from datetime import datetime

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.db.database import Base


class RoomMemory(Base):

    __tablename__ = "room_memories"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id")
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    content: Mapped[str] = mapped_column(
        Text
    )

    memory_type: Mapped[str] = mapped_column(
        String(50),
        default="note"
    )

    embedding: Mapped[list] = mapped_column(
        JSON
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )