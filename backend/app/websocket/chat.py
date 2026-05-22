from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

from app.websocket.manager import manager

from app.websocket.connection import (
    authenticate_websocket
)

from app.db.session import (
    AsyncSessionLocal
)

from app.services.message_service import (
    create_realtime_message
)

router = APIRouter()


@router.websocket("/ws/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int
):

    token = websocket.query_params.get(
        "token"
    )

    if not token:

        await websocket.close(
            code=1008
        )

        return

    async with AsyncSessionLocal() as db:

        user = await authenticate_websocket(
            token,
            room_id,
            db
        )

        if not user:

            await websocket.close(
                code=1008
            )

            return

        await manager.connect(
            room_id,
            user.username,
            websocket
        )

        # User joined
        await manager.broadcast(
            room_id,
            {
                "type": "online_users",
                "data": {
                    "users":
                        manager.get_online_users(
                            room_id
                        )
                }
            }
        )

        try:

            while True:

                try:

                    data = await websocket.receive_json()

                except RuntimeError:

                    break

                event_type = data.get(
                    "type"
                )

                # Typing indicator
                if event_type == "typing":

                    await manager.broadcast(
                        room_id,
                        {
                            "type": "typing",
                            "data": {
                                "username":
                                    user.username
                            }
                        }
                    )

                    continue

                # Chat message
                if event_type == "chat_message":

                    content = data.get(
                        "message"
                    )

                    if not content:
                        continue

                    saved_message = (
                        await create_realtime_message(
                            db,
                            room_id,
                            user,
                            content
                        )
                    )

                    if not saved_message:

                        await websocket.send_json(
                            {
                                "type": "error",
                                "data": {
                                    "message":
                                        "Access denied"
                                }
                            }
                        )

                        continue

                    message_payload = {
                        "type": "chat_message",
                        "data": {
                            "id":
                                saved_message.id,

                            "user_id":
                                user.id,

                            "username":
                                user.username,

                            "room_id":
                                room_id,

                            "message":
                                saved_message.content,

                            "created_at":
                                saved_message.created_at
                                .isoformat()
                        }
                    }

                    await manager.broadcast(
                        room_id,
                        message_payload
                    )

        except WebSocketDisconnect:

            pass

        finally:

            manager.disconnect(
                room_id,
                user.username,
                websocket
            )

            await manager.broadcast(
                room_id,
                {
                    "type": "online_users",
                    "data": {
                        "users":
                            manager.get_online_users(
                                room_id
                            )
                    }
                }
            )