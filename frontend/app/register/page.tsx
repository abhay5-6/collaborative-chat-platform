"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast }
from "sonner";
import {
  useEffect
} from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  register
} from "@/lib/api/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.push("/rooms");
    }
  }, [auth.isAuthenticated, router]);

  async function handleRegister(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      await register(
        username,
        email,
        password
      );

      toast.success("Account created successfully");

      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent text-white px-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md border border-zinc-800 rounded-2xl p-8 flex flex-col gap-5 bg-zinc-950"
      >
        <h1 className="text-3xl font-bold text-center">
          Register
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black rounded-lg py-3 font-semibold hover:opacity-90 transition"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </main>
  );
}