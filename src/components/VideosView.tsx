import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ArrowUpDown } from "lucide-react";

interface Video {
  title: string;
  url: string;
  videoId: string | null;
  views: number;
  revenue: number;
}

const fetchVideos = async (): Promise<Video[]> => {
  const { data, error } = await supabase.functions.invoke('get-videos');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data?.videos || [];
};

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(0) + 'K';
  }
  return views.toString();
};

const formatRevenue = (revenue: number): string => {
  return '€' + new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(revenue);
};

const VideoCard = ({ video }: { video: Video }) => {
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
      className="group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] rounded-lg overflow-hidden mb-4 bg-secondary">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl}
            alt={video.title}
            onError={handleImageError}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No thumbnail
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Info */}
      <div className="space-y-2">
        <p className="text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {video.title}
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            {formatViews(video.views)}
          </span>
          <span className="text-primary font-mono">
            {formatRevenue(video.revenue)}
          </span>
        </div>
      </div>
    </div>
  );
};

const VideosSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i}>
        <div className="aspect-[9/16] bg-secondary/50 animate-pulse rounded-lg mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-secondary/50 animate-pulse rounded w-full" />
          <div className="h-3 bg-secondary/50 animate-pulse rounded w-2/3" />
        </div>
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
      result = result.filter(video => 
        video.title.toLowerCase().includes(query)
      );
    }
    
    if (sortBy === 'views') {
      result.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'revenue') {
      result.sort((a, b) => b.revenue - a.revenue);
    }
    
    return result;
  }, [videos, searchQuery, sortBy]);

  const totalRevenue = useMemo(() => {
    if (!videos) return 0;
    return videos.reduce((sum, v) => sum + v.revenue, 0);
  }, [videos]);

  return (
    <div className="min-h-[calc(100vh-56px)] px-8 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] mb-2">
              Total Revenue
            </p>
            <p className="font-serif text-4xl text-primary">
              {formatRevenue(totalRevenue)}
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-10 pr-4 py-2 bg-transparent border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            {/* Sort */}
            <button
              onClick={() => {
                const order: SortOption[] = ['none', 'views', 'revenue'];
                const currentIndex = order.indexOf(sortBy);
                setSortBy(order[(currentIndex + 1) % order.length]);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs border border-border rounded text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === 'none' ? 'Sort' : sortBy === 'views' ? 'Views' : 'Revenue'}
            </button>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <VideosSkeleton />
        ) : isError || !videos?.length ? (
          <div className="text-center text-muted-foreground py-24 text-sm">
            No videos found
          </div>
        ) : filteredAndSortedVideos.length === 0 ? (
          <div className="text-center text-muted-foreground py-24 text-sm">
            No results for "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredAndSortedVideos.map((video, index) => (
              <VideoCard key={index} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosView;
