import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, User as UserIcon } from "lucide-react";
import { getRoomTasks, updateTask, Task } from "@/lib/api/tasks";
import { toast } from "sonner";

interface TaskListProps {
  roomId: number;
  currentUsername: string;
}

export default function TaskList({ roomId, currentUsername }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  async function loadTasks() {
    try {
      if (tasks.length === 0) setLoading(true);
      const data = await getRoomTasks(roomId);
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task: Task) {
    try {
      const newStatus = !task.completed;
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newStatus } : t));
      
      await updateTask(roomId, task.id, { completed: newStatus });
      
      if (newStatus) {
        toast.success("Task completed!");
      }
    } catch (error) {
      toast.error("Failed to update task");
      // Revert on error
      loadTasks();
    }
  }

  if (loading) {
    return <div className="p-4 flex items-center justify-center text-muted-foreground text-sm"><Clock size={16} className="animate-spin mr-2" /> Loading action items...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center bg-muted/50 rounded-2xl border border-border">
        <CheckCircle2 size={32} className="mx-auto mb-3 text-zinc-600" />
        <h3 className="text-foreground font-medium mb-1">No action items yet</h3>
        <p className="text-muted-foreground text-sm">When you discuss tasks in chat, the AI will extract them here automatically.</p>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="bg-muted/50 rounded-2xl border border-border overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-border bg-muted">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 size={18} className="text-blue-400" />
            Action Items
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-card text-foreground rounded-lg">
            {completedCount} / {tasks.length} Done
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tasks.map(task => {
          const isMine = task.assignee_username === currentUsername;
          
          return (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task)}
              className={`
                group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                hover:bg-card/80
                ${task.completed ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <div className="mt-0.5 text-muted-foreground group-hover:text-blue-400 transition-colors">
                {task.completed ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <Circle size={18} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm mb-1.5 transition-all duration-200 ${task.completed ? 'text-muted-foreground line-through' : 'text-zinc-200'}`}>
                  {task.description}
                </p>
                
                <div className="flex items-center gap-3">
                  {task.assignee_username && (
                    <span className={`
                      flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md
                      ${isMine ? 'bg-blue-500/20 text-blue-400' : 'bg-card text-muted-foreground'}
                    `}>
                      <UserIcon size={10} />
                      {isMine ? 'You' : task.assignee_username}
                    </span>
                  )}
                  
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
