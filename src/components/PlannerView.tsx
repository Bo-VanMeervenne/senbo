import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PlannerColumn from "./PlannerColumn";
import PlannerCard from "./PlannerCard";

type Stage = "idea" | "tomorrow" | "special";
type Board = "senbo" | "senne";

interface PlannerItem {
  id: string;
  link: string;
  stage: Stage;
  position: number;
  created_at: string;
  thumbnail?: string | null;
  title?: string | null;
  board?: string;
  platform?: "instagram" | "youtube" | "tiktok";
}

const STAGES: { id: Stage; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "special", label: "Special" },
];

const detectPlatform = (url: string): "instagram" | "youtube" | "tiktok" | null => {
  if (url.includes("instagram.com") || url.includes("instagr.am")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com") || url.includes("vm.tiktok")) return "tiktok";
  return null;
};

const PlannerView = () => {
  const [activeBoard, setActiveBoard] = useState<Board>("senbo");
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [newLink, setNewLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeItem, setActiveItem] = useState<PlannerItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  useEffect(() => {
    fetchItems();
  }, [activeBoard]);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("planner_items")
      .select("*")
      .eq("board", activeBoard)
      .order("position", { ascending: true });

    if (error) {
      toast.error("Failed to load items");
      console.error(error);
    } else {
      const enrichedItems = (data || []).map((item) => ({
        ...item,
        stage: item.stage as Stage,
        platform: detectPlatform(item.link),
      }));
      setItems(enrichedItems);
    }
    setIsLoading(false);
  };

  const fetchThumbnail = async (url: string): Promise<{ thumbnail: string | null; title: string | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-video-thumbnail', {
        body: { url }
      });
      if (error) {
        console.error('Thumbnail fetch error:', error);
        return { thumbnail: null, title: null };
      }
      return { thumbnail: data?.thumbnail || null, title: data?.title || null };
    } catch (e) {
      console.error('Thumbnail fetch failed:', e);
      return { thumbnail: null, title: null };
    }
  };

  const addItem = async () => {
    if (!newLink.trim()) return;

    const platform = detectPlatform(newLink);
    if (!platform) {
      toast.error("Please enter a valid Instagram, YouTube, or TikTok link");
      return;
    }

    setIsAdding(true);
    
    const { thumbnail, title } = await fetchThumbnail(newLink.trim());
    
    const maxPosition = Math.max(0, ...items.filter(i => i.stage === "idea").map(i => i.position));

    const { data, error } = await supabase
      .from("planner_items")
      .insert({ 
        link: newLink.trim(), 
        stage: "idea", 
        position: maxPosition + 1,
        thumbnail,
        title,
        board: activeBoard
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add item");
      console.error(error);
    } else {
      const newItem: PlannerItem = {
        ...data,
        stage: data.stage as Stage,
        platform,
      };
      setItems([...items, newItem]);
      setNewLink("");
      toast.success("Added to Idea");
    }
    setIsAdding(false);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("planner_items").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetStage = STAGES.find((s) => s.id === overId)?.id;
    
    if (targetStage) {
      const item = items.find((i) => i.id === activeId);
      if (item && item.stage !== targetStage) {
        const updatedItems = items.map((i) =>
          i.id === activeId ? { ...i, stage: targetStage } : i
        );
        setItems(updatedItems);

        const { error } = await supabase
          .from("planner_items")
          .update({ stage: targetStage })
          .eq("id", activeId);

        if (error) {
          toast.error("Failed to move item");
          fetchItems();
        }
      }
    } else {
      const overItem = items.find((i) => i.id === overId);
      if (overItem) {
        const item = items.find((i) => i.id === activeId);
        if (item && item.stage !== overItem.stage) {
          const updatedItems = items.map((i) =>
            i.id === activeId ? { ...i, stage: overItem.stage } : i
          );
          setItems(updatedItems);

          const { error } = await supabase
            .from("planner_items")
            .update({ stage: overItem.stage })
            .eq("id", activeId);

          if (error) {
            toast.error("Failed to move item");
            fetchItems();
          }
        }
      }
    }
  };

  const getItemsByStage = (stage: Stage) =>
    items.filter((item) => item.stage === stage);

  return (
    <div className="px-4 pb-8">
      {/* Board tabs */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center p-1 bg-secondary/50 backdrop-blur-xl rounded-full border border-border/30">
          <button
            onClick={() => setActiveBoard("senbo")}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              activeBoard === "senbo"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SenBo
          </button>
          <button
            onClick={() => setActiveBoard("senne")}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              activeBoard === "senne"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Senne
          </button>
        </div>
      </div>

      {/* Add new item */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Paste TikTok, Instagram, or YouTube link..."
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} disabled={isAdding || !newLink.trim()}>
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STAGES.map((stage) => (
              <PlannerColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                items={getItemsByStage(stage.id)}
                onDelete={deleteItem}
              />
            ))}
          </div>

          <DragOverlay>
            {activeItem ? (
              <PlannerCard item={activeItem} onDelete={() => {}} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default PlannerView;
