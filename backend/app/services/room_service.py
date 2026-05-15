from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room
from app.schemas.room import RoomCreate

from app.models.membership import RoomMembership
from app.models.user import User



async def create_room(
    db: AsyncSession,
    room_data: RoomCreate,
    creator: User
):
    existing_room = await db.execute(
        select(Room).where(
            Room.name == room_data.name
        )
    )

    if existing_room.scalar():
        return None

    room = Room(
        name=room_data.name,
        description=room_data.description,
        is_private=room_data.is_private
    )

    db.add(room)

    await db.flush()

    membership = RoomMembership(
        user_id=creator.id,
        room_id=room.id
    )

    db.add(membership)

    await db.commit()

    await db.refresh(room)

    return room


async def get_rooms(
    db: AsyncSession
):
    result = await db.execute(
        select(Room)
    )

    return result.scalars().all()


async def join_room(
    db: AsyncSession,
    room_id: int,
    user: User
):
    room_result = await db.execute(
        select(Room).where(Room.id == room_id)
    )

    room = room_result.scalar()

    if not room:
        return "room_not_found"

    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    existing_membership = membership_result.scalar()

    if existing_membership:
        return "already_joined"

    membership = RoomMembership(
        user_id=user.id,
        room_id=room_id
    )

    db.add(membership)

    await db.commit()

    return "joined"