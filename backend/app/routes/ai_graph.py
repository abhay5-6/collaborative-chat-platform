from fastapi import (
    APIRouter,
    Depends
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


router = APIRouter(

    prefix="/ai",

    tags=["AI Graph"]
)


@router.get(
    "/graph/{room_id}"
)
async def get_room_graph(

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