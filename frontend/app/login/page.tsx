"use client";

import { useState } from "react";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  async function handleLogin() {
    try {
      const data = await login(
        email,
        password
      );

      localStorage.setItem(
        "token",
        data.access_token
      );

      alert("Login successful");

    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  }

  return (
    <div className="p-10 flex flex-col gap-4 max-w-md">
      <input
        className="border p-2"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <input
        className="border p-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <button
        className="bg-black text-white p-2"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
}