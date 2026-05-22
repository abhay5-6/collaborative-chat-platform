from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room
from app.schemas.room import RoomCreate

from app.models.membership import RoomMembership
from app.models.user import User
from app.models.message import Message

from app.models.join_request import (
    RoomJoinRequest
)




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
        is_private=room_data.is_private,
        owner_id=creator.id
    )

    db.add(room)

    await db.flush()

    membership = RoomMembership(
        user_id=creator.id,
        room_id=room.id,
        role="owner"
    )

    db.add(membership)

    await db.commit()

    await db.refresh(room)

    return room


async def get_rooms(
    db: AsyncSession,
    current_user: User
):

    result = await db.execute(
        select(Room)
    )

    rooms = result.scalars().all()

    room_list = []

    for room in rooms:

        membership_result = await db.execute(
            select(RoomMembership).where(
                RoomMembership.user_id == current_user.id,
                RoomMembership.room_id == room.id
            )
        )

        membership = membership_result.scalar()

        pending_request_result = await db.execute(

            select(RoomJoinRequest).where(

                RoomJoinRequest.user_id
                    == current_user.id,

                RoomJoinRequest.room_id
                    == room.id,

                RoomJoinRequest.status
                    == "pending"
            )
        )

        pending_request = (
            pending_request_result.scalar()
        )

        room_list.append({
            "id": room.id,
            "name": room.name,
            "description": room.description,
            "is_private": room.is_private,
            "owner_id": room.owner_id,
            "is_member": membership is not None,
            "role": membership.role if membership else None,
            "has_pending_request": pending_request is not None,
        })

    return room_list



async def join_room(
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

        return "room_not_found"

    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    existing_membership = (
        membership_result.scalar()
    )

    if existing_membership:

        return "already_joined"

    # PUBLIC ROOM
    if not room.is_private:

        membership = RoomMembership(
            user_id=user.id,
            room_id=room_id,
            role="member"
        )

        db.add(membership)

        await db.commit()

        await db.refresh(membership)

        return "joined"
    

    # PRIVATE ROOM

    existing_request_result = (
        await db.execute(

            select(RoomJoinRequest).where(
                RoomJoinRequest.user_id
                    == user.id,

                RoomJoinRequest.room_id
                    == room_id,

                RoomJoinRequest.status
                    == "pending"
            )
        )
    )

    existing_request = (
        existing_request_result.scalar()
    )

    if existing_request:

        return "request_pending"

    join_request = RoomJoinRequest(

        user_id=user.id,

        room_id=room_id,

        status="pending"
    )

    db.add(join_request)

    await db.commit()

    return "request_sent"
async def leave_room(
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
        return "room_not_found"

    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    membership = membership_result.scalar()

    if not membership:
        return "not_member"

    if membership.role == "owner":
        return "owner_cannot_leave"

    await db.delete(membership)

    await db.commit()

    return "left"


async def delete_room(
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
        return "room_not_found"

    if room.owner_id != user.id:
        return "not_owner"

    memberships_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.room_id == room_id
        )
    )

    memberships = (
        memberships_result.scalars().all()
    )

    for membership in memberships:

        await db.delete(membership)

    messages_result = await db.execute(
        select(Message).where(
            Message.room_id == room_id
        )
    )

    messages = (
        messages_result.scalars().all()
    )

    for message in messages:

        await db.delete(message)

    await db.delete(room)

    await db.commit()

    return "deleted"

async def get_pending_requests(
    db: AsyncSession,
    current_user: User
):

    owner_memberships_result = (
        await db.execute(

            select(RoomMembership).where(
                RoomMembership.user_id
                    == current_user.id,

                RoomMembership.role
                    == "owner"
            )
        )
    )

    owner_memberships = (
        owner_memberships_result
        .scalars()
        .all()
    )

    owned_room_ids = [
        membership.room_id
        for membership
        in owner_memberships
    ]

    if not owned_room_ids:
        return []

    requests_result = await db.execute(

        select(
            RoomJoinRequest,
            Room,
            User
        )
        .join(
            Room,
            RoomJoinRequest.room_id
                == Room.id
        )
        .join(
            User,
            RoomJoinRequest.user_id
                == User.id
        )
        .where(
            RoomJoinRequest.room_id.in_(
                owned_room_ids
            ),

            RoomJoinRequest.status
                == "pending"
        )
    )

    requests = requests_result.all()

    formatted_requests = []

    for request, room, user in requests:

        formatted_requests.append({

            "request_id":
                request.id,

            "room_id":
                room.id,

            "room_name":
                room.name,

            "user_id":
                user.id,

            "username":
                user.username,

            "status":
                request.status
        })

    return formatted_requests


async def approve_join_request(
    db: AsyncSession,
    request_id: int,
    current_user: User
):

    request_result = await db.execute(

        select(RoomJoinRequest).where(
            RoomJoinRequest.id
                == request_id
        )
    )

    join_request = (
        request_result.scalar()
    )

    if not join_request:
        return "request_not_found"

    membership_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.user_id
                == current_user.id,

            RoomMembership.room_id
                == join_request.room_id
        )
    )

    membership = (
        membership_result.scalar()
    )

    if (
        not membership
        or membership.role
            != "owner"
    ):

        return "not_owner"

    existing_member_result = (
        await db.execute(

            select(RoomMembership).where(

                RoomMembership.user_id
                    == join_request.user_id,

                RoomMembership.room_id
                    == join_request.room_id
            )
        )
    )

    existing_member = (
        existing_member_result.scalar()
    )

    if existing_member:

        return "already_member"

    new_membership = (
        RoomMembership(
            user_id=
                join_request.user_id,

            room_id=
                join_request.room_id,

            role="member"
        )
    )

    db.add(new_membership)

    join_request.status = (
        "approved"
    )

    await db.commit()

    return "approved"


async def reject_join_request(
    db: AsyncSession,
    request_id: int,
    current_user: User
):

    request_result = await db.execute(

        select(RoomJoinRequest).where(
            RoomJoinRequest.id
                == request_id
        )
    )

    join_request = (
        request_result.scalar()
    )

    if not join_request:
        return "request_not_found"

    membership_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.user_id
                == current_user.id,

            RoomMembership.room_id
                == join_request.room_id
        )
    )

    membership = (
        membership_result.scalar()
    )

    if (
        not membership
        or membership.role
            != "owner"
    ):

        return "not_owner"

    join_request.status = (
        "rejected"
    )

    await db.commit()

    return "rejected"



