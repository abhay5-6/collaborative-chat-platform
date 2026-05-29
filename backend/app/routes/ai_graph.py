from fastapi import (
    APIRouter,
    Depends,
    Request
)

from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.db.session import (
    get_db
)

from app.services.ai.graph_service import (
    build_room_graph
)
from app.core.config import settings
from app.core.rate_limit import limiter


router = APIRouter(

    prefix="/ai",

    tags=["AI Graph"]
)


@router.get(
    "/graph/{room_id}"
)
@limiter.limit(settings.ai_rate_limit)
async def get_room_graph(
    request: Request,

    room_id: int,

    db: AsyncSession = Depends(
        get_db
    )
):

    graph = await (
        build_room_graph(
            db,
            room_id
        )
    )

    return graph
