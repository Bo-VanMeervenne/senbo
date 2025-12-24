import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Coins } from "lucide-react";

interface Video {
  title: string;
  url: string;
  videoId: string | null;
  views: number;
  revenue: number;
}

const fetchVideos = async (): Promise<Video[]> => {
  const { data, error } = await supabase.functions.invoke('get-videos');
  if (error) throw new Error(error.message);
  return data?.videos || [];
};

const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
  return views.toString();
};

// Video revenue is in dollars
const formatRevenue = (revenue: number): string => {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(revenue);
};

const VideoCard = ({ video, index }: { video: Video; index: number }) => {
  const thumbnailUrl = video.videoId 
    ? `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`
    : null;
  const fallbackUrl = video.videoId
    ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
    : null;

  const handleClick = () => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
      e.currentTarget.src = fallbackUrl;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-4 bg-secondary">
        {thumbnailUrl && (
          <img 
            src={thumbnailUrl}
            alt={video.title}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">{formatViews(video.views)} views</span>
            <span className="font-mono text-lg font-semibold text-emerald-400">{formatRevenue(video.revenue)}</span>
          </div>
        </div>
      </div>
      
      <p className="text-foreground/80 text-sm leading-relaxed line-clamp-2 group-hover:text-foreground transition-colors">
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

type SortOption = 'views' | 'revenue' | 'none';

const VideosView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('none');

  const { data: videos, isLoading, isError } = useQuery({
    queryKey: ['videos'],
    queryFn: fetchVideos,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const filteredAndSortedVideos = useMemo(() => {
    if (!videos) return [];
    let result = [...videos];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(video => video.title.toLowerCase().includes(query));
    }
    
    if (sortBy === 'views') result.sort((a, b) => b.views - a.views);
    else if (sortBy === 'revenue') result.sort((a, b) => b.revenue - a.revenue);
    
    return result;
  }, [videos, searchQuery, sortBy]);

  // Total in dollars (video revenue is in dollars)
  const totalRevenue = useMemo(() => {
    if (!videos) return 0;
    return videos.reduce((sum, v) => sum + v.revenue, 0);
  }, [videos]);

  const totalViews = useMemo(() => {
    if (!videos) return 0;
    return videos.reduce((sum, v) => sum + v.views, 0);
  }, [videos]);

  return (
    <div className="min-h-[calc(100vh-96px)] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b border-border/50">
          <div className="flex items-center gap-10">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Views</p>
              <p className="text-2xl font-medium text-foreground">{formatViews(totalViews)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-2xl font-medium">
                <span className="text-primary">$</span>
                <span className="font-mono text-foreground">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(totalRevenue)}
                </span>
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-52 pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            <button
              onClick={() => setSortBy(sortBy === 'revenue' ? 'none' : 'revenue')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border transition-all ${
                sortBy === 'revenue'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              <Coins className="w-4 h-4" />
              Revenue
            </button>
          </div>
        </div>

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
              <VideoCard key={index} video={video} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosView;
