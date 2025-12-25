import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Calendar } from "lucide-react";

interface SubscriberData {
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  lastUpdated: string | null;
}

const formatSubscriberCount = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

interface LiveSubscriberCountProps {
  daysUntilPayday: number;
}

const LiveSubscriberCount = ({ daysUntilPayday }: LiveSubscriberCountProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriber-count'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-subscriber-count');
      if (error) throw error;
      return data as SubscriberData;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2">Welcome back</p>
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-14 w-48 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Next Payday</span>
            <span className="text-sm font-semibold text-foreground">
              {daysUntilPayday === 0 ? "Today!" : `${daysUntilPayday} days`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2">Welcome back</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            <span className="text-5xl font-bold text-foreground">--</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Next Payday</span>
            <span className="text-sm font-semibold text-foreground">
              {daysUntilPayday === 0 ? "Today!" : `${daysUntilPayday} days`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-2">Welcome back</p>
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help flex items-center gap-3">
                <Users className="w-10 h-10 text-primary" />
                <div>
                  <span className="text-5xl font-bold text-foreground tracking-tight">
                    {formatSubscriberCount(data.subscriberCount)}
                  </span>
                  <span className="text-lg text-muted-foreground ml-2">subscribers</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Updates every week on Sun</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Next Payday</span>
          <span className="text-sm font-semibold text-foreground">
            {daysUntilPayday === 0 ? "Today!" : `${daysUntilPayday} days`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveSubscriberCount;
