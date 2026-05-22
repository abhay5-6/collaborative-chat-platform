"use client";

import { useState } from "react";

import { useRouter }
from "next/navigation";

import { login }
from "@/lib/api/auth";

import {
  useAuth
} from "@/components/AuthProvider";

import { toast }
from "sonner";

import {
  useEffect
} from "react";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  
  const auth = useAuth();
  

  useEffect(() => {

    if (
      auth.isAuthenticated
    ) {

      router.push("/rooms");
    }

  }, [
    auth.isAuthenticated,
    router
  ]);

  
  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      const data = await login(
        email,
        password
      );

      auth.login(
        data.access_token
      );

      toast.success("Login successful");

      router.push("/rooms");

    } catch (error) {

      console.error(error);

      toast.error("Login failed");

    } finally {

      setLoading(false);
    }
  }

  return (

    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md border border-zinc-800 rounded-2xl p-8 flex flex-col gap-5 bg-zinc-950"
      >

        <h1 className="text-3xl font-bold text-center">

          Login

        </h1>

        <input
          type="email"
          placeholder="Email"

          value={email}

          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }

          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none text-white"

          required
        />

        <input
          type="password"
          placeholder="Password"

          value={password}

          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }

          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none text-white"

          required
        />

        <button
          type="submit"

          disabled={loading}

          className="bg-white text-black rounded-lg py-3 font-semibold hover:opacity-90 transition disabled:opacity-50"
        >

          {loading
            ? "Logging in..."
            : "Login"}

        </button>

      </form>

    </main>
  );
}