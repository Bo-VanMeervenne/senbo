import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus } from "lucide-react";

interface SubscriberData {
  status: string;
  views: number;
  minutesWatched: number;
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toLocaleString();
};

const SubscriberStatsCards = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriber-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-subscriber-status');
      if (error) throw error;
      return data.subscriberData as SubscriberData[];
    },
  });

  if (isLoading) {
    return (
      <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary/50 rounded w-1/3" />
          <div className="h-16 bg-secondary/30 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data?.length) {
    return null;
  }

  const subscribed = data.find(d => d.status === 'SUBSCRIBED');
  const unsubscribed = data.find(d => d.status === 'UNSUBSCRIBED');

  if (!subscribed || !unsubscribed) return null;

  const totalViews = subscribed.views + unsubscribed.views;
  const subscribedPercent = ((subscribed.views / totalViews) * 100).toFixed(1);
  const unsubscribedPercent = ((unsubscribed.views / totalViews) * 100).toFixed(1);

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        Subscriber vs Non-Subscriber
      </h3>
      
      {/* Combined progress bar */}
      <div className="h-3 bg-secondary/30 rounded-full overflow-hidden flex mb-4">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${subscribedPercent}%` }}
        />
        <div 
          className="h-full bg-muted-foreground/40 transition-all duration-500"
          style={{ width: `${unsubscribedPercent}%` }}
        />
      </div>
      
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Subscribers</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{subscribedPercent}%</span>
              <span className="text-xs text-muted-foreground">({formatViews(subscribed.views)})</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-medium text-foreground">Non-Subscribers</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-xs text-muted-foreground">({formatViews(unsubscribed.views)})</span>
              <span className="text-2xl font-bold text-foreground">{unsubscribedPercent}%</span>
            </div>
          </div>
          <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    </div>
  );
};

export default SubscriberStatsCards;
