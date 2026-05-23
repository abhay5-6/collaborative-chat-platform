from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.models.membership import (
    RoomMembership
)

from app.models.user import User

from app.models.room import Room


async def get_room_members(
    db: AsyncSession,
    room_id: int
):

    result = await db.execute(

        select(
            RoomMembership,
            User
        )
        .join(
            User,
            RoomMembership.user_id
                == User.id
        )
        .where(
            RoomMembership.room_id
                == room_id
        )
    )

    members = result.all()

    formatted_members = []

    for membership, user in members:

        formatted_members.append({

            "user_id":
                user.id,

            "username":
                user.username,

            "role":
                membership.role
        })

    return formatted_members


async def promote_member(
    db: AsyncSession,
    room_id: int,
    target_user_id: int,
    current_user: User
):

    owner_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == current_user.id
        )
    )

    owner_membership = (
        owner_result.scalar()
    )

    if (
        not owner_membership
        or owner_membership.role
            != "owner"
    ):

        return "not_owner"

    target_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == target_user_id
        )
    )

    target_membership = (
        target_result.scalar()
    )

    if not target_membership:

        return "member_not_found"

    if target_membership.role == "owner":

        return "cannot_modify_owner"

    target_membership.role = "admin"

    await db.commit()

    return "promoted"


async def demote_member(
    db: AsyncSession,
    room_id: int,
    target_user_id: int,
    current_user: User
):

    owner_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == current_user.id
        )
    )

    owner_membership = (
        owner_result.scalar()
    )

    if (
        not owner_membership
        or owner_membership.role
            != "owner"
    ):

        return "not_owner"

    target_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == target_user_id
        )
    )

    target_membership = (
        target_result.scalar()
    )

    if not target_membership:

        return "member_not_found"

    if target_membership.role == "owner":

        return "cannot_modify_owner"

    target_membership.role = "member"

    await db.commit()

    return "demoted"


async def remove_member(
    db: AsyncSession,
    room_id: int,
    target_user_id: int,
    current_user: User
):

    manager_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == current_user.id
        )
    )

    manager_membership = (
        manager_result.scalar()
    )

    if (
        not manager_membership
        or manager_membership.role
            not in [
                "owner",
                "admin"
            ]
    ):

        return "not_authorized"

    target_result = await db.execute(

        select(RoomMembership).where(

            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == target_user_id
        )
    )

    target_membership = (
        target_result.scalar()
    )

    if not target_membership:

        return "member_not_found"

    if target_membership.role == "owner":

        return "cannot_remove_owner"

    await db.delete(
        target_membership
    )

    await db.commit()

    return "removed"