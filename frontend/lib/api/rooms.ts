import api from "./client";

export async function getRooms() {
  const token = localStorage.getItem(
    "token"
  );

  const response = await api.get(
    "/rooms/",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function joinRoom(
  roomId: number
) {

  const token = localStorage.getItem(
    "token"
  );

  const response = await api.post(
    `/rooms/${roomId}/join`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}