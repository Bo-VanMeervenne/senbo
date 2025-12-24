import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Clock, ThumbsUp, Share2, UserPlus, Calendar, Play, DollarSign } from "lucide-react";

interface Video {
  title: string;
  url: string;
  videoId: string | null;
  views: number;
  revenue: number;
  publishDate: string;
  minutesWatched: number;
  avgDuration: string;
  likes: number;
  shares: number;
  subsGained: number;
  thumbnailUrl: string;
}

interface VideoStatsDialogProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
};

const formatMinutesWatched = (minutes: number): string => {
  if (minutes >= 1000000) return (minutes / 1000000).toFixed(1) + 'M';
  if (minutes >= 1000) return (minutes / 1000).toFixed(1) + 'K';
  return formatNumber(minutes);
};

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  accent = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  subValue?: string;
  accent?: boolean;
}) => (
  <div className={`p-4 rounded-xl border ${accent ? 'bg-primary/10 border-primary/20' : 'bg-card border-border'}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <p className={`text-xl font-semibold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
  </div>
);

const VideoStatsDialog = ({ video, open, onOpenChange }: VideoStatsDialogProps) => {
  if (!video) return null;

  const thumbnailUrl = video.thumbnailUrl || 
    (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg` : null);

  const handleWatchClick = () => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  // Parse date for display
  const formatPublishDate = (dateStr: string) => {
    if (!dateStr) return { date: 'Unknown', time: '' };
    // Format: "20/11/2025, 19:59"
    const parts = dateStr.split(', ');
    return {
      date: parts[0] || dateStr,
      time: parts[1] || ''
    };
  };

  const { date, time } = formatPublishDate(video.publishDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg leading-tight pr-6">{video.title}</DialogTitle>
        </DialogHeader>

        {/* Thumbnail */}
        <div className="relative aspect-[9/16] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden bg-secondary">
          {thumbnailUrl && (
            <img 
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          )}
          {/* Date badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
            <p className="text-white text-xs font-medium">{date}</p>
            {time && <p className="text-white/70 text-[10px]">{time}</p>}
          </div>
        </div>

        {/* Watch button */}
        <button
          onClick={handleWatchClick}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Watch on YouTube
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={DollarSign} 
            label="Revenue" 
            value={`$${video.revenue.toFixed(2)}`}
            accent
          />
          <StatCard 
            icon={Eye} 
            label="Views" 
            value={formatViews(video.views)}
            subValue={formatNumber(video.views) + ' total'}
          />
          <StatCard 
            icon={Clock} 
            label="Watch Time" 
            value={formatMinutesWatched(video.minutesWatched)}
            subValue="minutes watched"
          />
          <StatCard 
            icon={Play} 
            label="Avg Duration" 
            value={video.avgDuration || '0:00'}
          />
          <StatCard 
            icon={ThumbsUp} 
            label="Likes" 
            value={formatNumber(video.likes)}
          />
          <StatCard 
            icon={Share2} 
            label="Shares" 
            value={formatNumber(video.shares)}
          />
          <StatCard 
            icon={UserPlus} 
            label="Subs Gained" 
            value={`+${formatNumber(video.subsGained)}`}
          />
          <StatCard 
            icon={Calendar} 
            label="Published" 
            value={date}
            subValue={time}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoStatsDialog;
