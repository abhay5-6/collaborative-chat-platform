from datetime import datetime

from sqlalchemy import (
    ForeignKey,
    String,
    DateTime
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from app.db.database import Base


class CollaboratorRequest(Base):

    __tablename__ = (
        "collaborator_requests"
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    receiver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    status: Mapped[str] = mapped_column(
        String,
        default="pending"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )