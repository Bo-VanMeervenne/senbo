import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Coins, Calendar as CalendarLucide, BarChart3, Clock, ThumbsUp, Share2, UserPlus, ChevronDown, ChevronUp, Play, TrendingUp, Info, Zap } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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

interface VideoTotals {
  senbo: { revenue: number; views: number };
  senne: { revenue: number; views: number };
  combined: { revenue: number; views: number };
}

interface FetchResult {
  videos: Video[];
  totals?: VideoTotals;
}

const fetchAllVideos = async (month: 'last' | 'current'): Promise<FetchResult> => {
  const { data, error } = await supabase.functions.invoke('get-all-videos', {
    body: { month }
  });
  if (error) throw new Error(error.message);
  return { 
    videos: data?.videos || [],
    totals: data?.totals
  };
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
  onStatsClick,
  isOutlier,
  outlierMultiplier
}: { 
  video: Video; 
  index: number;
  onStatsClick: (video: Video) => void;
  isOutlier?: boolean;
  outlierMultiplier?: number;
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
        <div className={`absolute top-3 left-3 px-2.5 py-1 backdrop-blur-md rounded-lg flex items-center gap-1.5 ${
          isSenneOnly 
            ? 'bg-orange-500 text-white' 
            : 'bg-primary text-primary-foreground'
        }`}>
          <span className="text-[10px] font-semibold tracking-wide">
            {isSenneOnly ? 'Senne' : 'SenBo'}
          </span>
        </div>

        {/* Outlier badge */}
        {isOutlier && outlierMultiplier && (
          <div className="absolute top-12 left-3 px-2 py-1 bg-yellow-500 text-black backdrop-blur-md rounded-lg flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span className="text-[10px] font-bold">{outlierMultiplier.toFixed(1)}x</span>
          </div>
        )}

        {/* Date badge */}
        {shortDate && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-white/10">
            <CalendarLucide className="w-3 h-3 text-white/60" />
            <span className="text-white/80 text-[10px] font-medium tracking-wide">{shortDate}</span>
          </div>
        )}

        
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
type SourceFilter = 'all' | 'senbo' | 'senne';

interface DateRange {
  from: Date;
  to: Date;
}

interface CombinedVideosViewProps {
  month: 'last' | 'current';
  sourceFilter: SourceFilter;
}

const VIDEOS_PER_PAGE = 50;

const CombinedVideosView = ({ month, sourceFilter }: CombinedVideosViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PER_PAGE);
  const [showOutliers, setShowOutliers] = useState(false);
  const [outlierThreshold, setOutlierThreshold] = useState(2);

  // Date range based on month tab
  const getDefaultDateRange = (): DateRange => {
    const now = new Date();
    if (month === 'current') {
      return {
        from: startOfMonth(now),
        to: now,
      };
    } else {
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    }
  };
  
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  // Reset date range and visible count when month or sourceFilter changes
  useMemo(() => {
    setDateRange(getDefaultDateRange());
    setVisibleCount(VIDEOS_PER_PAGE);
  }, [month, sourceFilter]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all-videos', month],
    queryFn: () => fetchAllVideos(month),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const videos = data?.videos || [];
  const apiTotals = data?.totals;

  const handleStatsClick = (video: Video) => {
    setSelectedVideo(video);
    setStatsOpen(true);
  };

  const filteredAndSortedVideos = useMemo(() => {
    if (!videos) return [];
    let result = [...videos];
    
    // Filter by source
    if (sourceFilter === 'senbo') {
      result = result.filter(video => video.source === 'senbo');
    } else if (sourceFilter === 'senne') {
      result = result.filter(video => video.source === 'senne');
    }
    
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

    // Filter by date range - only apply if user has changed from default
    if (showAdvanced && dateRange.from && dateRange.to) {
      const defaultRange = getDefaultDateRange();
      const isDefaultRange = dateRange.from.getTime() === defaultRange.from.getTime() && 
                             dateRange.to.getTime() === defaultRange.to.getTime();
      
      // Only filter if user has explicitly changed the date range
      if (!isDefaultRange) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        result = result.filter(video => {
          if (!video.publishDate) return true; // Include videos without dates
          const videoDate = parseDate(video.publishDate);
          if (videoDate.getTime() === new Date(0).getTime()) return true; // Include invalid dates
          return videoDate >= fromDate && videoDate <= toDate;
        });
      }
    }

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
  }, [videos, searchQuery, sortBy, sourceFilter, dateRange]);

  // Always calculate totals by summing displayed videos
  const { totalRevenue, totalViews } = useMemo(() => {
    return {
      totalRevenue: filteredAndSortedVideos.reduce((sum, v) => sum + v.revenue, 0),
      totalViews: filteredAndSortedVideos.reduce((sum, v) => sum + v.views, 0)
    };
  }, [filteredAndSortedVideos]);

  const avgViewsPerVideo = useMemo(() => {
    if (filteredAndSortedVideos.length === 0) return 0;
    return Math.round(totalViews / filteredAndSortedVideos.length);
  }, [filteredAndSortedVideos, totalViews]);

  // Calculate outlier status for each video based on surrounding 5 before and 5 after
  const outlierData = useMemo(() => {
    const outliers = new Map<string, number>();
    
    // We need chronologically sorted videos for this calculation
    const parseDate = (d: string) => {
      if (!d) return new Date(0);
      const [datePart, timePart] = d.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hour, min] = (timePart || '00:00').split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    };
    
    const chronologicalVideos = [...filteredAndSortedVideos].sort(
      (a, b) => parseDate(a.publishDate).getTime() - parseDate(b.publishDate).getTime()
    );
    
    chronologicalVideos.forEach((video, index) => {
      // Get 5 before and 5 after
      const start = Math.max(0, index - 5);
      const end = Math.min(chronologicalVideos.length, index + 6);
      const surrounding = chronologicalVideos.slice(start, end).filter((_, i) => start + i !== index);
      
      if (surrounding.length === 0) return;
      
      const avgSurrounding = surrounding.reduce((sum, v) => sum + v.views, 0) / surrounding.length;
      
      if (avgSurrounding > 0 && video.views >= avgSurrounding * outlierThreshold) {
        const multiplier = video.views / avgSurrounding;
        outliers.set(video.videoId || video.title, multiplier);
      }
    });
    
    return outliers;
  }, [filteredAndSortedVideos, outlierThreshold]);

  return (
    <div className="min-h-[calc(100vh-128px)] px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-8 md:mb-10 pb-6 md:pb-8 border-b border-border/30">
          {/* Stats - horizontal scroll on mobile */}
          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <div className="group flex-shrink-0">
              <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-muted-foreground transition-colors">Total Videos</p>
              <p className="text-xl md:text-2xl font-medium text-foreground tracking-tight">{filteredAndSortedVideos.length}</p>
            </div>
            <div className="w-px h-8 md:h-10 bg-border/30 flex-shrink-0" />
            <div className="group flex-shrink-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] group-hover:text-muted-foreground transition-colors">Total Views</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-2.5 h-2.5 text-muted-foreground/40 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">24-48h delay</TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl md:text-2xl font-medium text-foreground tracking-tight">{formatViews(totalViews)}</p>
            </div>
            <div className="w-px h-8 md:h-10 bg-border/30 flex-shrink-0" />
            <div className="group flex-shrink-0">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] group-hover:text-muted-foreground transition-colors">Total Revenue</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-2.5 h-2.5 text-muted-foreground/40 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">3-5 day delay</TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl md:text-2xl font-light tracking-tight">
                <span className="text-primary">$</span>
                <span className="font-mono text-foreground">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(totalRevenue)}
                </span>
              </p>
            </div>
            <div className="w-px h-8 md:h-10 bg-border/30 flex-shrink-0" />
            <div className="group flex-shrink-0">
              <p className="text-muted-foreground/70 text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-muted-foreground transition-colors flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Avg Views
              </p>
              <p className="text-xl md:text-2xl font-medium text-foreground tracking-tight">{formatViews(avgViewsPerVideo)}</p>
            </div>
          </div>
          
          {/* Controls - wrap on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm rounded-xl border transition-all duration-300 ${
                sortBy === 'newest' || sortBy === 'oldest'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/50'
              }`}
            >
              <CalendarLucide className="w-4 h-4" />
              <span className="hidden sm:inline">{sortBy === 'oldest' ? 'Oldest' : 'Newest'}</span>
            </button>
            
            <button
              onClick={() => setSortBy(sortBy === 'revenue' ? 'newest' : 'revenue')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm rounded-xl border transition-all duration-300 ${
                sortBy === 'revenue'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/50'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Revenue</span>
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm rounded-xl border transition-all duration-300 ${
                showAdvanced
                  ? 'bg-card text-foreground border-border'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/50'
              }`}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="hidden sm:inline">More</span>
            </button>

            <div className="w-px h-6 md:h-8 bg-border/30 mx-1 hidden sm:block" />

            <div className="relative group w-full sm:w-auto mt-2 sm:mt-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-40 pl-10 pr-4 py-2 md:py-2.5 bg-transparent border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-card/50 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-2 mb-6 -mt-2 md:-mt-4 animate-fade-in">
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
            
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300"
                >
                  <CalendarLucide className="w-3 h-3" />
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ 
                        from: range.from, 
                        to: range.to || range.from 
                      });
                    }
                  }}
                  numberOfMonths={1}
                  disabled={(date) => date > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-border/30 mx-1" />

            {/* Outlier Toggle */}
            <button
              onClick={() => setShowOutliers(!showOutliers)}
              className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all duration-300 ${
                showOutliers
                  ? 'bg-yellow-500 text-black border-yellow-500'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:border-yellow-500/50'
              }`}
            >
              <Zap className="w-3 h-3" />
              Outliers
            </button>

            {/* Outlier Threshold Input */}
            {showOutliers && (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={outlierThreshold}
                  onChange={(e) => setOutlierThreshold(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-14 px-2 py-2 text-xs text-center bg-transparent border border-border/50 rounded-lg text-foreground focus:outline-none focus:border-yellow-500/50 transition-all"
                />
                <span className="text-xs text-muted-foreground">x avg</span>
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <VideosSkeleton />
        ) : isError || !videos.length ? (
          <div className="text-center text-muted-foreground py-24">No videos found</div>
        ) : filteredAndSortedVideos.length === 0 ? (
          <div className="text-center text-muted-foreground py-24">No results for "{searchQuery}"</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredAndSortedVideos.slice(0, visibleCount).map((video, index) => {
                const videoKey = video.videoId || video.title;
                const multiplier = outlierData.get(videoKey);
                const isOutlier = showOutliers && multiplier !== undefined;
                
                return (
                  <VideoCard 
                    key={video.videoId || index} 
                    video={video} 
                    index={index}
                    onStatsClick={handleStatsClick}
                    isOutlier={isOutlier}
                    outlierMultiplier={multiplier}
                  />
                );
              })}
            </div>
            
            {/* Load More Button */}
            {visibleCount < filteredAndSortedVideos.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + VIDEOS_PER_PAGE)}
                  className="px-6 py-3 bg-card border border-border/50 rounded-xl text-sm font-medium text-foreground hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
                >
                  Load More ({filteredAndSortedVideos.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
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
