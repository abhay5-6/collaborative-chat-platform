from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import (
    SECRET_KEY,
    ALGORITHM
)
from app.models.user import User
from app.models.membership import (
    RoomMembership
)


async def authenticate_websocket(
    token: str,
    room_id: int,
    db: AsyncSession
):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if not email:
            return None

    except JWTError:
        return None

    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    user = result.scalar()

    if not user:
        return None

    membership_result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.user_id == user.id,
            RoomMembership.room_id == room_id
        )
    )

    membership = membership_result.scalar()

    if not membership:
        return None

    return user