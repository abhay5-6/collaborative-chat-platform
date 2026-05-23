from app.models.membership import (
    RoomMembership
)


def is_owner(
    membership: RoomMembership | None
) -> bool:

    return (
        membership is not None
        and membership.role == "owner"
    )


def is_admin(
    membership: RoomMembership | None
) -> bool:

    return (
        membership is not None
        and membership.role in [
            "owner",
            "admin"
        ]
    )


def can_manage_room(
    membership: RoomMembership | None
) -> bool:

    return is_admin(membership)