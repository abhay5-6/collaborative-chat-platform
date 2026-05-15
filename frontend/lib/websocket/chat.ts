export function createChatSocket(
  roomId: number
) {
  const token = localStorage.getItem(
    "token"
  );

  return new WebSocket(
    `ws://127.0.0.1:8000/ws/${roomId}?token=${token}`
  );
}