import api from "./client";

export type RoomMemory = {
  id: number;
  room_id: number;
  created_by: number;
  creator_username?: string | null;
  content: string;
  memory_type: string;
  source_type: string;
  source_id?: number | null;
  domain: string;
  importance_score: number;
  confidence_score: number;
  tags: string[];
  created_at: string;
  last_reinforced_at: string;
};

export async function getRoomMemories(roomId: number, limit = 20): Promise<RoomMemory[]> {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.get(`/rooms/${roomId}/memories?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getStaleMemories(roomId: number, daysOld: number = 30) {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.get(`/rooms/${roomId}/memories/stale?days_old=${daysOld}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function createRoomMemory(
  roomId: number,
  memory: {
    content: string;
    source_type?: string;
    source_id?: number;
    memory_type?: string;
    importance_score?: number;
  }
) {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.post(`/rooms/${roomId}/memories`, memory, {
    headers: { Authorization: `Bearer ${token}` },
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
