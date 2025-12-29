import { useDroppable } from "@dnd-kit/core";
import PlannerCard from "./PlannerCard";

type Stage = "idea" | "tomorrow" | "special";

interface PlannerItem {
  id: string;
  link: string;
  stage: Stage;
  position: number;
  created_at: string;
  thumbnail?: string | null;
  title?: string | null;
  platform?: "instagram" | "youtube" | "tiktok";
  priority?: number | null;
  notes?: string | null;
}

interface PlannerColumnProps {
  id: Stage;
  label: string;
  items: PlannerItem[];
  onDelete: (id: string) => void;
  onSetPriority: (id: string, priority: number | null) => void;
  onSetNotes: (id: string, notes: string | null) => void;
}

const PlannerColumn = ({ id, label, items, onDelete, onSetPriority, onSetNotes }: PlannerColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const stageColors: Record<Stage, string> = {
    idea: "border-blue-500/30 bg-blue-500/5",
    tomorrow: "border-amber-500/30 bg-amber-500/5",
    special: "border-purple-500/30 bg-purple-500/5",
  };

  const headerColors: Record<Stage, string> = {
    idea: "text-blue-400",
    tomorrow: "text-amber-400",
    special: "text-purple-400",
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed p-3 min-h-[300px] transition-colors ${
        stageColors[id]
      } ${isOver ? "ring-2 ring-primary/50" : ""}`}
    >
      <h3 className={`text-sm font-semibold mb-3 ${headerColors[id]}`}>
        {label} <span className="text-muted-foreground">({items.length})</span>
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <PlannerCard key={item.id} item={item} onDelete={onDelete} onSetPriority={onSetPriority} onSetNotes={onSetNotes} />
        ))}
      </div>
    </div>
  );
};

export default PlannerColumn;
