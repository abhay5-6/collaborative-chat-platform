"use client";

import Link from "next/link";

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

import {
  Network,
  Wifi,
  Users,
  SendHorizonal,
} from "lucide-react";

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

import {
  sendCollaborationRequest,
  getCollaborators,
} from "@/lib/api/collaborators";


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

  const [collaborators, setCollaborators] =
    useState<number[]>([]);

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

    async function loadCollaborators() {

      try {

        const data =
          await getCollaborators();

        setCollaborators(

          data.map(
            (user: any) => user.id
          )
        );

      } catch (error) {

        console.error(error);
      }
    }

    loadCollaborators();

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


  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth"
      });

  }, [messages]);


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


  async function handleCollaborate(
    userId: number
  ) {

    try {

      await sendCollaborationRequest(
        userId
      );

      toast.success(
        "Collaboration request sent"
      );

    } catch (error: any) {

      toast.error(

        error?.response?.data?.detail ||

        "Failed to send request"
      );
    }
  }


  if (loading) {

    return (

      <div className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
      ">

        <LoadingSpinner />

      </div>
    );
  }


  return (

    <div className="
      min-h-screen
      bg-black
      text-white
      px-4
      sm:px-6
      md:px-10
      py-6
      flex
      flex-col
    ">

      <div className="
        max-w-7xl
        w-full
        mx-auto
        flex
        gap-6
        flex-1
        flex-col
        lg:flex-row
      ">

        {/* CHAT */}

        <div className="
          flex-1
          flex
          flex-col
        ">

          {/* HEADER */}

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-6
            mb-6
          ">

            <div>

              <div className="
                flex
                items-center
                gap-3
                mb-2
              ">

                <h1 className="
                  text-4xl
                  font-bold
                  tracking-tight
                ">

                  Room {roomId}

                </h1>

                <Link
                  href={`/rooms/${roomId}/graph`}
                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-xl
                    bg-white
                    text-black
                    text-sm
                    font-semibold
                    hover:scale-105
                    transition
                  "
                >

                  <Network size={16} />

                  Graph

                </Link>

              </div>

              <div className="
                flex
                items-center
                gap-2
                text-sm
              ">

                <Wifi size={14} />

                <span
                  className={`
                    font-semibold
                    ${
                      connectionStatus ===
                      "Connected"

                        ? "text-green-500"

                        : connectionStatus ===
                          "Connecting..."

                        ? "text-yellow-500"

                        : "text-red-500"
                    }
                  `}
                >

                  {connectionStatus}

                </span>

              </div>

            </div>


            <div className="
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
            ">

              <Users size={18} />

              <div className="
                text-sm
                text-zinc-300
              ">

                {onlineUsers.length > 0

                  ? onlineUsers.join(", ")

                  : "No users online"}

              </div>

            </div>

          </div>


          {/* MESSAGES */}

          <div className="
            border
            border-zinc-800
            bg-zinc-950/80
            backdrop-blur-xl
            rounded-3xl
            p-6
            shadow-2xl
            flex-1
            overflow-y-auto
            min-h-[400px]
            max-h-[65vh]
            mb-4
          ">

            {messages.length === 0 && (

              <div className="
                text-zinc-500
                text-center
                mt-10
              ">

                No messages yet.

              </div>
            )}

            <div className="
              flex
              flex-col
              gap-3
            ">

              {messages.map(
                (msg, index) => (

                  <div
                    key={`${msg.id}-${index}`}
                    className="
                      bg-zinc-900/80
                      border
                      border-zinc-800
                      rounded-2xl
                      px-5
                      py-4
                      backdrop-blur-lg
                      shadow-lg
                    "
                  >

                    <div className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      mb-2
                    ">

                      <div className="
                        text-sm
                        font-semibold
                        text-white
                      ">

                        {msg.username ||
                          "User"}

                      </div>

                      <div className="
                        text-xs
                        text-zinc-500
                      ">

                        {formatTime(
                          msg.created_at
                        )}

                      </div>

                    </div>

                    <div className="
                      text-zinc-300
                      break-words
                      leading-relaxed
                    ">

                      {msg.content ||
                        msg.message}

                    </div>

                  </div>
                )
              )}

              <div ref={messagesEndRef} />

            </div>

          </div>


          {/* TYPING */}

          {typingUser && (

            <div className="
              mb-3
              text-sm
              text-zinc-400
              italic
              animate-pulse
            ">

              {typingUser} is typing...

            </div>
          )}


          {/* INPUT */}

          <div className="
            flex
            items-center
            gap-3
            mt-2
          ">

            <input
              className="
                flex-1
                bg-zinc-950
                border
                border-zinc-800
                rounded-2xl
                px-5
                py-4
                outline-none
                text-white
                text-sm
                focus:border-white
                transition
              "

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

              placeholder="
                Share ideas, architecture,
                or implementation thoughts...
              "
            />

            <button
              className="
                h-14
                w-14
                rounded-2xl
                bg-white
                text-black
                flex
                items-center
                justify-center
                hover:scale-105
                transition
                shadow-xl
              "

              onClick={sendMessage}
            >

              <SendHorizonal size={18} />

            </button>

          </div>

        </div>


        {/* SIDEBAR */}

        <div className="
          w-full
          lg:w-[320px]
          border
          border-zinc-800
          bg-zinc-950/80
          backdrop-blur-xl
          rounded-3xl
          shadow-2xl
          p-5
          h-fit
        ">

          <h2 className="
            text-2xl
            font-bold
            mb-5
          ">

            Members

          </h2>

          <div className="
            space-y-4
          ">

            {members.map((member) => (

              <div
                key={member.user_id}

                className="
                  border
                  border-zinc-800
                  rounded-2xl
                  p-4
                  bg-zinc-900/60
                "
              >

                {member.username !==
                  currentUsername &&

                !collaborators.includes(
                    member.user_id
                  ) && (

                  <button
                    onClick={() =>
                      handleCollaborate(
                        member.user_id
                      )
                    }

                    className="
                      mb-3
                      w-full
                      bg-zinc-800
                      hover:bg-zinc-700
                      transition
                      rounded-xl
                      py-2
                      text-sm
                      font-medium
                    "
                  >

                    Collaborate

                  </button>
                )}

                <div className="
                  flex
                  items-center
                  justify-between
                  mb-3
                ">

                  <div>

                    <div className="
                      font-semibold
                      text-white
                    ">

                      {member.username}

                    </div>

                    <div className="
                      text-xs
                      text-zinc-400
                      uppercase
                    ">

                      {member.role}

                    </div>

                  </div>

                </div>

                {currentUserRole ===
                  "owner" &&

                  member.role !==
                    "owner" && (

                  <div className="
                    flex
                    gap-2
                    flex-wrap
                  ">

                    {member.role ===
                      "member" && (

                      <button
                        onClick={() =>
                          handlePromote(
                            member.user_id
                          )
                        }

                        className="
                          bg-blue-600
                          hover:bg-blue-700
                          transition
                          px-3
                          py-1.5
                          rounded-xl
                          text-sm
                        "
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

                        className="
                          bg-yellow-600
                          hover:bg-yellow-700
                          transition
                          px-3
                          py-1.5
                          rounded-xl
                          text-sm
                        "
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

                      className="
                        bg-red-600
                        hover:bg-red-700
                        transition
                        px-3
                        py-1.5
                        rounded-xl
                        text-sm
                      "
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

                    className="
                      bg-red-600
                      hover:bg-red-700
                      transition
                      px-3
                      py-1.5
                      rounded-xl
                      text-sm
                    "
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