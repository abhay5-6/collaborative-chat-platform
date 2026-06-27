import api from "./client";

export async function getStaleMemories(roomId: number, daysOld: number = 30) {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.get(`/rooms/${roomId}/memories/stale?days_old=${daysOld}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function reinforceMemory(roomId: number, memoryId: number) {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.post(`/rooms/${roomId}/memories/${memoryId}/reinforce`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function pruneMemory(roomId: number, memoryId: number) {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.delete(`/rooms/${roomId}/memories/${memoryId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
