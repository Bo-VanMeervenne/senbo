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
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-secondary/50 rounded w-1/2" />
                <div className="h-12 bg-secondary/30 rounded w-3/4" />
              </div>
            </div>
          ))}
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
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        Subscriber vs Non-Subscriber
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscribed Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 text-primary mb-2">
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Subscribers</span>
            </div>
            
            <div className="text-4xl font-bold text-foreground mb-1">
              {subscribedPercent}%
            </div>
            
            <div className="text-sm text-muted-foreground">
              {formatViews(subscribed.views)} views
            </div>
            
            <div className="mt-4 h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${subscribedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unsubscribed Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Non-Subscribers</span>
            </div>
            
            <div className="text-4xl font-bold text-foreground mb-1">
              {unsubscribedPercent}%
            </div>
            
            <div className="text-sm text-muted-foreground">
              {formatViews(unsubscribed.views)} views
            </div>
            
            <div className="mt-4 h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/50 rounded-full transition-all duration-500"
                style={{ width: `${unsubscribedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriberStatsCards;
