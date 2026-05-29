from fastapi import (
    APIRouter,
    Depends,
    Request
)

from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.db.session import get_db

from app.core.dependencies import (
    get_current_user
)
from app.core.config import settings
from app.core.rate_limit import limiter

from app.models.user import User

from app.services.ai.memory_summary_service import (
    generate_memory_summary
)

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.get("/summary/{room_id}")
@limiter.limit(settings.ai_rate_limit)

async def summarize_room_memory(
    request: Request,

    room_id: int,

    query: str,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):

    summary = await (
        generate_memory_summary(

            db,

            room_id,

            query,

            current_user.id
        )
    )

    return {
        "summary": summary
    }
