"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { createRoom, deleteRoom, getRooms, joinRoom, leaveRoom } from "@/lib/api/rooms";
import { isAuthenticated } from "@/lib/auth";

type Room = {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  is_member: boolean;
  is_owner: boolean;
  has_pending_request: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return fallback;
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadRooms();
  }, [router]);

  async function loadRooms() {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom() {
    if (!name.trim()) return;

    try {
      setCreating(true);
      await createRoom(name, description, isPrivate);
      toast.success("Room created");
      setName("");
      setDescription("");
      setIsPrivate(false);
      await loadRooms();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom(roomId: number) {
    try {
      const response = await joinRoom(roomId);
      if (response.message === "Join request sent") {
        toast.success("Access request sent");
        await loadRooms();
        return;
      }
      if (response.message === "Joined room successfully") {
        toast.success("Joined room");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadRooms();
        router.push(`/rooms/${roomId}`);
        return;
      }
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to join room"));
    }
  }

  async function handleLeaveRoom(roomId: number) {
    try {
      await leaveRoom(roomId);
      toast.success("Left room");
      await loadRooms();
    } catch (error) {
      console.error(error);
      toast.error("Failed to leave room");
    }
  }

  async function handleDeleteRoom(roomId: number) {
    try {
      await deleteRoom(roomId);
      toast.success("Room deleted");
      await loadRooms();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete room");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground mt-2">Join or create a workspace to collaborate.</p>
        </div>

        {/* CREATE ROOM */}
        <div className="border border-border rounded-3xl p-6 md:p-8 bg-card text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
          <div className="flex flex-col gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room name"
              className="bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="bg-background border border-border rounded-xl px-4 py-3 outline-none min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
            <div className="flex items-center justify-between border border-border rounded-xl p-4 bg-background">
              <div>
                <div className="font-semibold">Private Room</div>
                <div className="text-muted-foreground text-sm">Require approval to join</div>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-14 h-8 rounded-full transition relative ${
                  isPrivate ? "bg-primary" : "bg-muted border border-border"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-background shadow transition-all ${
                    isPrivate ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={creating || !name.trim()}
              className="bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 mt-2"
            >
              {creating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>

        {/* ROOM LIST */}
        <div className="grid md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border border-border rounded-3xl p-6 bg-card text-card-foreground shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold truncate pr-2">{room.name}</h3>
                  <div
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      room.is_private
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    }`}
                  >
                    {room.is_private ? "Private" : "Public"}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {room.description || "No description provided."}
                </p>
                {room.is_owner && (
                  <div className="mt-4 inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/20">
                    Owner
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-8">
                {room.is_member ? (
                  <>
                    <button
                      onClick={() => router.push(`/rooms/${room.id}`)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                    >
                      Enter Room
                    </button>
                    {!room.is_owner && (
                      <button
                        onClick={() => handleLeaveRoom(room.id)}
                        className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-xl text-sm font-semibold transition"
                      >
                        Leave
                      </button>
                    )}
                    {room.is_owner && (
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-xl text-sm font-semibold transition"
                      >
                        Delete
                      </button>
                    )}
                  </>
                ) : room.has_pending_request ? (
                  <button
                    disabled
                    className="bg-muted text-muted-foreground px-4 py-2 rounded-xl text-sm font-semibold cursor-not-allowed w-full"
                  >
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl text-sm font-semibold transition w-full"
                  >
                    {room.is_private ? "Request Access" : "Join Room"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
