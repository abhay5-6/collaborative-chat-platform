from datetime import datetime

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.db.database import Base


class Message(Base):
    __tablename__ = "messages"

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