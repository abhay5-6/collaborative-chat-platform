import api from "./client";

export async function getJoinRequests() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      "/rooms/join-requests",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

export async function approveJoinRequest(
  requestId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/join-requests/${requestId}/approve`,

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

export async function rejectJoinRequest(
  requestId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/rooms/join-requests/${requestId}/reject`,

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