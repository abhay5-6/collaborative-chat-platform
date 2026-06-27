import api from "./client";

export interface Task {
  id: number;
  description: string;
  assignee_username: string | null;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export async function getRoomTasks(roomId: number): Promise<Task[]> {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.get(`/rooms/${roomId}/tasks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function updateTask(roomId: number, taskId: number, updates: { completed?: boolean }): Promise<Task> {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const response = await api.patch(`/rooms/${roomId}/tasks/${taskId}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
