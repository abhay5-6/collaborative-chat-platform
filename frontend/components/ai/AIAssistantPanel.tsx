"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ChevronRight,
  ChevronLeft,
  Check,
  Clock3,
  Pencil,
  Trash2,
  X,
  Search,
  Sparkles,
  Loader
} from "lucide-react";

import {
  searchRoom,
  queryRoom,
  SearchResult
} from "@/lib/api/ai";
import {
  getRoomMemories,
  pruneMemory,
  reinforceMemory,
  updateRoomMemory,
} from "@/lib/api/memories";
import type { RoomMemory } from "@/lib/api/memories";
import StaleMemoryAlerts from "./StaleMemoryAlerts";

interface AIAssistantPanelProps {
  roomId: number;
  isOpen: boolean;
  onToggle: () => void;
}

const PREBUILT_QUERIES = [
  "What decisions have we made?",
  "What are current tasks?",
  "Summarize this room",
  "What are unresolved bugs?",
  "What is the architecture?",
  "Key learnings and insights",
];

export default function AIAssistantPanel({
  roomId,
  isOpen,
  onToggle,
}: AIAssistantPanelProps) {
  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [results, setResults] =
    useState<SearchResult | null>(null);

  const [answer, setAnswer] =
    useState<string | null>(null);

  const [showPrebuilt, setShowPrebuilt] =
    useState(false);

  const [memories, setMemories] = useState<RoomMemory[]>([]);

  const [memoryLoading, setMemoryLoading] = useState(false);

  const [memoryActionId, setMemoryActionId] = useState<number | null>(null);

  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);

  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let mounted = true;

    async function loadMemories() {
      try {
        setMemoryLoading(true);
        const data = await getRoomMemories(roomId);
        if (mounted) {
          setMemories(data);
        }
      } catch (error) {
        console.error("Failed to load room memories", error);
      } finally {
        if (mounted) {
          setMemoryLoading(false);
        }
      }
    }

    void loadMemories();

    return () => {
      mounted = false;
    };
  }, [isOpen, roomId]);

  async function handleReinforceMemory(memoryId: number) {
    try {
      setMemoryActionId(memoryId);
      await reinforceMemory(roomId, memoryId);
      setMemories((current) =>
        current.map((memory) =>
          memory.id === memoryId
            ? { ...memory, last_reinforced_at: new Date().toISOString() }
            : memory
        )
      );
    } catch (error) {
      console.error("Failed to reinforce room memory", error);
    } finally {
      setMemoryActionId(null);
    }
  }

  async function handleForgetMemory(memoryId: number) {
    try {
      setMemoryActionId(memoryId);
      await pruneMemory(roomId, memoryId);
      setMemories((current) => current.filter((memory) => memory.id !== memoryId));
    } catch (error) {
      console.error("Failed to forget room memory", error);
    } finally {
      setMemoryActionId(null);
    }
  }

  function startEditingMemory(memory: RoomMemory) {
    setEditingMemoryId(memory.id);
    setEditingContent(memory.content);
  }

  function cancelEditingMemory() {
    setEditingMemoryId(null);
    setEditingContent("");
  }

  async function handleUpdateMemory(memoryId: number) {
    if (!editingContent.trim()) {
      return;
    }

    try {
      setMemoryActionId(memoryId);
      const updated = await updateRoomMemory(roomId, memoryId, {
        content: editingContent.trim(),
      });
      setMemories((current) =>
        current.map((memory) => memory.id === memoryId ? updated : memory)
      );
      cancelEditingMemory();
    } catch (error) {
      console.error("Failed to update room memory", error);
    } finally {
      setMemoryActionId(null);
    }
  }

  async function handleSearch() {
    if (!query.trim()) {
      return;
    }

    try {
      setLoading(true);
      setAnswer(null);

      const result =
        await searchRoom(
          roomId,
          query
        );

      setResults(result);

      const aiAnswer =
        await queryRoom(
          roomId,
          query
        );

      setAnswer(aiAnswer.answer);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handlePrebuiltQuery(q: string) {
    setQuery(q);
    setShowPrebuilt(false);
  }

  return (
    <>
      {/* TOGGLE BUTTON */}
      <button
        onClick={onToggle}
        className="
          fixed
          right-4
          top-1/2
          -translate-y-1/2
          z-40
          bg-primary
          text-primary-foreground
          p-2
          rounded-full
          hover:scale-110
          transition
          shadow-lg
          lg:hidden
        "
      >
        {isOpen ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </button>

      {/* PANEL */}
      <div
        className={`
          fixed
          right-0
          top-0
          h-screen
          w-full
          sm:w-96
          bg-background/95
          backdrop-blur-xl
          border-l
          border-border
          transform
          transition-transform
          duration-300
          z-30
          overflow-hidden
          flex
          flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* STALE MEMORY ALERTS */}
      <StaleMemoryAlerts roomId={roomId} />

      {/* CHAT AREA */}
        {/* HEADER */}
        <div className="
          p-6
          border-b
          border-border
          flex
          items-center
          justify-between
        ">
          <div className="
            flex
            items-center
            gap-2
          ">
            <Sparkles
              size={20}
              className="text-blue-400"
            />
            <h2 className="
              text-xl
              font-bold
              text-foreground
            ">
              AI Assistant
            </h2>
          </div>

          <button
            onClick={onToggle}
            className="
              text-muted-foreground
              hover:text-foreground
              transition
            "
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="
          flex-1
          overflow-y-auto
          p-6
          space-y-6
        ">
          <section className="space-y-3 border-b border-border pb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Room memory
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review what Rework remembers and why it exists.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {memories.length} recent
              </span>
            </div>

            {memoryLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader size={13} className="animate-spin" />
                Loading room memory
              </div>
            ) : memories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                Save a useful message to start the room memory.
              </p>
            ) : (
              <div className="space-y-2">
                {memories.slice(0, 5).map((memory) => (
                  <div
                    key={memory.id}
                    className="rounded-lg border border-border bg-muted/40 p-3"
                  >
                    {editingMemoryId === memory.id ? (
                      <textarea
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        className="min-h-24 w-full resize-y rounded-md border border-border bg-background p-2 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Edit room memory"
                      />
                    ) : (
                      <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                        {memory.content}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{memory.memory_type}</span>
                      <span aria-hidden="true">•</span>
                      {memory.source_type === "message" && memory.source_id ? (
                        <a
                          href={`/rooms/${roomId}#message-${memory.source_id}`}
                          className="text-primary hover:underline"
                        >
                          Message #{memory.source_id}
                        </a>
                      ) : (
                        <span>Manual note</span>
                      )}
                      <span aria-hidden="true">•</span>
                      <span>
                        By {memory.creator_username || `member #${memory.created_by}`}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 size={12} />
                        {Math.round(memory.confidence_score * 100)}% confidence
                      </span>
                      <div className="flex items-center gap-1">
                        {editingMemoryId === memory.id ? (
                          <>
                            <button
                              type="button"
                              onClick={cancelEditingMemory}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
                              title="Cancel edit"
                            >
                              <X size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMemory(memory.id)}
                              disabled={memoryActionId === memory.id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-emerald-600 disabled:opacity-50"
                              title="Save memory correction"
                            >
                              <Check size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditingMemory(memory)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
                              title="Correct this memory"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleForgetMemory(memory.id)}
                              disabled={memoryActionId === memory.id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-red-500 disabled:opacity-50"
                              title="Forget this memory"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReinforceMemory(memory.id)}
                              disabled={memoryActionId === memory.id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-emerald-600 disabled:opacity-50"
                              title="Reinforce this memory"
                            >
                              <Check size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEARCH */}
          <div className="space-y-3">
            <div className="
              flex
              gap-2
            ">
              <input
                value={query}
                onChange={(e) =>
                  setQuery(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleSearch();
                  }
                }}
                placeholder="Ask anything..."
                className="
                  flex-1
                  bg-muted
                  border
                  border-border
                  rounded-xl
                  px-4
                  py-2
                  text-foreground
                  placeholder-zinc-500
                  outline-none
                  focus:border-blue-500
                  transition
                "
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:opacity-50
                  text-foreground
                  p-2
                  rounded-xl
                  transition
                "
              >
                {loading ? (
                  <Loader
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Search size={18} />
                )}
              </button>
            </div>

            {/* PREBUILT QUERIES */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowPrebuilt(
                    !showPrebuilt
                  )
                }
                className="
                  w-full
                  text-sm
                  text-muted-foreground
                  hover:text-foreground
                  transition
                  py-2
                  text-left
                "
              >
                💡 Suggestions
              </button>

              {showPrebuilt && (
                <div className="
                  absolute
                  top-full
                  left-0
                  right-0
                  bg-muted
                  border
                  border-border
                  rounded-xl
                  mt-2
                  p-2
                  space-y-1
                  z-50
                ">
                  {PREBUILT_QUERIES.map(
                    (q) => (
                      <button
                        key={q}
                        onClick={() =>
                          handlePrebuiltQuery(
                            q
                          )
                        }
                        className="
                          w-full
                          text-left
                          text-sm
                          text-foreground
                          hover:bg-card
                          p-2
                          rounded-lg
                          transition
                        "
                      >
                        {q}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RESULTS */}
          {results && (
            <div className="space-y-4">
              {/* AI ANSWER */}
              {answer && (
                <div className="
                  bg-blue-900/20
                  border
                  border-blue-700/30
                  rounded-xl
                  p-4
                  space-y-2
                ">
                  <h3 className="
                    text-sm
                    font-semibold
                    text-blue-300
                  ">
                    Answer
                  </h3>
                  <p className="
                    text-sm
                    text-foreground
                    leading-relaxed
                  ">
                    {answer}
                  </p>
                </div>
              )}

              {/* MEMORIES */}
              {results.memories.length >
                0 && (
                <div className="space-y-2">
                  <h3 className="
                    text-sm
                    font-semibold
                    text-foreground
                  ">
                    📚 Memories (
                    {results.memories.length}
                    )
                  </h3>
                  <div className="space-y-2">
                    {results.memories.map(
                      (memory) => (
                        <div
                          key={memory.id}
                          className="
                            bg-muted/50
                            border
                            border-border
                            rounded-lg
                            p-3
                          "
                        >
                          <div className="
                            text-xs
                            text-muted-foreground
                            mb-1
                          ">
                            {memory.memory_type}
                          </div>
                          <p className="
                            text-sm
                            text-foreground
                            line-clamp-2
                          ">
                            {memory.content}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* MESSAGES */}
              {results.messages.length >
                0 && (
                <div className="space-y-2">
                  <h3 className="
                    text-sm
                    font-semibold
                    text-foreground
                  ">
                    💬 Messages (
                    {results.messages.length}
                    )
                  </h3>
                  <div className="space-y-2">
                    {results.messages.map(
                      (msg) => (
                        <div
                          key={msg.id}
                          className="
                            bg-muted/50
                            border
                            border-border
                            rounded-lg
                            p-3
                          "
                        >
                          <div className="
                            text-xs
                            text-muted-foreground
                            mb-1
                          ">
                            Score:{" "}
                            {msg.score.toFixed(
                              2
                            )}
                          </div>
                          <p className="
                            text-sm
                            text-foreground
                            line-clamp-2
                          ">
                            {msg.content}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!results && !loading && (
            <div className="
              text-center
              text-muted-foreground
              text-sm
              py-8
            ">
              Search for memories,
              messages, or ask questions
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="
            fixed
            inset-0
            bg-background/20
            z-20
            lg:hidden
          "
        />
      )}
    </>
  );
}
