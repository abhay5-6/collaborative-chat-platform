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
import axios from "axios";

import {
  Network,
  Wifi,
  Users,
  SendHorizonal,
  Sparkles,
  Paperclip,
  File as FileIcon,
  Phone,
  PhoneOff,
  X,
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
  getRoom,
  getRoomMembers,
  promoteMember,
  demoteMember,
  removeMember,
  toggleRoomAI
} from "@/lib/api/rooms";

import {
  sendCollaborationRequest,
  getCollaborators,
} from "@/lib/api/collaborators";

import { uploadRoomFile } from "@/lib/api/files";
import AIAssistantPanel from "@/components/ai/AIAssistantPanel";
import TaskList from "@/components/tasks/TaskList";
import { CheckCircle2 } from "lucide-react";
import VideoGrid from "@/components/video/VideoGrid";
import { useWebRTC } from "@/hooks/useWebRTC";


type Message = {
  id: number;
  message?: string;
  content?: string;
  username?: string;
  created_at?: string;
  extra_data?: any;
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

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}


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

  const [room, setRoom] = useState<any>(null);

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

  const [aiEnabled, setAiEnabled] =
    useState(true);

  const [isTasksOpen, setIsTasksOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseWithAI, setParseWithAI] = useState(true);

  const [
    connectionStatus,
    setConnectionStatus
  ] = useState(
    "Connecting..."
  );

  const [aiPanelOpen, setAiPanelOpen] =
    useState(false);

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

  const {
    localStream,
    remoteStreams,
    inCall,
    startCall,
    leaveCall,
    handleSignalingData
  } = useWebRTC(roomId, currentUsername || "", socketRef);

  const handleSignalingDataRef = useRef(handleSignalingData);
  useEffect(() => {
    handleSignalingDataRef.current = handleSignalingData;
  }, [handleSignalingData]);

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

      } catch (error) {

        console.error(error);

        if (
          axios.isAxiosError(error) &&
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

      getRoom(roomId).then((roomData) => {
        setRoom(roomData);
        setAiEnabled(roomData.ai_enabled ?? true);
      }).catch(console.error);
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
            (user: Collaborator) => user.id
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
        
        if ([
          "join_call", 
          "leave_call", 
          "webrtc_offer", 
          "webrtc_answer", 
          "webrtc_ice_candidate"
        ].includes(payload.type)) {
          handleSignalingDataRef.current(payload);
          return;
        }

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
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              setUploadProgress(percentCompleted);
            }
          );
          extraData = {
            file_url: uploadResult.file_url,
            file_name: uploadResult.file_name,
            file_type: uploadResult.file_type,
            ai_parse: parseWithAI && aiEnabled
          };
        }

        socketRef.current?.send(
          JSON.stringify({
            type: "chat_message",
            message: input,
            extra_data: extraData
          })
        );

        setInput("");
        setSelectedFile(null);
        setUploadProgress(0);
      } catch (error) {
        toast.error("Failed to send message");
      }
    }
    executeSend();
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

    } catch (error) {

      toast.error(
        getErrorMessage(
          error,
          "Promotion failed"
        )
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

    } catch (error) {

      toast.error(
        getErrorMessage(
          error,
          "Demotion failed"
        )
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

    } catch (error) {

      toast.error(
        getErrorMessage(
          error,
          "Removal failed"
        )
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

    } catch (error) {

      toast.error(

        getErrorMessage(
          error,
          "Failed to send request"
        )
      );
    }
  }

  async function handleAIToggle() {
    try {
      const newValue = !aiEnabled;
      setAiEnabled(newValue);
      await toggleRoomAI(roomId, newValue);
      toast.success(newValue ? "AI Processing Enabled" : "AI Processing Disabled");
    } catch (error) {
      setAiEnabled(aiEnabled); // revert
      toast.error(getErrorMessage(error, "Failed to toggle AI setting"));
    }
  }


  if (loading || !room) {

    return (

      <div className="
        min-h-screen
        bg-transparent
        text-foreground
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
      bg-transparent
      text-foreground
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

          {/* ROOM HEADER */}

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-6
            mb-6
            bg-muted/50
            p-4
            rounded-2xl
            border
            border-border
            backdrop-blur-md
          ">

            <div className="
              flex
              items-center
              gap-4
            ">

              <div className="
                h-12
                w-12
                rounded-xl
                bg-blue-500/20
                flex
                items-center
                justify-center
                text-blue-400
              ">
                <Network size={24} />
              </div>

              <div>

                <h1 className="
                  text-xl
                  font-bold
                  text-foreground
                  mb-1
                ">
                  {room.name}
                </h1>

                <div className="
                  text-sm
                  text-muted-foreground
                  flex
                  items-center
                  gap-2
                ">
                  {room.is_private ? "Private" : "Public"} • {members.length} members
                </div>

              </div>

            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/rooms/${roomId}/graph`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:scale-105 transition"
              >
                <Network size={16} />
                Graph
              </Link>

              <button
                onClick={() => { setIsTasksOpen(!isTasksOpen); setAiPanelOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105 ${isTasksOpen ? "bg-blue-600 text-foreground" : "bg-card text-foreground"}`}
              >
                <CheckCircle2 size={16} />
                Tasks
              </button>

              {currentUserRole === "owner" && (
                <button
                  onClick={handleAIToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:scale-105 ${aiEnabled ? "bg-indigo-600 text-foreground" : "bg-gray-600 text-gray-300"}`}
                >
                  <Sparkles size={16} />
                  {aiEnabled ? "AI On" : "AI Off"}
                </button>
              )}

              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${aiPanelOpen ? "bg-blue-600 text-foreground" : "bg-card text-foreground hover:bg-zinc-700"}`}
              >
                <Sparkles size={16} />
                AI
              </button>

              {inCall ? (
                <button
                  onClick={leaveCall}
                  className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition"
                >
                  <PhoneOff size={16} />
                  Leave Call
                </button>
              ) : (
                <button
                  onClick={startCall}
                  className="flex items-center gap-2 bg-blue-500 text-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20"
                >
                  <Phone size={16} />
                  Join Call
                </button>
              )}

              <div className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-xl
                bg-card
                text-sm
                font-medium
              ">
                <Wifi
                  size={16}
                  className={
                    connectionStatus === "Connected"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                />
                {connectionStatus}
              </div>
            </div>

          </div>

          {/* VIDEO GRID */}
          {inCall && (
            <VideoGrid 
              localStream={localStream}
              remoteStreams={remoteStreams}
              onLeaveCall={leaveCall}
              currentUser={currentUsername || "You"}
            />
          )}

          {/* MESSAGES */}

          <div className="
            border
            border-border
            bg-background/80
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
                text-muted-foreground
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
                    className={`
                      border
                      rounded-2xl
                      px-5
                      py-4
                      backdrop-blur-lg
                      shadow-lg
                      ${msg.username === "Rework AI" 
                        ? "bg-indigo-950/40 border-indigo-500/30" 
                        : "bg-muted/80 border-border"
                      }
                    `}
                  >

                    <div className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      mb-2
                    ">

                      <div className={`
                        text-sm
                        font-semibold
                        flex
                        items-center
                        gap-2
                        ${msg.username === "Rework AI" ? "text-indigo-400" : "text-foreground"}
                      `}>

                        {msg.username === "Rework AI" && <Sparkles size={16} className="text-indigo-400" />}
                        {msg.username || "User"}

                      </div>

                      <div className="
                        text-xs
                        text-muted-foreground
                      ">

                        {formatTime(
                          msg.created_at
                        )}

                      </div>

                    </div>

                    <div className="
                      text-foreground
                      break-words
                      leading-relaxed
                      whitespace-pre-wrap
                    ">

                      {msg.content ||
                        msg.message}

                      {msg.extra_data?.file_url && (
                        <div className="mt-3">
                          {msg.extra_data.file_type?.startsWith("image/") ? (
                            <img 
                              src={`http://localhost:8000${msg.extra_data.file_url}`} 
                              alt="attachment" 
                              className="max-h-60 rounded-xl border border-border object-cover"
                            />
                          ) : (
                            <a 
                              href={`http://localhost:8000${msg.extra_data.file_url}`} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-zinc-700 transition rounded-xl border border-border w-max"
                            >
                              <FileIcon size={18} className="text-muted-foreground" />
                              <span className="text-sm text-foreground font-medium">{msg.extra_data.file_name}</span>
                            </a>
                          )}
                        </div>
                      )}

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
              text-muted-foreground
              italic
              animate-pulse
            ">

              {typingUser} is typing...

            </div>
          )}

          {/* FILE UPLOAD PREVIEW */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-muted border border-border rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileIcon size={20} className="text-blue-400" />
                <div>
                  <div className="text-sm text-foreground font-medium">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={parseWithAI} 
                    onChange={(e) => setParseWithAI(e.target.checked)}
                    className="accent-blue-500"
                    disabled={!aiEnabled}
                  />
                  <span className="text-sm text-muted-foreground">Parse with AI</span>
                </label>
                
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-3 h-1 w-full bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
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
                bg-background
                border
                border-border
                rounded-2xl
                px-5
                py-4
                outline-none
                text-foreground
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
            
            <label className="
                h-14
                w-14
                rounded-2xl
                bg-card
                text-foreground
                flex
                items-center
                justify-center
                hover:bg-zinc-700
                transition
                cursor-pointer
              ">
              <Paperclip size={18} />
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            <button
              className="
                h-14
                w-14
                rounded-2xl
                bg-primary
                text-primary-foreground
                flex
                items-center
                justify-center
                hover:scale-105
                transition
                shadow-xl
                disabled:opacity-50
              "
              disabled={uploadProgress > 0 && uploadProgress < 100}
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
          border-border
          bg-background/80
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
                  border-border
                  rounded-2xl
                  p-4
                  bg-muted/60
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
                      bg-card
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
                      text-foreground
                    ">

                      {member.username}

                    </div>

                    <div className="
                      text-xs
                      text-muted-foreground
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

      {/* AI ASSISTANT PANEL */}
      <AIAssistantPanel
        roomId={roomId}
        isOpen={aiPanelOpen}
        onToggle={() => setAiPanelOpen(false)}
      />

      {/* TASKS PANEL */}
      <div 
        className={`
          fixed top-0 right-0 h-full w-[400px] z-40 bg-background/80 backdrop-blur-md border-l border-border shadow-2xl transition-transform duration-300 ease-in-out p-6 pt-24
          ${isTasksOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button 
          onClick={() => setIsTasksOpen(false)}
          className="absolute top-6 left-6 p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition"
        >
          <X size={16} />
        </button>
        <div className="mt-8 h-[calc(100%-2rem)]">
          <TaskList roomId={roomId} currentUsername={currentUsername || ""} />
        </div>
      </div>

    </div>
  );
}
