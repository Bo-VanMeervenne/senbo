import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TrafficData {
  source: string;
  views: number;
  minutesWatched: number;
}

const sourceLabels: Record<string, string> = {
  'SUGGESTED': 'Suggested Videos',
  'BROWSE': 'Browse & Home',
  'EXT_URL': 'External Websites',
  'YT_SEARCH': 'YouTube Search',
  'YT_OTHER_PAGE': 'Other YouTube Pages',
  'NOTIFICATION': 'Notifications',
  'PLAYLIST': 'Playlists',
  'END_SCREEN': 'End Screens',
  'SHORTS': 'Shorts Feed',
  'CHANNEL': 'Channel Page',
  'SUBSCRIBER': 'Subscription Feed',
  'NO_LINK_OTHER': 'Direct or Unknown',
  'HASHTAGS': 'Hashtags',
  'VIDEO_REMIXES': 'Remixes',
  'LIVE_REDIRECT': 'Live Redirect',
  'PRODUCT_PAGES': 'Product Pages',
  'ADVERTISING': 'YouTube Ads',
  'CAMPAIGN_CARD': 'Campaign Cards',
  'NO_LINK_EMBEDDED': 'Embedded Players',
  'RELATED_VIDEO': 'Related Videos',
  'ANNOTATION': 'Annotations',
  'SUBSCRIBER_NOTIFICATIONS': 'Sub Notifications',
};

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toLocaleString();
};

interface TrafficBarsProps {
  data: TrafficData[];
  maxViews: number;
  showAll?: boolean;
}

const TrafficBars = ({ data, maxViews, showAll = false }: TrafficBarsProps) => {
  const displayData = showAll ? data : data.slice(0, 5);
  
  return (
    <div className="space-y-3">
      {displayData.map((item, index) => {
        const widthPercent = (item.views / maxViews) * 100;
        const label = sourceLabels[item.source] || item.source.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        
        return (
          <div key={item.source} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {label}
              </span>
              <span className="text-foreground font-medium">
                {formatViews(item.views)}
              </span>
            </div>
            <div className="h-6 bg-secondary/30 rounded-lg overflow-hidden">
              <div 
                className={`h-full rounded-lg transition-all duration-500 ${
                  index === 0 ? 'bg-primary' : 'bg-primary/60'
                }`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TrafficSourceChart = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['traffic-source'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-traffic-source');
      if (error) throw error;
      return data.trafficData as TrafficData[];
    },
  });

  if (isLoading) {
    return (
      <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary/50 rounded w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-secondary/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.length) {
    return null;
  }

  const maxViews = Math.max(...data.map(d => d.views));
  const hasMore = data.length > 5;

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        Traffic Sources
      </h3>
      
      <TrafficBars data={data} maxViews={maxViews} />
      
      {hasMore && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-secondary/20">
              View all {data.length} sources <ChevronRight className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Traffic Sources
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="pr-4">
                <TrafficBars data={data} maxViews={maxViews} showAll />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TrafficSourceChart;
