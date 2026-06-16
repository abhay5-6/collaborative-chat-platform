from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

import asyncio
import json
import logging
import re
import time

from app.core.config import (
    WEBSOCKET_ALLOWED_ORIGINS,
    settings
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

from app.services.ai.auto_memory_service import (
    process_memory_background
)

router = APIRouter()
logger = logging.getLogger(__name__)


CONTROL_CHARS_RE = re.compile(r"[\x00-\x1f\x7f]")


def sanitize_message(text: str) -> str:
    text = text.strip()
    return CONTROL_CHARS_RE.sub("", text)


def is_rate_limited(
    room_id: int,
    user_id: int
) -> bool:
    now = time.time()
    user_key = f"{room_id}:{user_id}"
    window_seconds = (
        settings.websocket_rate_limit_window_seconds
    )

    timestamps = [
        timestamp
        for timestamp in manager.message_timestamps.get(
            user_key,
            []
        )
        if now - timestamp < window_seconds
    ]

    manager.message_timestamps[user_key] = timestamps

    if len(timestamps) >= (
        settings.websocket_message_rate_limit
    ):
        return True

    timestamps.append(now)
    return False


async def send_error(
    websocket: WebSocket,
    message: str
) -> None:
    await websocket.send_json(
        {
            "type": "error",
            "data": {
                "message": message
            }
        }
    )


@router.websocket("/ws/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int
):
    origin = websocket.headers.get(
        "origin"
    )

    if (
        origin
        and origin not in WEBSOCKET_ALLOWED_ORIGINS
    ):
        logger.warning(
            "websocket_origin_rejected",
            extra={
                "room_id": room_id,
                "origin": origin
            }
        )

        await websocket.close(
            code=1008
        )

        return

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

                    raw_data = await websocket.receive_text()

                    if len(raw_data) > (
                        settings.websocket_max_message_length
                        + 1000
                    ):
                        await send_error(
                            websocket,
                            "Payload too large"
                        )
                        continue

                    data = json.loads(raw_data)

                except json.JSONDecodeError:
                    await send_error(
                        websocket,
                        "Invalid JSON payload"
                    )
                    continue

                except RuntimeError:

                    break

                if not isinstance(data, dict):
                    await send_error(
                        websocket,
                        "Invalid payload"
                    )
                    continue

                event_type = data.get(
                    "type"
                )

                if event_type == "ping":

                    await websocket.send_json(
                        {
                            "type": "pong"
                        }
                    )

                    continue

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

                    if not isinstance(content, str):
                        await send_error(
                            websocket,
                            "Message must be text"
                        )
                        continue

                    content = sanitize_message(
                        content
                    )

                    if not content:
                        continue

                    if len(content) > (
                        settings.websocket_max_message_length
                    ):
                        await send_error(
                            websocket,
                            "Message too large"
                        )
                        continue

                    if is_rate_limited(
                        room_id,
                        user.id
                    ):
                        await send_error(
                            websocket,
                            "Rate limit exceeded"
                        )
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

                    await db.commit()

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

                    # Process AI memory in background
                    try:
                        print("Scheduling memory extraction task")
                        asyncio.create_task(
                            process_memory_background(
                                room_id,
                                user.id,
                                saved_message.id,
                                saved_message.content
                            )
                        )
                    except Exception:
                        print("Failed to schedule memory extraction task")
                        logger.exception(
                            "memory_background_task_create_failed",
                            extra={
                                "room_id": room_id,
                                "user_id": user.id
                            }
                        )

                    continue

                await send_error(
                    websocket,
                    "Unsupported event type"
                )

        except WebSocketDisconnect:

            pass

        except Exception:

            logger.exception(
                "websocket_chat_failed",
                extra={
                    "room_id": room_id,
                    "user_id": user.id
                }
            )

            try:
                await websocket.close(
                    code=1011
                )
            except Exception:
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
