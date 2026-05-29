from datetime import datetime

from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.db.database import Base


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_room_id", "room_id"),
        Index("ix_messages_sender_id", "sender_id"),
        Index("ix_messages_created_at", "created_at"),
        Index(
            "ix_messages_room_created_at",
            "room_id",
            "created_at"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id")
    )

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow
    )
