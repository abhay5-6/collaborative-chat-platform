import api from "./client";

export type AuthProviders = {
  google: boolean;
  github: boolean;
};

export async function getAuthProviders(): Promise<AuthProviders> {
  const response = await api.get("/auth/providers");
  return response.data;
}

export function getProviderAuthUrl(provider: "google" | "github") {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    .replace(/\/$/, "");
  return `${baseUrl}/auth/${provider}/start`;
}


export async function register(

  username: string,

  email: string,

  password: string
) {

  const response =
    await api.post(

      "/auth/register",

      {
        username,
        email,
        password
      }
    );

  return response.data;
}


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
    sessionStorage.getItem(
      "token"
    ) || localStorage.getItem(
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
