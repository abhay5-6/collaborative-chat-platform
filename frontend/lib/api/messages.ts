import api from "./client";

export async function getMessages(
  roomId: number
) {
  const token = localStorage.getItem(
    "token"
  );

  const response = await api.get(
    `/rooms/${roomId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}