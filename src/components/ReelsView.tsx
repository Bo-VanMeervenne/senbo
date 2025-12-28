import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, ArrowUpDown, Heart, Eye, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse, isAfter, isBefore, isValid } from "date-fns";

interface Reel {
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  creator: string;
  publishDate: string;
  thumbnailUrl: string;
}

const fetchReels = async (): Promise<{ reels: Reel[] }> => {
  const { data, error } = await supabase.functions.invoke('get-ig-reels');
  if (error) throw error;
  return data;
};

const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'MMM d, yyyy'];
    for (const fmt of formats) {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        return format(parsed, 'd MMM');
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

interface ReelCardProps {
  reel: Reel;
  isOutlier: boolean;
  outlierMultiplier: number;
}

const ReelCard = ({ reel, isOutlier, outlierMultiplier }: ReelCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (reel.url) {
      window.open(reel.url, '_blank');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        {reel.thumbnailUrl && !imageError ? (
          <img
            src={reel.thumbnailUrl}
            alt={reel.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
            {reel.title?.slice(0, 50) || 'No thumbnail'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Creator badge - top left */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-destructive text-destructive-foreground">
            {reel.creator || 'Unknown'}
          </span>
        </div>

        {/* Date - top right */}
        <div className="absolute top-2 right-2">
          <span className="text-[10px] text-white/80 font-medium">
            {formatShortDate(reel.publishDate)}
          </span>
        </div>

        {/* Outlier badge */}
        {isOutlier && (
          <div className="absolute top-8 left-2">
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-500/90 text-black flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              {outlierMultiplier.toFixed(1)}x
            </span>
          </div>
        )}

        {/* Duration badge */}
        {reel.duration && (
          <div className="absolute bottom-12 right-2">
            <span className="text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
              {reel.duration}
            </span>
          </div>
        )}

        {/* Bottom stats */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-end justify-between">
            {/* Likes - bottom left */}
            <div className="flex items-center gap-1 text-white/90">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-medium">{formatViews(reel.likes)}</span>
            </div>
            
            {/* Views - bottom right, larger */}
            <div className="flex items-center gap-1 text-white">
              <Eye className="w-4 h-4" />
              <span className="text-base font-bold">{formatViews(reel.views)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {reel.title}
        </h3>
      </div>
    </div>
  );
};

const ReelsSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/50 animate-pulse">
        <div className="aspect-[9/16] bg-muted" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

type SortOption = 'date' | 'views' | 'likes' | 'comments' | 'duration' | 'bestOutliers';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const ReelsView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [showOutliers, setShowOutliers] = useState(false);
  const [displayCount, setDisplayCount] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ig-reels'],
    queryFn: fetchReels,
  });

  // Get unique creators
  const creators = useMemo(() => {
    if (!data?.reels) return [];
    const uniqueCreators = [...new Set(data.reels.map(r => r.creator).filter(Boolean))];
    return uniqueCreators.sort();
  }, [data?.reels]);

  // Calculate outlier data
  const outlierData = useMemo(() => {
    if (!data?.reels) return { outliers: new Set<string>(), ratios: new Map<string, number>() };
    
    // Sort by date for outlier calculation
    const sortedByDate = [...data.reels].sort((a, b) => {
      const dateA = new Date(a.publishDate);
      const dateB = new Date(b.publishDate);
      return dateA.getTime() - dateB.getTime();
    });

    const outliers = new Set<string>();
    const ratios = new Map<string, number>();

    sortedByDate.forEach((reel, index) => {
      // Get 5 before and 5 after
      const start = Math.max(0, index - 5);
      const end = Math.min(sortedByDate.length, index + 6);
      const neighbors = sortedByDate.slice(start, end).filter((_, i) => start + i !== index);
      
      if (neighbors.length > 0) {
        const avgViews = neighbors.reduce((sum, v) => sum + v.views, 0) / neighbors.length;
        const ratio = avgViews > 0 ? reel.views / avgViews : 1;
        const key = `${reel.url}_${reel.title}`;
        ratios.set(key, ratio);
        
        if (ratio >= 2) {
          outliers.add(key);
        }
      }
    });

    return { outliers, ratios };
  }, [data?.reels]);

  // Filter and sort reels
  const filteredAndSortedReels = useMemo(() => {
    if (!data?.reels) return [];

    let filtered = data.reels.filter(reel => {
      // Search filter
      if (searchQuery && !reel.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Creator filter
      if (creatorFilter !== 'all' && reel.creator !== creatorFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'MMM d, yyyy'];
        let reelDate: Date | null = null;
        
        for (const fmt of formats) {
          const parsed = parse(reel.publishDate, fmt, new Date());
          if (isValid(parsed)) {
            reelDate = parsed;
            break;
          }
        }
        
        if (reelDate) {
          if (dateRange.from && isBefore(reelDate, dateRange.from)) return false;
          if (dateRange.to && isAfter(reelDate, dateRange.to)) return false;
        }
      }

      return true;
    });

    // Sort
    const parseDuration = (duration: string): number => {
      if (!duration) return 0;
      const parts = duration.split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return 0;
    };

    switch (sortBy) {
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'likes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'comments':
        filtered.sort((a, b) => b.comments - a.comments);
        break;
      case 'duration':
        filtered.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration));
        break;
      case 'bestOutliers':
        filtered.sort((a, b) => {
          const keyA = `${a.url}_${a.title}`;
          const keyB = `${b.url}_${b.title}`;
          const ratioA = outlierData.ratios.get(keyA) || 1;
          const ratioB = outlierData.ratios.get(keyB) || 1;
          return ratioB - ratioA;
        });
        break;
      case 'date':
      default:
        filtered.sort((a, b) => {
          const dateA = new Date(a.publishDate);
          const dateB = new Date(b.publishDate);
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }

    return filtered;
  }, [data?.reels, searchQuery, creatorFilter, dateRange, sortBy, outlierData]);

  // Display reels (with outlier filter applied)
  const displayReels = useMemo(() => {
    let reels = filteredAndSortedReels;
    
    if (showOutliers) {
      reels = reels.filter(reel => {
        const key = `${reel.url}_${reel.title}`;
        return outlierData.outliers.has(key);
      });
    }
    
    return reels.slice(0, displayCount);
  }, [filteredAndSortedReels, showOutliers, displayCount, outlierData]);

  const hasMore = displayReels.length < (showOutliers 
    ? filteredAndSortedReels.filter(r => outlierData.outliers.has(`${r.url}_${r.title}`)).length
    : filteredAndSortedReels.length);

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load reels: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Creator filter */}
        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All Creators" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Creators</SelectItem>
            {creators.map(creator => (
              <SelectItem key={creator} value={creator}>{creator}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 bg-popover" align="start">
            <div className="space-y-1">
              {[
                { value: 'date', label: 'Newest' },
                { value: 'views', label: 'Most Views' },
                { value: 'likes', label: 'Most Likes' },
                { value: 'comments', label: 'Most Comments' },
                { value: 'duration', label: 'Longest' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    sortBy === option.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-[200px]"
          />
        </div>

        {/* Advanced toggle */}
        <Button
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-9 gap-2"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Advanced
        </Button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card/50 rounded-lg border border-border/50">
          {/* Date range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {dateRange.from || dateRange.to 
                  ? `${dateRange.from ? format(dateRange.from, 'MMM d') : '...'} - ${dateRange.to ? format(dateRange.to, 'MMM d') : '...'}`
                  : 'Date Range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {dateRange.from || dateRange.to ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: undefined, to: undefined })}
              className="h-9"
            >
              <X className="w-4 h-4 mr-1" />
              Clear dates
            </Button>
          ) : null}

          {/* Outlier filter */}
          <Button
            variant={showOutliers ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!showOutliers) {
                setSortBy('bestOutliers');
              }
              setShowOutliers(!showOutliers);
            }}
            className={`h-9 gap-2 ${showOutliers ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}`}
          >
            <Zap className="w-3.5 h-3.5" />
            Best Outliers
          </Button>
        </div>
      )}

      {/* Reels grid */}
      {isLoading ? (
        <ReelsSkeleton />
      ) : displayReels.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No reels found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayReels.map((reel, index) => {
              const key = `${reel.url}_${reel.title}`;
              const isOutlier = outlierData.outliers.has(key);
              const outlierMultiplier = outlierData.ratios.get(key) || 1;
              
              return (
                <ReelCard
                  key={`${key}_${index}`}
                  reel={reel}
                  isOutlier={showOutliers && isOutlier}
                  outlierMultiplier={outlierMultiplier}
                />
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => setDisplayCount(prev => prev + 30)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReelsView;
