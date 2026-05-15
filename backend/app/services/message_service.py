from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.membership import RoomMembership
from app.models.user import User
from app.schemas.message import MessageCreate


async def send_message(
    db: AsyncSession,
    room_id: int,
    user: User,
    message_data: MessageCreate
):
    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    membership = membership_result.scalar()

    if not membership:
        return None

    message = Message(
        content=message_data.content,
        sender_id=user.id,
        room_id=room_id
    )

    db.add(message)

    await db.commit()
    await db.refresh(message)

    return message


async def get_room_messages(
    db: AsyncSession,
    room_id: int,
    user: User
):
    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    membership = membership_result.scalar()

    if not membership:
        return None

    result = await db.execute(
        select(Message)
        .where(Message.room_id == room_id)
        .order_by(Message.created_at)
    )

    return result.scalars().all()

async def create_realtime_message(
    db: AsyncSession,
    room_id: int,
    user: User,
    content: str
):
    message = Message(
        content=content,
        sender_id=user.id,
        room_id=room_id
    )

    db.add(message)

    await db.commit()
    await db.refresh(message)

    return message