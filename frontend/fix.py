import sys

file_path = 'c:/Users/abhay/Desktop/Rework - Copy/frontend/app/rooms/[id]/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find the real ending block
correct_lines = lines[:1550] # 0 to 1549

correct_lines.append('''                    className="
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
          fixed top-0 right-0 h-full w-[400px] z-40 bg-zinc-950/80 backdrop-blur-md border-l border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out p-6 pt-24
          ${isTasksOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button 
          onClick={() => setIsTasksOpen(false)}
          className="absolute top-6 left-6 p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition"
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
''')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(correct_lines)
