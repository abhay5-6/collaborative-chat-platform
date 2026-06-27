import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Check, Trash2 } from "lucide-react";
import { getStaleMemories, reinforceMemory, pruneMemory } from "@/lib/api/memories";
import { toast } from "sonner";

interface StaleMemoryAlertsProps {
  roomId: number;
}

export default function StaleMemoryAlerts({ roomId }: StaleMemoryAlertsProps) {
  const [staleMemories, setStaleMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaleMemories();
  }, [roomId]);

  async function loadStaleMemories() {
    try {
      setLoading(true);
      const data = await getStaleMemories(roomId, 30); // 30 days old
      setStaleMemories(data);
    } catch (error) {
      console.error("Failed to load stale memories", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReinforce(memoryId: number) {
    try {
      await reinforceMemory(roomId, memoryId);
      setStaleMemories(prev => prev.filter(m => m.id !== memoryId));
      toast.success("Memory reinforced!");
    } catch (error) {
      toast.error("Failed to reinforce memory");
    }
  }

  async function handlePrune(memoryId: number) {
    try {
      await pruneMemory(roomId, memoryId);
      setStaleMemories(prev => prev.filter(m => m.id !== memoryId));
      toast.success("Memory pruned!");
    } catch (error) {
      toast.error("Failed to prune memory");
    }
  }

  if (loading) {
    return <div className="p-4 text-muted-foreground text-sm flex items-center gap-2"><Clock size={14} className="animate-spin" /> Scanning memory vault...</div>;
  }

  if (staleMemories.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 text-amber-500 font-semibold mb-3">
        <AlertTriangle size={18} />
        <h3>At-Risk Knowledge Detected</h3>
      </div>
      
      <p className="text-xs text-amber-200/70 mb-4">
        The following memories haven't been referenced in over 30 days. Review them to ensure the AI's context remains accurate.
      </p>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {staleMemories.map(memory => (
          <div key={memory.id} className="bg-background/20 p-3 rounded-lg border border-white/5">
            <p className="text-sm text-foreground mb-3 line-clamp-3">
              "{memory.content}"
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(memory.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrune(memory.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition"
                >
                  <Trash2 size={12} />
                  Prune
                </button>
                <button 
                  onClick={() => handleReinforce(memory.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-xs font-medium transition"
                >
                  <Check size={12} />
                  Reinforce
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
