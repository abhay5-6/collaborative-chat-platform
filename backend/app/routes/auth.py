from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse
)
from app.services.user_service import create_user
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.token import Token
from app.services.user_service import authenticate_user
from app.core.security import create_access_token
from app.core.config import settings
from app.core.rate_limit import limiter

from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse
)
@limiter.limit(settings.register_rate_limit)
async def register(
    request: Request,
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    created_user = await create_user(db, user)

    if created_user == "EMAIL_TAKEN":
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
        
    if created_user == "USERNAME_TAKEN":
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )

    return created_user


@router.post("/login", response_model=Token)
@limiter.limit(settings.login_rate_limit)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user
