import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Clock } from "lucide-react";

interface SubscriberData {
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  lastUpdated: string | null;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

const LiveSubscriberCount = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriber-count'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-subscriber-count');
      if (error) throw error;
      return data as SubscriberData;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
        <div className="h-12 w-32 bg-muted rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
        <p className="text-4xl font-bold text-foreground">--</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-5xl font-bold text-foreground tracking-tight">
                {formatNumber(data.subscriberCount)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">subscribers</p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Updates every hour</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LiveSubscriberCount;
