import api from "./client";

export async function login(
  email: string,
  password: string
) {

  const formData =
    new URLSearchParams();

  formData.append(
    "username",
    email
  );

  formData.append(
    "password",
    password
  );

  const response =
    await api.post(

      "/auth/login",

      formData,

      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

  return response.data;
}


export async function getMe() {

  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {

    throw new Error(
      "No token found"
    );
  }

  const response =
    await api.get(

      "/auth/me",

      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}