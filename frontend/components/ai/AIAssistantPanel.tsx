"use client";

import {
  useState,
  useEffect
} from "react";

import {
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
  Loader
} from "lucide-react";

import {
  searchRoom,
  queryRoom,
  getRoomSummary,
  SearchResult
} from "@/lib/api/ai";

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
          bg-white
          text-black
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
          bg-zinc-950/95
          backdrop-blur-xl
          border-l
          border-zinc-800
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
        {/* HEADER */}
        <div className="
          p-6
          border-b
          border-zinc-800
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
              text-white
            ">
              AI Assistant
            </h2>
          </div>

          <button
            onClick={onToggle}
            className="
              text-zinc-400
              hover:text-white
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
                  bg-zinc-900
                  border
                  border-zinc-700
                  rounded-xl
                  px-4
                  py-2
                  text-white
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
                  text-white
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
                  text-zinc-400
                  hover:text-zinc-300
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
                  bg-zinc-900
                  border
                  border-zinc-700
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
                          text-zinc-300
                          hover:bg-zinc-800
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
                    text-zinc-300
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
                    text-zinc-300
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
                            bg-zinc-900/50
                            border
                            border-zinc-700
                            rounded-lg
                            p-3
                          "
                        >
                          <div className="
                            text-xs
                            text-zinc-400
                            mb-1
                          ">
                            {memory.memory_type}
                          </div>
                          <p className="
                            text-sm
                            text-zinc-300
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
                    text-zinc-300
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
                            bg-zinc-900/50
                            border
                            border-zinc-700
                            rounded-lg
                            p-3
                          "
                        >
                          <div className="
                            text-xs
                            text-zinc-400
                            mb-1
                          ">
                            Score:{" "}
                            {msg.score.toFixed(
                              2
                            )}
                          </div>
                          <p className="
                            text-sm
                            text-zinc-300
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
              text-zinc-400
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
            bg-black/20
            z-20
            lg:hidden
          "
        />
      )}
    </>
  );
}
