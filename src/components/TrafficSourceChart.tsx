import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";

interface TrafficData {
  source: string;
  views: number;
  minutesWatched: number;
}

const sourceLabels: Record<string, string> = {
  'SUGGESTED': 'Suggested Videos',
  'BROWSE': 'Browse Features',
  'EXT_URL': 'External URLs',
  'YT_SEARCH': 'YouTube Search',
  'YT_OTHER_PAGE': 'Other YT Pages',
  'NOTIFICATION': 'Notifications',
  'PLAYLIST': 'Playlists',
  'END_SCREEN': 'End Screens',
  'SHORTS': 'Shorts Feed',
  'CHANNEL': 'Channel Page',
  'SUBSCRIBER': 'Subscription Feed',
  'NO_LINK_OTHER': 'Other',
  'HASHTAGS': 'Hashtags',
  'VIDEO_REMIXES': 'Remixes',
  'LIVE_REDIRECT': 'Live Redirect',
  'PRODUCT_PAGES': 'Product Pages',
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

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        Traffic Sources
      </h3>
      
      <div className="space-y-3">
        {data.map((item, index) => {
          const widthPercent = (item.views / maxViews) * 100;
          const label = sourceLabels[item.source] || item.source;
          
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
    </div>
  );
};

export default TrafficSourceChart;
