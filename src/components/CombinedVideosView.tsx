import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Coins, Calendar, BarChart3, Clock, ThumbsUp, Share2, UserPlus, ChevronDown, ChevronUp, Play, TrendingUp } from "lucide-react";
import VideoStatsDialog from "./VideoStatsDialog";

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
  source: 'senbo' | 'senne';
}

const fetchAllVideos = async (month: 'last' | 'current'): Promise<Video[]> => {
  const { data, error } = await supabase.functions.invoke('get-all-videos', {
    body: { month }
  });
  if (error) throw new Error(error.message);
  return data?.videos || [];
};

const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
  return views.toString();
};

const formatRevenue = (revenue: number): string => {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(revenue);
};

const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split(', ')[0];
  if (!parts) return '';
  const [day, month] = parts.split('/');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(month) - 1] || month;
  return `${day} ${monthName}`;
};

const VideoCard = ({ 
  video, 
  index,
  onStatsClick 
}: { 
  video: Video; 
  index: number;
  onStatsClick: (video: Video) => void;
}) => {
  const thumbnailUrl = video.thumbnailUrl || 
    (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg` : null);
  const fallbackUrl = video.videoId
    ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
    : null;

  const handleClick = () => {
    onStatsClick(video);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
      e.currentTarget.src = fallbackUrl;
    }
  };

  const shortDate = formatShortDate(video.publishDate);
  const isSenneOnly = video.source === 'senne';

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
    >
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-4 bg-secondary/30">
        {thumbnailUrl && (
          <img 
            src={thumbnailUrl}
            alt={video.title}
            onError={handleImageError}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
        
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${isSenneOnly ? 'from-orange-500/20' : 'from-primary/20'} to-transparent`} />
        </div>
        
        {/* Source badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 backdrop-blur-md rounded-lg flex items-center gap-1.5 border ${
          isSenneOnly 
            ? 'bg-orange-500/20 border-orange-500/30' 
            : 'bg-primary/20 border-primary/30'
        }`}>
          <span className={`text-[10px] font-medium tracking-wide ${isSenneOnly ? 'text-orange-300' : 'text-primary-foreground/80'}`}>
            {isSenneOnly ? 'Senne' : 'S&B'}
          </span>
        </div>

        {/* Date badge */}
        {shortDate && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-white/10">
            <Calendar className="w-3 h-3 text-white/60" />
            <span className="text-white/80 text-[10px] font-medium tracking-wide">{shortDate}</span>
          </div>
        )}

        {/* Stats button overlay */}
        <div className="absolute bottom-12 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <div className={`p-2.5 backdrop-blur-md rounded-xl ${
            isSenneOnly 
              ? 'bg-orange-500 shadow-[0_0_20px_-5px_rgba(249,115,22,0.8)]' 
              : 'bg-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.8)]'
          }`}>
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
        </div>
        
        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-xs font-medium">{formatViews(video.views)} views</span>
            <span className="font-mono text-lg font-semibold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{formatRevenue(video.revenue)}</span>
          </div>
        </div>
      </div>
      
      <p className="text-foreground/60 text-sm leading-relaxed line-clamp-2 group-hover:text-foreground transition-colors duration-300">
        {video.title}
      </p>
    </div>
  );
};

const VideosSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i}>
        <div className="aspect-[9/16] bg-secondary/50 animate-pulse rounded-2xl mb-4" />
        <div className="h-4 bg-secondary/50 animate-pulse rounded w-3/4" />
      </div>
    ))}
  </div>
);

type SortOption = 'newest' | 'oldest' | 'views' | 'revenue' | 'watchTime' | 'likes' | 'shares' | 'subsGained' | 'duration' | 'none';

interface CombinedVideosViewProps {
  month: 'last' | 'current';
}

const CombinedVideosView = ({ month }: CombinedVideosViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const { data: videos, isLoading, isError } = useQuery({
    queryKey: ['all-videos', month],
    queryFn: () => fetchAllVideos(month),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const handleStatsClick = (video: Video) => {
    setSelectedVideo(video);
    setStatsOpen(true);
  };

  const filteredAndSortedVideos = useMemo(() => {
    if (!videos) return [];
    let result = [...videos];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(video => video.title.toLowerCase().includes(query));
    }
    
    const parseDate = (d: string) => {
      if (!d) return new Date(0);
      const [datePart, timePart] = d.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hour, min] = (timePart || '00:00').split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    };

    const parseDuration = (d: string) => {
      if (!d) return 0;
      const parts = d.split(':');
      return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
    };

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => parseDate(b.publishDate).getTime() - parseDate(a.publishDate).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => parseDate(a.publishDate).getTime() - parseDate(b.publishDate).getTime());
        break;
      case 'views':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'revenue':
        result.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'watchTime':
        result.sort((a, b) => b.minutesWatched - a.minutesWatched);
        break;
      case 'likes':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'shares':
        result.sort((a, b) => b.shares - a.shares);
        break;
      case 'subsGained':
        result.sort((a, b) => b.subsGained - a.subsGained);
        break;
      case 'duration':
        result.sort((a, b) => parseDuration(b.avgDuration) - parseDuration(a.avgDuration));
        break;
    }
    
    return result;
  }, [videos, searchQuery, sortBy]);

  const totalRevenue = useMemo(() => {
    if (!videos) return 0;
    return videos.reduce((sum, v) => sum + v.revenue, 0);
  }, [videos]);

  const totalViews = useMemo(() => {
    if (!videos) return 0;
    return videos.reduce((sum, v) => sum + v.views, 0);
  }, [videos]);

  const avgViewsPerVideo = useMemo(() => {
    if (!videos || videos.length === 0) return 0;
    return Math.round(totalViews / videos.length);
  }, [videos, totalViews]);

  return (
    <div className="min-h-[calc(100vh-128px)] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b border-border/30">
          <div className="flex items-center gap-8">
            <div className="group">
              <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-muted-foreground transition-colors">Total Videos</p>
              <p className="text-2xl font-light text-foreground tracking-tight">{videos?.length || 0}</p>
            </div>
            <div className="w-px h-10 bg-border/30" />
            <div className="group">
              <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-muted-foreground transition-colors">Total Views</p>
              <p className="text-2xl font-light text-foreground tracking-tight">{formatViews(totalViews)}</p>
            </div>
            <div className="w-px h-10 bg-border/30" />
            <div className="group">
              <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-muted-foreground transition-colors">Total Revenue</p>
              <p className="text-2xl font-light tracking-tight">
                <span className="text-primary">$</span>
                <span className="font-mono text-foreground">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(totalRevenue)}
                </span>
              </p>
            </div>
            <div className="w-px h-10 bg-border/30" />
            <div className="group">
              <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-muted-foreground transition-colors flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Avg Views
              </p>
              <p className="text-2xl font-light text-foreground tracking-tight">{formatViews(avgViewsPerVideo)}</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border transition-all duration-300 ${
                sortBy === 'newest' || sortBy === 'oldest'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {sortBy === 'oldest' ? 'Oldest' : 'Newest'}
            </button>
            
            <button
              onClick={() => setSortBy(sortBy === 'revenue' ? 'newest' : 'revenue')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border transition-all duration-300 ${
                sortBy === 'revenue'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/50'
              }`}
            >
              <Coins className="w-4 h-4" />
              Revenue
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border transition-all duration-300 ${
                showAdvanced
                  ? 'bg-card text-foreground border-border'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/50'
              }`}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              More
            </button>

            <div className="w-px h-8 bg-border/30 mx-1" />

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 pl-10 pr-4 py-2.5 bg-transparent border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-card/50 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-2 mb-6 -mt-4 animate-fade-in">
            {[
              { key: 'views', label: 'Views', icon: null },
              { key: 'watchTime', label: 'Watch Time', icon: Clock },
              { key: 'likes', label: 'Likes', icon: ThumbsUp },
              { key: 'shares', label: 'Shares', icon: Share2 },
              { key: 'subsGained', label: 'Subs', icon: UserPlus },
              { key: 'duration', label: 'Duration', icon: Play },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as SortOption)}
                className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all duration-300 ${
                  sortBy === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <VideosSkeleton />
        ) : isError || !videos?.length ? (
          <div className="text-center text-muted-foreground py-24">No videos found</div>
        ) : filteredAndSortedVideos.length === 0 ? (
          <div className="text-center text-muted-foreground py-24">No results for "{searchQuery}"</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredAndSortedVideos.map((video, index) => (
              <VideoCard 
                key={video.videoId || index} 
                video={video} 
                index={index}
                onStatsClick={handleStatsClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Dialog */}
      <VideoStatsDialog 
        video={selectedVideo}
        open={statsOpen}
        onOpenChange={setStatsOpen}
      />
    </div>
  );
};

export default CombinedVideosView;
