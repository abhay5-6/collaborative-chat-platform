export function createChatSocket(
  roomId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {

    throw new Error(
      "No auth token found"
    );
  }

  return new WebSocket(

    `${process.env
      .NEXT_PUBLIC_WS_URL}/ws/${roomId}?token=${token}`
  );
}