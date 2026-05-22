export function createChatSocket(
  roomId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  return new WebSocket(

    `${process.env
      .NEXT_PUBLIC_WS_URL}/ws/${roomId}?token=${token}`
  );
}