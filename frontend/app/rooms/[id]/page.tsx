"use client";

import LoadingSpinner
from "@/components/LoadingSpinner";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useParams,
  useRouter
} from "next/navigation";

import { toast }
from "sonner";

import { getMessages }
from "@/lib/api/messages";

import { createChatSocket }
from "@/lib/websocket/chat";

import { isAuthenticated }
from "@/lib/auth";

import {
  getMe
} from "@/lib/api/auth";

import {
  getRoomMembers,
  promoteMember,
  demoteMember,
  removeMember
} from "@/lib/api/rooms";

type Message = {
  id: number;
  message?: string;
  content?: string;
  username?: string;
  created_at?: string;
};

type RoomMember = {
  user_id: number;
  username: string;
  role: string;
};

function formatTime(
  timestamp?: string
) {

  if (!timestamp) {
    return "";
  }

  return new Date(
    timestamp
  ).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export default function RoomPage() {

  const params = useParams();

  const router =
    useRouter();

  const roomId =
    Number(params.id);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState("");

  const [typingUser, setTypingUser] =
    useState("");

  const [onlineUsers, setOnlineUsers] =
    useState<string[]>([]);

  const [members, setMembers] =
    useState<RoomMember[]>([]);

  const [currentUserRole, setCurrentUserRole] =
    useState<string | null>(null);

  const [currentUsername, setCurrentUsername] =
    useState<string | null>(null);

  const [
    connectionStatus,
    setConnectionStatus
  ] = useState(
    "Connecting..."
  );

  const [loading, setLoading] =
    useState(true);

  const socketRef =
    useRef<WebSocket | null>(
      null
    );

  const reconnectAttemptsRef =
    useRef(0);

  const typingTimeoutRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {

    if (
      !isAuthenticated()
    ) {

      router.push("/login");
    }

  }, [router]);

  // Load messages
  useEffect(() => {

    async function loadMessages() {

      try {

        const data =
          await getMessages(
            roomId
          );

        setMessages(data);

      } catch (error: any) {

        console.error(error);

        if (
          error.response?.status === 403
        ) {

          toast.error(
            "You do not have access to this room"
          );

          router.push("/rooms");

          return;
        }

        toast.error(
          "Failed to load messages"
        );

      } finally {

        setLoading(false);
      }
    }

    if (roomId) {

      loadMessages();
    }

  }, [roomId, router]);

  useEffect(() => {

    async function loadCurrentUser() {

      try {

        const user =
          await getMe();

        setCurrentUsername(
          user.username
        );

      } catch (error) {

        console.error(error);
      }
    }

    loadCurrentUser();

  }, []);

  useEffect(() => {

    async function loadMembers() {

      try {

        const data =
          await getRoomMembers(
            roomId
          );

        setMembers(data);


        const me =
          data.find(
            (member: RoomMember) =>
              member.username ===
              currentUsername
          );

        if (me) {

          setCurrentUserRole(
            me.role
          );
        }

      } catch (error) {

        console.error(
          error
        );
      }
    }

    if (roomId) {

      loadMembers();
    }

  }, [roomId, currentUsername]);

  // Auto-scroll
  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth"
      });

  }, [messages]);

  // WebSocket
  useEffect(() => {

    if (!roomId) {
      return;
    }

    let reconnectTimeout:
      NodeJS.Timeout;

    let isMounted = true;

    const MAX_RECONNECTS = 5;

    function cleanupSocket() {

      if (!socketRef.current) {
        return;
      }

      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;

      socketRef.current.close();

      socketRef.current = null;
    }

    function connectSocket() {

      if (!isMounted) {
        return;
      }

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {

        setConnectionStatus(
          "Unauthorized"
        );

        return;
      }

      if (
        socketRef.current &&
        (
          socketRef.current.readyState ===
            WebSocket.OPEN ||

          socketRef.current.readyState ===
            WebSocket.CONNECTING
        )
      ) {
        return;
      }

      cleanupSocket();

      setConnectionStatus(
        "Connecting..."
      );

      const ws =
        createChatSocket(
          roomId
        );

      socketRef.current = ws;

      ws.onopen = () => {

        reconnectAttemptsRef.current = 0;

        setConnectionStatus(
          "Connected"
        );
      };

      ws.onclose = (
        event
      ) => {

        cleanupSocket();

        if (!isMounted) {
          return;
        }

        if (
          event.code === 1008
        ) {

          setConnectionStatus(
            "Unauthorized"
          );

          return;
        }

        if (
          reconnectAttemptsRef.current >=
          MAX_RECONNECTS
        ) {

          setConnectionStatus(
            "Connection Failed"
          );

          return;
        }

        reconnectAttemptsRef.current++;

        setConnectionStatus(
          "Disconnected"
        );

        reconnectTimeout =
          setTimeout(
            connectSocket,
            3000
          );
      };

      ws.onmessage = (
        event
      ) => {

        const payload =
          JSON.parse(
            event.data
          );

        if (
          payload.type ===
          "chat_message"
        ) {

          setMessages(
            (prev) => [
              ...prev,
              payload.data,
            ]
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
          "typing"
        ) {

          setTypingUser(
            payload.data.username
          );

          setTimeout(
            () => {

              setTypingUser("");

            },
            1500
          );
        }
      };
    }

    connectSocket();

    return () => {

      isMounted = false;

      clearTimeout(
        reconnectTimeout
      );

      cleanupSocket();
    };

  }, [roomId]);

  function sendTypingEvent() {

    const socket =
      socketRef.current;

    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "typing",
      })
    );
  }

  function sendMessage() {

    const socket =
      socketRef.current;

    if (!socket) {

      toast.error(
        "Socket not connected"
      );

      return;
    }

    if (
      socket.readyState !==
      WebSocket.OPEN
    ) {

      toast.error(
        "Socket not ready"
      );

      return;
    }

    if (!input.trim()) {
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

  async function handlePromote(
    userId: number
  ) {

    try {

      await promoteMember(
        roomId,
        userId
      );

      toast.success(
        "Member promoted"
      );

      const updated =
        await getRoomMembers(
          roomId
        );

      setMembers(updated);

    } catch (error: any) {

      toast.error(
        error?.response?.data?.detail ||
        "Promotion failed"
      );
    }
  }

  async function handleDemote(
    userId: number
  ) {

    try {

      await demoteMember(
        roomId,
        userId
      );

      toast.success(
        "Member demoted"
      );

      const updated =
        await getRoomMembers(
          roomId
        );

      setMembers(updated);

    } catch (error: any) {

      toast.error(
        error?.response?.data?.detail ||
        "Demotion failed"
      );
    }
  }

  async function handleRemove(
    userId: number
  ) {

    try {

      await removeMember(
        roomId,
        userId
      );

      toast.success(
        "Member removed"
      );

      const updated =
        await getRoomMembers(
          roomId
        );

      setMembers(updated);

    } catch (error: any) {

      toast.error(
        error?.response?.data?.detail ||
        "Removal failed"
      );
    }
  }

  if (loading) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        <LoadingSpinner />

      </div>
    );
  }

  return (

    <div className="min-h-screen bg-black text-white px-4 sm:px-6 md:px-10 py-6 flex flex-col">

      <div className="max-w-7xl w-full mx-auto flex gap-6 flex-1 flex-col lg:flex-row">

        {/* CHAT SECTION */}

        <div className="flex-1 flex flex-col">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>

              <h1 className="text-3xl font-bold">

                Room {roomId}

              </h1>

              <div className="mt-2 text-sm">

                <strong>
                  Status:
                </strong>{" "}

                <span
                  className={`font-semibold ${
                    connectionStatus ===
                    "Connected"

                      ? "text-green-500"

                      : connectionStatus ===
                        "Connecting..."

                      ? "text-yellow-500"

                      : "text-red-500"
                  }`}
                >

                  {connectionStatus}

                </span>

              </div>

            </div>

            <div className="text-sm text-zinc-400 break-words">

              <strong>
                Online:
              </strong>{" "}

              {onlineUsers.length > 0

                ? onlineUsers.join(", ")

                : "No users online"}

            </div>

          </div>

          <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-4 flex-1 overflow-y-auto min-h-[400px] max-h-[65vh] mb-4">

            {messages.length === 0 && (

              <div className="text-zinc-500 text-center mt-10">

                No messages yet.

              </div>
            )}

            <div className="flex flex-col gap-3">

              {messages.map(
                (msg, index) => (

                  <div
                    key={`${msg.id}-${index}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                  >

                    <div className="flex items-center justify-between gap-4 mb-1">

                      <div className="text-sm font-semibold text-white">

                        {msg.username ||
                          "User"}

                      </div>

                      <div className="text-xs text-zinc-500">

                        {formatTime(
                          msg.created_at
                        )}

                      </div>

                    </div>

                    <div className="text-zinc-300 break-words">

                      {msg.content ||
                        msg.message}

                    </div>

                  </div>
                )
              )}

              <div ref={messagesEndRef} />

            </div>

          </div>

          {typingUser && (

            <div className="mb-2 text-sm text-zinc-500">

              {typingUser} is typing...

            </div>
          )}

          <div className="flex gap-3">

            <input
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none text-white"

              value={input}

              onChange={(e) => {

                setInput(
                  e.target.value
                );

                if (
                  typingTimeoutRef.current
                ) {

                  clearTimeout(
                    typingTimeoutRef.current
                  );
                }

                typingTimeoutRef.current =
                  setTimeout(
                    sendTypingEvent,
                    500
                  );
              }}

              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  e.preventDefault();

                  sendMessage();
                }
              }}

              placeholder="Type a message..."
            />

            <button
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"

              onClick={sendMessage}
            >

              Send

            </button>

          </div>

        </div>

        {/* MEMBERS SIDEBAR */}

        <div className="w-full lg:w-[320px] border border-zinc-800 bg-zinc-950 rounded-2xl p-4 h-fit">

          <h2 className="text-xl font-bold mb-4">

            Members

          </h2>

          <div className="space-y-3">

            {members.map((member) => (

              <div
                key={member.user_id}

                className="border border-zinc-800 rounded-xl p-3"
              >

                <div className="flex items-center justify-between mb-2">

                  <div>

                    <div className="font-semibold">

                      {member.username}

                    </div>

                    <div className="text-xs text-zinc-400 uppercase">

                      {member.role}

                    </div>

                  </div>

                </div>

                {currentUserRole ===
                  "owner" &&

                  member.role !==
                    "owner" && (

                  <div className="flex gap-2 flex-wrap">

                    {member.role ===
                      "member" && (

                      <button
                        onClick={() =>
                          handlePromote(
                            member.user_id
                          )
                        }

                        className="bg-blue-600 hover:bg-blue-700 transition px-3 py-1 rounded-lg text-sm"
                      >

                        Promote

                      </button>
                    )}

                    {member.role ===
                      "admin" && (

                      <button
                        onClick={() =>
                          handleDemote(
                            member.user_id
                          )
                        }

                        className="bg-yellow-600 hover:bg-yellow-700 transition px-3 py-1 rounded-lg text-sm"
                      >

                        Demote

                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleRemove(
                          member.user_id
                        )
                      }

                      className="bg-red-600 hover:bg-red-700 transition px-3 py-1 rounded-lg text-sm"
                    >

                      Remove

                    </button>

                  </div>
                )}

                {currentUserRole ===
                  "admin" &&

                  member.role ===
                    "member" && (

                  <button
                    onClick={() =>
                      handleRemove(
                        member.user_id
                      )
                    }

                    className="bg-red-600 hover:bg-red-700 transition px-3 py-1 rounded-lg text-sm"
                  >

                    Remove

                  </button>
                )}

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}