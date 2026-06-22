from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password
from app.core.security import verify_password


async def create_user(
    db: AsyncSession,
    user_data: UserCreate
):
    existing_user = await db.execute(
        select(User).where(
            User.email == user_data.email
        )
    )

    if existing_user.scalar():
        return None

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        )
    )

    db.add(new_user)

    try:
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except Exception as e:
        await db.rollback()
        raise e

async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str
):
    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    user = result.scalar()

    if not user:
        return None

    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user