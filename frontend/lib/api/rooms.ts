import api from "./client";

export async function getRooms() {
  const token = localStorage.getItem(
    "token"
  );

  if (!token) {
    console.warn(
      "No auth token found"
    );

    return [];
  }

  try {
    const response = await api.get(
      "/rooms/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch rooms:",
      error
    );

    return [];
  }
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

export async function createRoom(
  name: string,
  description: string,
  is_private: boolean
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

  const response =
    await api.post(

      "/rooms/",

      {
        name,
        description,
        is_private,
      },

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
} 

export async function leaveRoom(
  roomId: number
) {

  const token = localStorage.getItem(
    "token"
  );

  const response = await api.post(

    `/rooms/${roomId}/leave`,

    {},

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function deleteRoom(
  roomId: number
) {

  const token = localStorage.getItem(
    "token"
  );

  const response = await api.delete(

    `/rooms/${roomId}`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}