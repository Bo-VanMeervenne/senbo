import { useDraggable } from "@dnd-kit/core";
import { X, Link } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PlatformIcon from "./PlatformIcon";

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
}

interface PlannerCardProps {
  item: PlannerItem;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

const PlannerCard = ({ item, onDelete, isDragging = false }: PlannerCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const platformColors = {
    instagram: "from-pink-500/20 to-purple-500/20",
    youtube: "from-red-500/20 to-red-600/20",
    tiktok: "from-cyan-500/20 to-pink-500/20",
  };

  // Use title if available, otherwise show platform name
  const getDisplayText = () => {
    if (item.title) {
      return item.title.length > 60 ? item.title.slice(0, 57) + "..." : item.title;
    }
    return item.platform ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1) : "Link";
  };

  // Proxy Instagram thumbnails through edge function
  const getThumbnailUrl = () => {
    if (!item.thumbnail) return null;
    
    if (item.thumbnail.includes('cdninstagram.com') || item.thumbnail.includes('fbcdn.net')) {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ig-thumbnail-proxy?url=${encodeURIComponent(item.thumbnail)}`;
      return proxyUrl;
    }
    
    return item.thumbnail;
  };

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(item.link);
    toast.success("Link copied!");
  };

  const thumbnailUrl = getThumbnailUrl();

  const platformIconColors = {
    instagram: "text-pink-400",
    youtube: "text-red-500",
    tiktok: "text-cyan-400",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative bg-gradient-to-br ${
        item.platform ? platformColors[item.platform] : "from-muted/50 to-muted/30"
      } rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-90 scale-105 shadow-xl" : "hover:shadow-lg"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
    >
      {/* Delete button - top left */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 left-1 z-10 p-1 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Copy link button - top right */}
      {isHovered && (
        <button
          onClick={copyLink}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 z-10 p-1 bg-primary/80 hover:bg-primary text-primary-foreground rounded-full transition-colors"
        >
          <Link className="w-3 h-3" />
        </button>
      )}

      {/* Thumbnail */}
      {thumbnailUrl ? (
        <div className="aspect-video w-full relative">
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Platform icon - bottom left of thumbnail */}
          {item.platform && (
            <div className={`absolute bottom-1 left-1 p-1 bg-black/60 rounded ${platformIconColors[item.platform]}`}>
              <PlatformIcon platform={item.platform} className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-muted/30 relative">
          <span className="text-3xl">{item.platform === "instagram" ? "📸" : item.platform === "youtube" ? "▶️" : item.platform === "tiktok" ? "🎵" : "🔗"}</span>
          {/* Platform icon - bottom left */}
          {item.platform && (
            <div className={`absolute bottom-1 left-1 p-1 bg-black/60 rounded ${platformIconColors[item.platform]}`}>
              <PlatformIcon platform={item.platform} className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      )}

      {/* Title/Link info */}
      <div className="p-2">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-xs text-muted-foreground hover:text-foreground line-clamp-2 block"
        >
          {getDisplayText()}
        </a>
      </div>
    </div>
  );
};

export default PlannerCard;
