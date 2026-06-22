import axios from "axios";

const api = axios.create({

  baseURL:
    process.env
      .NEXT_PUBLIC_API_URL,
});

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (
      error.response?.status ===
      401
    ) {

      // Clear from sessionStorage (primary) and localStorage (fallback)
      sessionStorage.removeItem(
        "token"
      );
      
      localStorage.removeItem(
        "token"
      );

      if (
        window.location.pathname
        !== "/login"
      ) {

        window.location.href =
          "/login";
      }
    }

    return Promise.reject(
      error
    );
  }
);

export default api;