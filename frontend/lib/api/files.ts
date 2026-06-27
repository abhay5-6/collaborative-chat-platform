import api from "./client";

export async function uploadRoomFile(
  roomId: number,
  file: File,
  onProgress?: (progressEvent: any) => void
) {
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/rooms/${roomId}/files`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    }
  );

  return response.data;
}
