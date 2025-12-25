import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Clock, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface SubscriberData {
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  lastUpdated: string | null;
}

const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) return;
    
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

const formatNumber = (num: number): string => {
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
    refetchInterval: 60000, // Refetch every minute
  });

  const animatedCount = useCountUp(data?.subscriberCount || 0, 2500);

  if (isLoading) {
    return (
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2">Welcome back</p>
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-14 w-48 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
            <Calendar className="w-4 h-4 text-emerald-500" />
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
            <Calendar className="w-4 h-4 text-emerald-500" />
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
                    {formatNumber(animatedCount)}
                  </span>
                  <span className="text-lg text-muted-foreground ml-2">subscribers</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Updates every hour</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
          <Calendar className="w-4 h-4 text-emerald-500" />
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
