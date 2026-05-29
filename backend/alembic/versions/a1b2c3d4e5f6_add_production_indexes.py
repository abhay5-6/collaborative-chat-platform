"""add production indexes

Revision ID: a1b2c3d4e5f6
Revises: 7d4c14fae102
Create Date: 2026-05-27 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "7d4c14fae102"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_messages_room_id",
        "messages",
        ["room_id"]
    )
    op.create_index(
        "ix_messages_sender_id",
        "messages",
        ["sender_id"]
    )
    op.create_index(
        "ix_messages_created_at",
        "messages",
        ["created_at"]
    )
    op.create_index(
        "ix_messages_room_created_at",
        "messages",
        ["room_id", "created_at"]
    )
    op.create_index(
        "ix_room_memories_room_id",
        "room_memories",
        ["room_id"]
    )
    op.create_index(
        "ix_room_memories_created_by",
        "room_memories",
        ["created_by"]
    )
    op.create_index(
        "ix_room_memories_created_at",
        "room_memories",
        ["created_at"]
    )
    op.create_index(
        "ix_room_memories_room_created_at",
        "room_memories",
        ["room_id", "created_at"]
    )
    op.create_index(
        "ix_collaborator_requests_sender_id",
        "collaborator_requests",
        ["sender_id"]
    )
    op.create_index(
        "ix_collaborator_requests_receiver_status",
        "collaborator_requests",
        ["receiver_id", "status"]
    )
    op.create_index(
        "ix_collaborator_requests_created_at",
        "collaborator_requests",
        ["created_at"]
    )


def downgrade() -> None:
    op.drop_index(
        "ix_collaborator_requests_created_at",
        table_name="collaborator_requests"
    )
    op.drop_index(
        "ix_collaborator_requests_receiver_status",
        table_name="collaborator_requests"
    )
    op.drop_index(
        "ix_collaborator_requests_sender_id",
        table_name="collaborator_requests"
    )
    op.drop_index(
        "ix_room_memories_room_created_at",
        table_name="room_memories"
    )
    op.drop_index(
        "ix_room_memories_created_at",
        table_name="room_memories"
    )
    op.drop_index(
        "ix_room_memories_created_by",
        table_name="room_memories"
    )
    op.drop_index(
        "ix_room_memories_room_id",
        table_name="room_memories"
    )
    op.drop_index(
        "ix_messages_room_created_at",
        table_name="messages"
    )
    op.drop_index(
        "ix_messages_created_at",
        table_name="messages"
    )
    op.drop_index(
        "ix_messages_sender_id",
        table_name="messages"
    )
    op.drop_index(
        "ix_messages_room_id",
        table_name="messages"
    )
