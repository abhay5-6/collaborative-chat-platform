
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8 text-center">

        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Rework
          </h1>

          <p className="text-zinc-400 text-lg">
            AI-powered realtime collaboration platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">

          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
          >
            Login
          </Link>

          <Link
            href="/rooms"
            className="px-6 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-900 transition"
          >
            Rooms
          </Link>

        </div>

        <div className="pt-10 text-sm text-zinc-500">
          FastAPI • Next.js • PostgreSQL • WebSockets
        </div>
      </div>
    </main>
  );
}
