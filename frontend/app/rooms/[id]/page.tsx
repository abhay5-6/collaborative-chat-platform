"use client";

import {
  useEffect,
  useState
} from "react";

import { useParams }
from "next/navigation";

import { getMessages }
from "@/lib/api/messages";

import { createChatSocket }
from "@/lib/websocket/chat";

type Message = {
  id: number;
  message?: string;
  content?: string;
  username?: string;
};

export default function RoomPage() {

  const params = useParams();

  const roomId = Number(params.id);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [socket, setSocket] =
    useState<WebSocket | null>(null);

  const [input, setInput] =
    useState("");

  const [typingUser, setTypingUser] =
    useState("");

  const [onlineUsers, setOnlineUsers] =
    useState<string[]>([]);

  const [connectionStatus,
    setConnectionStatus
  ] = useState(
    "Connecting..."
  );

  // Load old messages
  useEffect(() => {

    async function loadMessages() {

      try {

        const data = await getMessages(
          roomId
        );

        setMessages(data);

      } catch (error) {

        console.error(error);

      }
    }

    if (roomId) {
      loadMessages();
    }

  }, [roomId]);

  // WebSocket connection
  useEffect(() => {

    if (!roomId) return;

    let ws: WebSocket;

    let reconnectTimeout:
      NodeJS.Timeout;

    function connectSocket() {

      ws = createChatSocket(
        roomId
      );

      setSocket(ws);

      ws.onopen = () => {

        setConnectionStatus(
          "Connected"
        );
      };

      ws.onclose = () => {

        setConnectionStatus(
          "Disconnected"
        );

        reconnectTimeout =
          setTimeout(
            () => {

              connectSocket();

            },
            3000
          );
      };

      ws.onmessage = (event) => {

        const payload = JSON.parse(
          event.data
        );

        if (
          payload.type ===
          "chat_message"
        ) {

          setMessages((prev) => [
            ...prev,
            payload.data,
          ]);
        }

        if (
          payload.type ===
          "user_joined"
        ) {

          console.log(
            `${payload.data.username} joined`
          );
        }

        if (
          payload.type ===
          "online_users"
        ) {

          setOnlineUsers(
            payload.data.users
          );
        }

        if (
          payload.type ===
          "user_left"
        ) {

          console.log(
            `${payload.data.username} left`
          );
        }

        if (
          payload.type ===
          "typing"
        ) {

          setTypingUser(
            payload.data.username
          );

          setTimeout(() => {

            setTypingUser("");

          }, 1500);
        }
      };
    }

    connectSocket();

    return () => {

      ws.close();

      clearTimeout(
        reconnectTimeout
      );
    };

  }, [roomId]);

  // Send message
  function sendMessage() {

    if (
      !socket ||
      !input.trim()
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "chat_message",
        message: input,
      })
    );

    setInput("");
  }

  return (

    <div className="p-10">

      <h1 className="text-2xl mb-6">
        Room {roomId}
      </h1>

      <div className="mb-2">

        <strong>
          Status:
        </strong>

        {" "}

        {connectionStatus}

      </div>

      <div className="mb-4">

        <strong>
          Online:
        </strong>

        {" "}

        {onlineUsers.join(", ")}

      </div>

      <div className="border p-4 h-[400px] overflow-y-auto mb-4">

        {messages.map((msg) => (

          <div
            key={msg.id}
            className="mb-2"
          >

            <strong>
              {msg.username || "User"}:
            </strong>{" "}

            {msg.content || msg.message}

          </div>
        ))}

      </div>

      {typingUser && (

        <div className="mb-2 text-sm text-gray-500">

          {typingUser} is typing...

        </div>
      )}

      <input
        className="border p-2 w-full"
        value={input}
        onChange={(e) => {

          setInput(
            e.target.value
          );

          if (socket) {

            socket.send(
              JSON.stringify({
                type: "typing",
              })
            );
          }
        }}
        placeholder="Type a message..."
      />

      <button
        className="bg-black text-white p-2 mt-2 rounded"
        onClick={sendMessage}
      >
        Send
      </button>

    </div>
  );
}