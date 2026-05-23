

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.db.session import get_db

from app.schemas.room import (
    RoomCreate,
    RoomResponse,
    RoomMemberResponse
)

from app.services.room_service import (
    create_room,
    get_rooms,
    join_room,
    leave_room,
    delete_room,
    get_pending_requests,
    approve_join_request,
    reject_join_request
)

from app.services.member_service import (
    get_room_members,
    promote_member,
    demote_member,
    remove_member
)

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)


@router.post(
    "/",
    response_model=RoomResponse
)
async def create_new_room(
    room: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    created_room = await create_room(
        db,
        room,
        current_user
    )

    if not created_room:

        raise HTTPException(
            status_code=400,
            detail="Room already exists"
        )

    return {
        "id": created_room.id,
        "name": created_room.name,
        "description": created_room.description,
        "is_private": created_room.is_private,
        "is_member": True,
        "role": "owner",
        "owner_id": current_user.id
    }


@router.get(
    "/",
    response_model=list[RoomResponse]
)
async def list_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    return await get_rooms(
        db,
        current_user
    )


@router.post("/{room_id}/join")
async def join_existing_room(

    room_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = await join_room(
        db,
        room_id,
        current_user
    )

    if result == "room_not_found":

        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if result == "already_joined":

        raise HTTPException(
            status_code=400,
            detail="Already joined"
        )

    if result == "request_pending":

        raise HTTPException(
            status_code=400,
            detail="Request already pending"
        )

    if result == "request_sent":

        return {
            "success": True,
            "message":
                "Join request sent"
        }

    if result == "joined":

        return {
            "success": True,
            "message":
                "Joined room successfully"
        }

    raise HTTPException(
        status_code=400,
        detail="Join failed"
    )


@router.post("/{room_id}/leave")
async def leave_existing_room(

    room_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = await leave_room(
        db,
        room_id,
        current_user
    )

    if result == "room_not_found":

        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if result == "not_member":

        raise HTTPException(
            status_code=403,
            detail="Not a member"
        )

    if result == "owner_cannot_leave":

        raise HTTPException(
            status_code=403,
            detail="Owner cannot leave room"
        )

    return {
        "message":
            "Left room successfully"
    }


@router.delete("/{room_id}")
async def delete_existing_room(

    room_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = await delete_room(
        db,
        room_id,
        current_user
    )

    if result == "room_not_found":

        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if result == "not_owner":

        raise HTTPException(
            status_code=403,
            detail="Only owner can delete room"
        )

    return {
        "message":
            "Room deleted successfully"
    }


@router.get("/join-requests")
async def list_pending_requests(

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    requests = (
        await get_pending_requests(
            db,
            current_user
        )
    )

    return requests


@router.post(
    "/join-requests/{request_id}/approve"
)
async def approve_request(

    request_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = (
        await approve_join_request(
            db,
            request_id,
            current_user
        )
    )

    if result == "request_not_found":

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if result == "not_owner":

        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    if result == "already_member":

        raise HTTPException(
            status_code=400,
            detail="Already member"
        )

    return {
        "message":
            "Request approved"
    }


@router.post(
    "/join-requests/{request_id}/reject"
)
async def reject_request(

    request_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = (
        await reject_join_request(
            db,
            request_id,
            current_user
        )
    )

    if result == "request_not_found":

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if result == "not_owner":

        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    return {
        "message":
            "Request rejected"
    }


# =========================
# MEMBERS / HIERARCHY
# =========================

@router.get(
    "/{room_id}/members",
    response_model=list[
        RoomMemberResponse
    ]
)
async def list_room_members(

    room_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    members = await get_room_members(
        db,
        room_id,
        current_user
    )

    if members is None:

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return members


@router.post(
    "/{room_id}/promote/{user_id}"
)
async def promote_room_member(

    room_id: int,

    user_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = await promote_member(
        db,
        room_id,
        user_id,
        current_user
    )

    if result == "not_owner":

        raise HTTPException(
            status_code=403,
            detail="Only owner can promote"
        )

    if result == "member_not_found":

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    if result == "cannot_modify_owner":

        raise HTTPException(
            status_code=400,
            detail="Cannot modify owner"
        )

    return {
        "message":
            "Member promoted"
    }


@router.post(
    "/{room_id}/demote/{user_id}"
)
async def demote_room_member(

    room_id: int,

    user_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = await demote_member(
        db,
        room_id,
        user_id,
        current_user
    )

    if result == "not_owner":

        raise HTTPException(
            status_code=403,
            detail="Only owner can demote"
        )

    if result == "member_not_found":

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    if result == "cannot_modify_owner":

        raise HTTPException(
            status_code=400,
            detail="Cannot modify owner"
        )

    return {
        "message":
            "Member demoted"
    }


@router.post(
    "/{room_id}/remove/{user_id}"
)
async def remove_room_member(

    room_id: int,

    user_id: int,

    db: AsyncSession = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    result = await remove_member(
        db,
        room_id,
        user_id,
        current_user
    )

    if result == "not_authorized":

        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    if result == "member_not_found":

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    if result == "cannot_remove_owner":

        raise HTTPException(
            status_code=400,
            detail="Cannot remove owner"
        )

    return {
        "message":
            "Member removed"
    }