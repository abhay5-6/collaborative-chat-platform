import api from "./client";

export async function getRooms() {

  const token =
    sessionStorage.getItem(
      "token"
    ) || localStorage.getItem(
      "token"
    );

  if (!token) {

    console.warn(
      "No auth token found"
    );

    return [];
  }

  try {

    const response =
      await api.get(
        "/rooms/",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    const payload = response.data;

    // Backend may return either a plain list
    // or a paginated object with `items`.
    if (Array.isArray(payload)) {
      return payload;
    }

    if (
      payload
      && Array.isArray(payload.items)
    ) {
      return payload.items;
    }

    return [];

  } catch (error) {

    console.error(
      "Failed to fetch rooms:",
      error
    );

    return [];
  }
}

export async function getRoom(
  roomId: number
) {
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  const response = await api.get(
    `/rooms/${roomId}`,
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

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/${roomId}/join`,

      {},

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
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

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/${roomId}/leave`,

      {},

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

export async function deleteRoom(
  roomId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.delete(

      `/rooms/${roomId}`,

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

//
// =========================
// MEMBERS / HIERARCHY
// =========================
//

export async function getRoomMembers(
  roomId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(

      `/rooms/${roomId}/members`,

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

export async function promoteMember(
  roomId: number,
  userId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/${roomId}/promote/${userId}`,

      {},

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

export async function demoteMember(
  roomId: number,
  userId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/${roomId}/demote/${userId}`,

      {},

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

export async function removeMember(
  roomId: number,
  userId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/${roomId}/remove/${userId}`,

      {},

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

export async function toggleRoomAI(
  roomId: number,
  ai_enabled: boolean
) {
  const token = localStorage.getItem("token");

  const response = await api.patch(
    `/rooms/${roomId}`,
    { ai_enabled },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}