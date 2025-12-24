import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

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
    return (views / 1000).toFixed(1) + 'K';
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
    ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
    : null;

  const handleClick = () => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer bg-card rounded-lg border border-border/30 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] bg-secondary overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No thumbnail
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="text-foreground text-sm font-medium line-clamp-2 mb-3 leading-tight">
          {video.title}
        </h3>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatViews(video.views)} views
          </span>
          <span className="text-primary font-mono font-medium">
            {formatRevenue(video.revenue)}
          </span>
        </div>
      </div>
    </div>
  );
};

const VideosSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="bg-card rounded-lg border border-border/30 overflow-hidden">
        <div className="aspect-[9/16] bg-secondary animate-pulse" />
        <div className="p-4">
          <div className="h-4 bg-secondary animate-pulse rounded mb-2" />
          <div className="h-3 bg-secondary animate-pulse rounded w-2/3" />
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
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(video => 
        video.title.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (sortBy === 'views') {
      result.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'revenue') {
      result.sort((a, b) => b.revenue - a.revenue);
    }
    
    return result;
  }, [videos, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          {/* Sort */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'views' ? 'none' : 'views')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                sortBy === 'views'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50'
              }`}
            >
              Sort by Views
            </button>
            <button
              onClick={() => setSortBy(sortBy === 'revenue' ? 'none' : 'revenue')}
              className={`px-4 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                sortBy === 'revenue'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50'
              }`}
            >
              Sort by Revenue
            </button>
          </div>
        </div>

        {/* Results count */}
        {!isLoading && videos && (
          <p className="text-muted-foreground text-xs mb-4">
            {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {/* Videos Grid */}
        {isLoading ? (
          <VideosSkeleton />
        ) : isError || !videos?.length ? (
          <div className="text-center text-muted-foreground py-20">
            No videos found
          </div>
        ) : filteredAndSortedVideos.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            No videos match your search
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
