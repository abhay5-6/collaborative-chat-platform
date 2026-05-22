"use client";

import {
  useEffect,
  useState
} from "react";

import { useRouter }
from "next/navigation";

import { toast }
from "sonner";

import {
  createRoom,
  deleteRoom,
  getRooms,
  joinRoom,
  leaveRoom
} from "@/lib/api/rooms";

import { isAuthenticated }
from "@/lib/auth";

type Room = {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  is_member: boolean;
  is_owner: boolean;
  has_pending_request: boolean;
};

export default function RoomsPage() {

  const router =
    useRouter();

  const [rooms, setRooms] =
    useState<Room[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription
  ] = useState("");

  const [
    isPrivate,
    setIsPrivate
  ] = useState(false);

  useEffect(() => {

    if (
      !isAuthenticated()
    ) {

      router.push("/login");

      return;
    }

    loadRooms();

  }, []);

  async function loadRooms() {

    try {

      const data =
        await getRooms();

      setRooms(data);

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to load rooms"
      );

    } finally {

      setLoading(false);
    }
  }

  async function handleCreateRoom() {

    if (!name.trim()) {
      return;
    }

    try {

      setCreating(true);

      await createRoom(
        name,
        description,
        isPrivate
      );

      toast.success(
        "Room created"
      );

      setName("");
      setDescription("");
      setIsPrivate(false);

      await loadRooms();

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to create room"
      );

    } finally {

      setCreating(false);
    }
  }

  async function handleJoinRoom(
    roomId: number
  ) {

    try {

      const response =
        await joinRoom(roomId);

      // PRIVATE ROOM
      if (
        response.message ===
        "Join request sent"
      ) {

        toast.success(
          "Access request sent"
        );

        await loadRooms();

        return;
      }

      // PUBLIC ROOM
      if (
        response.message ===
        "Joined room successfully"
      ) {

        toast.success(
          "Joined room"
        );

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              500
            )
        );

        await loadRooms();

        router.push(
          `/rooms/${roomId}`
        );

        return;
      }

    } catch (error: any) {

      console.error(error);

      toast.error(
        error?.response?.data?.detail ||
        "Failed to join room"
);
    }
  }

  async function handleLeaveRoom(
    roomId: number
  ) {

    try {

      await leaveRoom(roomId);

      toast.success(
        "Left room"
      );

      await loadRooms();

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to leave room"
      );
    }
  }

  async function handleDeleteRoom(
    roomId: number
  ) {

    try {

      await deleteRoom(roomId);

      toast.success(
        "Room deleted"
      );

      await loadRooms();

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to delete room"
      );
    }
  }

  if (loading) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        Loading...

      </div>
    );
  }

  return (

    <div className="min-h-screen bg-black text-white px-6 py-8">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">

          Rooms

        </h1>

        {/* CREATE ROOM */}

        <div className="border border-zinc-800 rounded-2xl p-6 mb-10 bg-zinc-950">

          <div className="flex flex-col gap-4">

            <input
              value={name}

              onChange={(e) =>
                setName(
                  e.target.value
                )
              }

              placeholder="Room name"

              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />

            <textarea
              value={description}

              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }

              placeholder="Description"

              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none min-h-[120px]"
            />

            <div className="flex items-center justify-between border border-zinc-800 rounded-xl p-4 bg-zinc-900">

              <div>

                <div className="font-semibold text-lg">

                  Private Room

                </div>

                <div className="text-zinc-400 text-sm">

                  Require approval to join

                </div>

              </div>

              <button
                onClick={() =>
                  setIsPrivate(
                    !isPrivate
                  )
                }

                className={`w-16 h-9 rounded-full transition relative ${
                  isPrivate
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >

                <div
                  className={`absolute top-1 w-7 h-7 rounded-full bg-white transition ${
                    isPrivate
                      ? "left-8"
                      : "left-1"
                  }`}
                />

              </button>

            </div>

            <button
              onClick={
                handleCreateRoom
              }

              disabled={creating}

              className="bg-white text-black font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >

              {creating
                ? "Creating..."
                : "Create Room"}

            </button>

          </div>

        </div>

        {/* ROOM LIST */}

        <div className="grid gap-6">

          {rooms.map((room) => (

            <div
              key={room.id}

              className="border border-zinc-800 rounded-2xl p-6 bg-black"
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2 className="text-2xl font-bold mb-2">

                    {room.name}

                  </h2>

                  <p className="text-zinc-400">

                    {room.description ||
                      "No description"}

                  </p>

                </div>

                <div
                  className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    room.is_private
                      ? "bg-red-900 text-red-200"
                      : "bg-green-900 text-green-200"
                  }`}
                >

                  {room.is_private
                    ? "Private"
                    : "Public"}

                </div>

              </div>

              <div className="flex flex-wrap gap-3 mt-6">

                {room.is_member ? (

                  <>
                    <button
                      onClick={() =>
                        router.push(
                          `/rooms/${room.id}`
                        )
                      }

                      className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl font-semibold transition"
                    >

                      Enter Room

                    </button>

                    {!room.is_owner && (

                      <button
                        onClick={() =>
                          handleLeaveRoom(
                            room.id
                          )
                        }

                        className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded-xl font-semibold transition"
                      >

                        Leave Room

                      </button>
                    )}

                    {room.is_owner && (

                      <button
                        onClick={() =>
                          handleDeleteRoom(
                            room.id
                          )
                        }

                        className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl font-semibold transition"
                      >

                        Delete Room

                      </button>
                    )}
                  </>

                ) : room.has_pending_request ? (

                  <button
                    disabled

                    className="bg-zinc-700 text-zinc-300 px-5 py-2 rounded-xl font-semibold cursor-not-allowed"
                  >

                    Request Pending

                  </button>

                ) : (

                  <button
                    onClick={() =>
                      handleJoinRoom(
                        room.id
                      )
                    }

                    className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
                  >

                    {room.is_private
                      ? "Request Access"
                      : "Join Room"}

                  </button>
                )}

              </div>

              {room.is_owner && (

                <div className="mt-5 inline-block bg-yellow-900 text-yellow-200 px-3 py-1 rounded-full text-sm font-semibold">

                  Owner

                </div>
              )}

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}