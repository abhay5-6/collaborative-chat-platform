"use client";

import Link from "next/link";

import { useRouter }
from "next/navigation";

import {
  useAuth
} from "@/components/AuthProvider";

import NotificationBell
from "@/components/NotificationBell";

export default function Navbar() {

  const router =
    useRouter();

  const auth =
    useAuth();

  function handleLogout() {

    auth.logout();

    router.push("/login");

    router.refresh();
  }

  return (

    <nav className="w-full border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">

      <div className="flex items-center gap-6">

        <Link
          href="/"
          className="text-2xl font-bold hover:opacity-80 transition"
        >

          Rework

        </Link>

        {auth.isAuthenticated && (

          <Link
            href="/rooms"
            className="text-zinc-300 hover:text-white transition"
          >

            Rooms

          </Link>
        )}

      </div>

      <div>

        {auth.isAuthenticated ? (

          <div className="flex items-center gap-4">

            <NotificationBell />

            <button
              onClick={handleLogout}

              className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >

              Logout

            </button>

          </div>

        ) : (

          <div className="flex gap-3">

            <Link
              href="/login"
              className="text-zinc-300 hover:text-white transition"
            >

              Login

            </Link>

            <Link
              href="/register"
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >

              Register

            </Link>

          </div>
        )}

      </div>

    </nav>
  );
}