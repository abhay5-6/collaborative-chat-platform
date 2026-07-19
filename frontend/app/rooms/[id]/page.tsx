"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  AtSign,
  BookmarkPlus,
  Bot,
  CheckCircle2,
  File as FileIcon,
  Hash,
  Lock,
  MessageCircle,
  Network,
  Paperclip,
  PanelRightOpen,
  Phone,
  PhoneOff,
  Search,
  SendHorizonal,
  Shield,
  Sparkles,
  Users,
  Video,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";

import AIAssistantPanel from "@/components/ai/AIAssistantPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import VideoGrid from "@/components/video/VideoGrid";
import { useWebRTC } from "@/hooks/useWebRTC";
import { getMe } from "@/lib/api/auth";
import {
  getCollaborators,
  sendCollaborationRequest,
} from "@/lib/api/collaborators";
import { uploadRoomFile } from "@/lib/api/files";
import { getMessages } from "@/lib/api/messages";
import { createRoomMemory } from "@/lib/api/memories";
import {
  demoteMember,
  getRoom,
  getRoomMembers,
  promoteMember,
  removeMember,
  toggleRoomAI,
} from "@/lib/api/rooms";
import { isAuthenticated } from "@/lib/auth";
import { createChatSocket } from "@/lib/websocket/chat";

type MessageExtraData = {
  file_url?: string;
  file_name?: string;
  file_type?: string;
  ai_parse?: boolean;
};

type Message = {
  id: number;
  message?: string;
  content?: string;
  username?: string;
  created_at?: string;
  extra_data?: MessageExtraData;
};

type RoomMember = {
  user_id: number;
  username: string;
  role: string;
};

type Collaborator = {
  id: number;
  username: string;
};

type Room = {
  id: number;
  name: string;
  is_private: boolean;
  ai_enabled?: boolean;
};

const workspaceChannels = [
  { id: "chat", label: "general", icon: Hash },
  { id: "decisions", label: "decisions", icon: CheckCircle2 },
  { id: "memory", label: "memory", icon: Sparkles },
  { id: "tasks", label: "tasks", icon: PanelRightOpen },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

function formatTime(timestamp?: string) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(timestamp?: string) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name?: string) {
  return (name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Number(params.id);

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [, setOnlineUsers] = useState<string[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<number[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseWithAI, setParseWithAI] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    localStream,
    remoteStreams,
    inCall,
    startCall,
    leaveCall,
    handleSignalingData,
  } = useWebRTC(roomId, currentUsername || "", socketRef);

  const handleSignalingDataRef = useRef(handleSignalingData);

  const aiMessageCount = useMemo(
    () => messages.filter((msg) => msg.username === "Rework AI").length,
    [messages]
  );

  const attachmentCount = useMemo(
    () => messages.filter((msg) => msg.extra_data?.file_url).length,
    [messages]
  );

  useEffect(() => {
    handleSignalingDataRef.current = handleSignalingData;
  }, [handleSignalingData]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getMessages(roomId);
        setMessages(data);
      } catch (error) {
        console.error(error);

        if (axios.isAxiosError(error) && error.response?.status === 403) {
          toast.error("You do not have access to this room");
          router.push("/rooms");
          return;
        }

        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    if (roomId) {
      loadMessages();

      getRoom(roomId)
        .then((roomData) => {
          setRoom(roomData);
          setAiEnabled(roomData.ai_enabled ?? true);
        })
        .catch(console.error);
    }
  }, [roomId, router]);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const user = await getMe();
        setCurrentUsername(user.username);
      } catch (error) {
        console.error(error);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    async function loadCollaborators() {
      try {
        const data = await getCollaborators();
        setCollaborators(data.map((user: Collaborator) => user.id));
      } catch (error) {
        console.error(error);
      }
    }

    loadCollaborators();
  }, []);

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await getRoomMembers(roomId);
        setMembers(data);

        const me = data.find(
          (member: RoomMember) => member.username === currentUsername
        );

        if (me) {
          setCurrentUserRole(me.role);
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (roomId) {
      loadMembers();
    }
  }, [roomId, currentUsername]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let reconnectTimeout: NodeJS.Timeout;
    let isMounted = true;
    const maxReconnects = 5;

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

      const token = localStorage.getItem("token");

      if (!token) {
        setConnectionStatus("Unauthorized");
        return;
      }

      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      cleanupSocket();
      setConnectionStatus("Connecting...");

      const ws = createChatSocket(roomId);
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnectionStatus("Connected");
      };

      ws.onclose = (event) => {
        cleanupSocket();

        if (!isMounted) {
          return;
        }

        if (event.code === 1008) {
          setConnectionStatus("Unauthorized");
          return;
        }

        if (reconnectAttemptsRef.current >= maxReconnects) {
          setConnectionStatus("Connection Failed");
          return;
        }

        reconnectAttemptsRef.current++;
        setConnectionStatus("Disconnected");
        reconnectTimeout = setTimeout(connectSocket, 3000);
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);

        if (
          payload.type.startsWith("webrtc") ||
          payload.type === "join_call" ||
          payload.type === "leave_call"
        ) {
          handleSignalingDataRef.current(payload);
        } else if (
          payload.type === "task_created" ||
          payload.type === "task_updated"
        ) {
          window.dispatchEvent(
            new CustomEvent("task_update", { detail: payload })
          );
        } else if (payload.type === "chat_message") {
          setMessages((prev) => [...prev, payload.data]);
        }

        if (payload.type === "online_users") {
          setOnlineUsers(payload.data.users);
        }

        if (payload.type === "typing") {
          setTypingUser(payload.data.username);
          setTimeout(() => setTypingUser(""), 1500);
        }
      };
    }

    connectSocket();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      cleanupSocket();
    };
  }, [roomId]);

  function sendTypingEvent() {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ type: "typing" }));
  }

  function sendMessage() {
    const socket = socketRef.current;

    if (!socket) {
      toast.error("Socket not connected");
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      toast.error("Socket not ready");
      return;
    }

    if (!input.trim() && !selectedFile) {
      return;
    }

    async function executeSend() {
      try {
        let extraData = {};

        if (selectedFile) {
          const uploadResult = await uploadRoomFile(
            roomId,
            selectedFile,
            (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
              );
              setUploadProgress(percentCompleted);
            }
          );

          extraData = {
            file_url: uploadResult.file_url,
            file_name: uploadResult.file_name,
            file_type: uploadResult.file_type,
            ai_parse: parseWithAI && aiEnabled,
          };
        }

        socketRef.current?.send(
          JSON.stringify({
            type: "chat_message",
            message: input,
            extra_data: extraData,
          })
        );

        setInput("");
        setSelectedFile(null);
        setUploadProgress(0);
      } catch {
        toast.error("Failed to send message");
      }
    }

    executeSend();
  }

  async function handlePromote(userId: number) {
    try {
      await promoteMember(roomId, userId);
      toast.success("Member promoted");
      setMembers(await getRoomMembers(roomId));
    } catch (error) {
      toast.error(getErrorMessage(error, "Promotion failed"));
    }
  }

  async function handleDemote(userId: number) {
    try {
      await demoteMember(roomId, userId);
      toast.success("Member demoted");
      setMembers(await getRoomMembers(roomId));
    } catch (error) {
      toast.error(getErrorMessage(error, "Demotion failed"));
    }
  }

  async function handleRemove(userId: number) {
    try {
      await removeMember(roomId, userId);
      toast.success("Member removed");
      setMembers(await getRoomMembers(roomId));
    } catch (error) {
      toast.error(getErrorMessage(error, "Removal failed"));
    }
  }

  async function handleCollaborate(userId: number) {
    try {
      await sendCollaborationRequest(userId);
      toast.success("Collaboration request sent");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send request"));
    }
  }

  async function handleAIToggle() {
    const previousValue = aiEnabled;

    try {
      const newValue = !aiEnabled;
      setAiEnabled(newValue);
      await toggleRoomAI(roomId, newValue);
      toast.success(newValue ? "AI memory enabled" : "AI memory paused");
    } catch (error) {
      setAiEnabled(previousValue);
      toast.error(getErrorMessage(error, "Failed to toggle AI setting"));
    }
  }

  async function handleSaveMemory(message: Message) {
    const content = (message.content || message.message || "").trim();

    if (!content || !message.id) {
      return;
    }

    try {
      await createRoomMemory(roomId, {
        content,
        source_type: "message",
        source_id: message.id,
        memory_type: "decision",
        importance_score: 3,
      });
      toast.success("Saved to room memory");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save this message"));
    }
  }

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background text-foreground">
      <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:flex border-r border-border bg-muted/30 flex-col">
          <div className="p-4 border-b border-border">
            <Link
              href="/rooms"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back to rooms
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Network size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold truncate">{room.name}</h1>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {room.is_private ? <Lock size={12} /> : <Hash size={12} />}
                  {room.is_private ? "Private workspace" : "Public workspace"}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Search size={15} />
              Search workspace
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Channels
            </div>
            <div className="space-y-1">
              {workspaceChannels.map((channel) => {
                const Icon = channel.icon;
                const active = channel.id === "chat";

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      if (channel.id === "tasks") {
                        setIsTasksOpen(true);
                        setAiPanelOpen(false);
                      }

                      if (channel.id === "memory") {
                        setAiPanelOpen(true);
                        setIsTasksOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <Icon size={16} />
                    {channel.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Direct collaborators
            </div>
            <div className="space-y-1">
              {members.slice(0, 6).map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="truncate">{member.username}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-border">
            <div className="rounded-lg bg-background border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bot size={16} />
                Memory aware
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {aiEnabled
                  ? "Rework is indexing useful room context."
                  : "Memory capture is paused for this room."}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-73px)] min-w-0 flex-col">
          <header className="sticky top-[73px] z-20 border-b border-border bg-background/95 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Hash size={19} className="text-muted-foreground" />
                  <h2 className="truncate text-lg font-semibold">
                    {room.name}
                  </h2>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {members.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={13} />
                    {messages.length} messages
                  </span>
                  <span className="flex items-center gap-1">
                    <Wifi
                      size={13}
                      className={
                        connectionStatus === "Connected"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    />
                    {connectionStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <Link
                  href={`/rooms/${roomId}/graph`}
                  className="h-10 w-10 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition"
                  title="Memory graph"
                >
                  <Network size={17} />
                </Link>

                <button
                  onClick={() => {
                    setAiPanelOpen(!aiPanelOpen);
                    setIsTasksOpen(false);
                  }}
                  className={`h-10 w-10 rounded-lg border border-border flex items-center justify-center transition ${
                    aiPanelOpen
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                  title="AI memory assistant"
                >
                  <Sparkles size={17} />
                </button>

                <button
                  onClick={() => {
                    setIsTasksOpen(!isTasksOpen);
                    setAiPanelOpen(false);
                  }}
                  className={`h-10 w-10 rounded-lg border border-border flex items-center justify-center transition ${
                    isTasksOpen
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                  title="Tasks"
                >
                  <CheckCircle2 size={17} />
                </button>

                {currentUserRole === "owner" && (
                  <button
                    onClick={handleAIToggle}
                    className={`h-10 w-10 rounded-lg border border-border flex items-center justify-center transition ${
                      aiEnabled
                        ? "bg-emerald-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                    title={aiEnabled ? "Pause AI memory" : "Enable AI memory"}
                  >
                    <Bot size={17} />
                  </button>
                )}

                {inCall ? (
                  <button
                    onClick={leaveCall}
                    className="h-10 w-10 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition"
                    title="Leave call"
                  >
                    <PhoneOff size={17} />
                  </button>
                ) : (
                  <button
                    onClick={startCall}
                    className="h-10 w-10 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition"
                    title="Join call"
                  >
                    <Phone size={17} />
                  </button>
                )}
              </div>
            </div>
          </header>

          {inCall && (
            <div className="border-b border-border bg-muted/30 p-4">
              <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
                onLeaveCall={leaveCall}
                currentUser={currentUsername || "You"}
              />
            </div>
          )}

          <section className="flex-1 overflow-y-auto px-3 py-4 md:px-5">
            {messages.length === 0 && (
              <div className="mx-auto mt-16 max-w-md text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center">
                  <Hash size={20} />
                </div>
                <h3 className="font-semibold">Start the channel</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share notes, files, decisions, and questions. The memory layer
                  will keep the useful parts findable.
                </p>
              </div>
            )}

            <div className="mx-auto flex max-w-4xl flex-col gap-1">
              {messages.map((msg, index) => {
                const mine = msg.username === currentUsername;
                const fromAI = msg.username === "Rework AI";
                const previous = messages[index - 1];
                const grouped =
                  previous?.username === msg.username &&
                  previous?.created_at &&
                  msg.created_at &&
                  formatDate(previous.created_at) === formatDate(msg.created_at);

                return (
                  <div
                    key={`${msg.id}-${index}`}
                    className={`flex gap-3 py-1 ${
                      mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!mine && (
                      <div
                        className={`mt-1 h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold ${
                          grouped
                            ? "opacity-0"
                            : fromAI
                              ? "bg-indigo-600 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {fromAI ? <Sparkles size={15} /> : getInitials(msg.username)}
                      </div>
                    )}

                    <div
                      className={`group max-w-[82%] md:max-w-[68%] ${
                        mine ? "items-end" : "items-start"
                      } flex flex-col`}
                    >
                      {!grouped && (
                        <div
                          className={`mb-1 flex items-center gap-2 px-1 text-xs text-muted-foreground ${
                            mine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-medium text-foreground">
                            {mine ? "You" : msg.username || "User"}
                          </span>
                          <span>{formatTime(msg.created_at)}</span>
                        </div>
                      )}

                      <div
                        className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          fromAI
                            ? "bg-indigo-600/10 text-foreground border border-indigo-500/30"
                            : mine
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content || msg.message}
                        </div>

                        {msg.extra_data?.file_url && (
                          <div className="mt-3">
                            {msg.extra_data.file_type?.startsWith("image/") ? (
                              <Image
                                src={`http://localhost:8000${msg.extra_data.file_url}`}
                                alt={msg.extra_data.file_name || "attachment"}
                                width={640}
                                height={360}
                                unoptimized
                                className="max-h-64 w-auto rounded-lg border border-border object-cover"
                              />
                            ) : (
                              <a
                                href={`http://localhost:8000${msg.extra_data.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-max max-w-full items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-foreground transition hover:bg-muted"
                              >
                                <FileIcon size={17} />
                                <span className="truncate text-sm font-medium">
                                  {msg.extra_data.file_name}
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {!fromAI && (msg.content || msg.message) && (
                        <button
                          type="button"
                          onClick={() => handleSaveMemory(msg)}
                          className="mt-1 inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          title="Save message to room memory"
                        >
                          <BookmarkPlus size={13} />
                          Save to memory
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          </section>

          <footer className="border-t border-border bg-background px-3 py-3 md:px-5">
            <div className="mx-auto max-w-4xl">
              {typingUser && (
                <div className="mb-2 px-1 text-xs text-muted-foreground">
                  {typingUser} is typing...
                </div>
              )}

              {selectedFile && (
                <div className="mb-3 rounded-lg border border-border bg-muted p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileIcon size={18} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={parseWithAI}
                          onChange={(event) => setParseWithAI(event.target.checked)}
                          className="accent-emerald-600"
                          disabled={!aiEnabled}
                        />
                        Parse with AI
                      </label>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="h-8 w-8 rounded-md hover:bg-background flex items-center justify-center"
                        title="Remove attachment"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-end gap-2 rounded-lg border border-border bg-muted p-2">
                <label
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-md bg-background hover:bg-card flex items-center justify-center transition"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files && event.target.files.length > 0) {
                        setSelectedFile(event.target.files[0]);
                      }
                    }}
                  />
                </label>

                <textarea
                  className="min-h-10 max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);

                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }

                    typingTimeoutRef.current = setTimeout(sendTypingEvent, 500);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Message #${room.name}`}
                />

                <button
                  className="h-10 w-10 shrink-0 rounded-md bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition disabled:opacity-50"
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                  onClick={sendMessage}
                  title="Send"
                >
                  <SendHorizonal size={18} />
                </button>
              </div>
            </div>
          </footer>
        </main>

        <aside className="hidden xl:flex border-l border-border bg-muted/20 flex-col">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Collaboration hub</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Members, memory signals, files, and room controls.
            </p>
          </div>

          <div className="space-y-4 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="text-lg font-semibold">{members.length}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="text-lg font-semibold">{aiMessageCount}</div>
                <div className="text-xs text-muted-foreground">AI notes</div>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="text-lg font-semibold">{attachmentCount}</div>
                <div className="text-xs text-muted-foreground">Files</div>
              </div>
            </div>

            <button
              onClick={() => {
                setAiPanelOpen(true);
                setIsTasksOpen(false);
              }}
              className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles size={16} />
                Ask room memory
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Search decisions, summaries, bugs, and past context.
              </p>
            </button>

            <button
              onClick={() => {
                setIsTasksOpen(true);
                setAiPanelOpen(false);
              }}
              className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 size={16} />
                Open task board
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Move work through todo, in progress, and done.
              </p>
            </button>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Members</h3>
                <span className="text-xs text-muted-foreground">
                  {currentUserRole || "member"}
                </span>
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="h-8 w-8 shrink-0 rounded-md bg-muted flex items-center justify-center text-xs font-semibold">
                          {getInitials(member.username)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {member.username}
                          </div>
                          <div className="flex items-center gap-1 text-xs uppercase text-muted-foreground">
                            {member.role === "owner" && <Shield size={12} />}
                            {member.role}
                          </div>
                        </div>
                      </div>

                      {member.username !== currentUsername &&
                        !collaborators.includes(member.user_id) && (
                          <button
                            onClick={() => handleCollaborate(member.user_id)}
                            className="h-8 w-8 rounded-md border border-border hover:bg-muted flex items-center justify-center"
                            title="Send collaboration request"
                          >
                            <AtSign size={14} />
                          </button>
                        )}
                    </div>

                    {currentUserRole === "owner" && member.role !== "owner" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.role === "member" && (
                          <button
                            onClick={() => handlePromote(member.user_id)}
                            className="rounded-md bg-muted px-2.5 py-1 text-xs hover:bg-card"
                          >
                            Promote
                          </button>
                        )}

                        {member.role === "admin" && (
                          <button
                            onClick={() => handleDemote(member.user_id)}
                            className="rounded-md bg-muted px-2.5 py-1 text-xs hover:bg-card"
                          >
                            Demote
                          </button>
                        )}

                        <button
                          onClick={() => handleRemove(member.user_id)}
                          className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs text-red-500 hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {currentUserRole === "admin" && member.role === "member" && (
                      <button
                        onClick={() => handleRemove(member.user_id)}
                        className="mt-3 rounded-md bg-red-500/10 px-2.5 py-1 text-xs text-red-500 hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2 xl:hidden">
        <button
          onClick={() => {
            setAiPanelOpen(true);
            setIsTasksOpen(false);
          }}
          className="h-11 w-11 rounded-lg border border-border bg-background shadow-lg flex items-center justify-center"
          title="AI memory"
        >
          <Sparkles size={18} />
        </button>
        <button
          onClick={() => {
            setIsTasksOpen(true);
            setAiPanelOpen(false);
          }}
          className="h-11 w-11 rounded-lg border border-border bg-background shadow-lg flex items-center justify-center"
          title="Tasks"
        >
          <CheckCircle2 size={18} />
        </button>
        <button
          onClick={inCall ? leaveCall : startCall}
          className="h-11 w-11 rounded-lg border border-border bg-background shadow-lg flex items-center justify-center"
          title={inCall ? "Leave call" : "Join call"}
        >
          {inCall ? <PhoneOff size={18} /> : <Video size={18} />}
        </button>
      </div>

      <AIAssistantPanel
        roomId={roomId}
        isOpen={aiPanelOpen}
        onToggle={() => setAiPanelOpen(false)}
      />

      <div
        className={`fixed inset-y-0 right-0 z-40 flex w-[95vw] max-w-6xl flex-col border-l border-border bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          isTasksOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Task board</h2>
            <p className="text-xs text-muted-foreground">
              Shared channel work, ready to drag and organize.
            </p>
          </div>
          <button
            onClick={() => setIsTasksOpen(false)}
            className="h-9 w-9 rounded-md border border-border bg-background hover:bg-muted flex items-center justify-center"
            title="Close task board"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <KanbanBoard roomId={roomId} currentUsername={currentUsername || ""} />
        </div>
      </div>
    </div>
  );
}
