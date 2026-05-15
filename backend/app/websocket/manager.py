from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):

        self.active_connections: dict[
            int,
            list[WebSocket]
        ] = {}

        self.online_users: dict[
            int,
            set[str]
        ] = {}

    async def connect(
        self,
        room_id: int,
        username: str,
        websocket: WebSocket
    ):

        await websocket.accept()

        if room_id not in (
            self.active_connections
        ):
            self.active_connections[
                room_id
            ] = []

        if room_id not in (
            self.online_users
        ):
            self.online_users[
                room_id
            ] = set()

        self.active_connections[
            room_id
        ].append(websocket)

        self.online_users[
            room_id
        ].add(username)

    def disconnect(
        self,
        room_id: int,
        username: str,
        websocket: WebSocket
    ):

        self.active_connections[
            room_id
        ].remove(websocket)

        self.online_users[
            room_id
        ].discard(username)

    def get_online_users(
        self,
        room_id: int
    ):

        return list(
            self.online_users.get(
                room_id,
                set()
            )
        )

    async def broadcast(
        self,
        room_id: int,
        message: dict
    ):

        if room_id not in (
            self.active_connections
        ):
            return

        for connection in (
            self.active_connections[
                room_id
            ]
        ):

            await connection.send_json(
                message
            )


manager = ConnectionManager()