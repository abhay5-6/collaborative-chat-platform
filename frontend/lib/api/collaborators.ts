import api from "./client";


export async function sendCollaborationRequest(
  userId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/collaborators/request/${userId}`,

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


export async function getCollaborationRequests() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(

      "/collaborators/requests",

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}


export async function acceptCollaborationRequest(
  requestId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/collaborators/requests/${requestId}/accept`,

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


export async function rejectCollaborationRequest(
  requestId: number
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(

      `/collaborators/requests/${requestId}/reject`,

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


export async function getCollaborators() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(

      "/collaborators/",

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}