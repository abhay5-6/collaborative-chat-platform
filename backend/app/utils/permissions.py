from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.membership import (
    RoomMembership
)


async def get_membership(
    db: AsyncSession,
    room_id: int,
    user_id: int
):

    result = await db.execute(

        select(RoomMembership)
        .where(
            RoomMembership.room_id
                == room_id,

            RoomMembership.user_id
                == user_id
        )
    )

    return result.scalar_one_or_none()


def is_owner(
    membership: RoomMembership | None
) -> bool:
    """Check if user is room owner"""
    return (
        membership is not None
        and membership.role == "owner"
    )


def is_room_owner(
    membership: RoomMembership | None
):
    """Alias for is_owner - for backward compatibility"""
    return is_owner(membership)


def is_admin(
    membership: RoomMembership | None
) -> bool:
    """Check if user is room admin or owner"""
    return (
        membership is not None
        and membership.role in [
            "owner",
            "admin"
        ]
    )


def is_room_admin(
    membership: RoomMembership | None
):
    """Alias for is_admin - for backward compatibility"""
    return is_admin(membership)


def can_manage_room(
    membership: RoomMembership | None
):

    return is_room_admin(
        membership
    )