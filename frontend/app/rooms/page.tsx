"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getRooms,
  joinRoom
} from "@/lib/api/rooms";

type Room = {
  id: number;
  name: string;
  description: string;
};

export default function RoomsPage() {

  const [rooms, setRooms] = useState<
    Room[]
  >([]);

  useEffect(() => {

    async function loadRooms() {

      try {

        const data = await getRooms();

        setRooms(data);

      } catch (error) {

        console.error(error);

      }
    }

    loadRooms();

  }, []);

  async function handleJoinRoom(
    roomId: number
  ) {

    try {

      await joinRoom(roomId);

      alert(
        "Joined room successfully"
      );

    } catch (error) {

      console.error(error);

      alert("Failed to join room");
    }
  }

  return (

    <div className="p-10">

      <h1 className="text-3xl mb-6">
        Rooms
      </h1>

      <div className="flex flex-col gap-4">

        {rooms.map((room) => (

          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
          >

            <div className="border p-4 rounded hover:bg-gray-100 text-black">

              <h2 className="text-xl">
                {room.name}
              </h2>

              <p>
                {room.description}
              </p>

              <button
                className="bg-black text-white px-4 py-2 mt-2 rounded"
                onClick={(e) => {

                  e.preventDefault();

                  handleJoinRoom(room.id);

                }}
              >
                Join Room
              </button>

            </div>

          </Link>
        ))}

      </div>

    </div>
  );
}