from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.membership import RoomMembership
from app.models.user import User
from app.models.room import Room
from app.schemas.message import MessageCreate


async def has_room_access(
    db: AsyncSession,
    room_id: int,
    user: User
):

    room_result = await db.execute(
        select(Room).where(
            Room.id == room_id
        )
    )

    room = room_result.scalar()

    if not room:
        return False

    # PUBLIC ROOM
    if not room.is_private:
        return True

    # PRIVATE ROOM

    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    membership = membership_result.scalar()

    return membership is not None


async def send_message(
    db: AsyncSession,
    room_id: int,
    user: User,
    message_data: MessageCreate
):

    allowed = await has_room_access(
        db,
        room_id,
        user
    )

    if not allowed:
        return None

    message = Message(
        content=message_data.content,
        sender_id=user.id,
        room_id=room_id
    )

    db.add(message)

    await db.flush()

    await db.refresh(message)
    
    return message


async def get_room_messages(
    db: AsyncSession,
    room_id: int,
    user: User,
    limit: int = 50,
    offset: int = 0
):

    allowed = await has_room_access(
        db,
        room_id,
        user
    )

    if not allowed:
        return None

    result = await db.execute(

        select(Message, User)
        .join(
            User,
            Message.sender_id == User.id
        )
        .where(
            Message.room_id == room_id
        )
        .order_by(
            Message.created_at
        )
        .offset(offset)
        .limit(limit)
    )

    messages = result.all()

    formatted_messages = []

    for message, sender in messages:

        formatted_messages.append({

            "id": message.id,

            "content": message.content,

            "sender_id": message.sender_id,

            "room_id": message.room_id,

            "created_at":
                message.created_at,

            "username":
                sender.username
        })

    return formatted_messages


async def create_realtime_message(
    db: AsyncSession,
    room_id: int,
    user: User,
    content: str
):

    allowed = await has_room_access(
        db,
        room_id,
        user
    )

    if not allowed:
        return None

    message = Message(
        content=content,
        sender_id=user.id,
        room_id=room_id
    )

    db.add(message)

    await db.flush()

    await db.refresh(message)

 

    return message
