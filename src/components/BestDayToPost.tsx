import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Video {
  publishDate: string;
  views: number;
  revenue: number;
  likes: number;
  subsGained: number;
}

interface DayStats {
  day: string;
  dayIndex: number;
  avgViews: number;
  avgRevenue: number;
  avgEngagement: number;
  videoCount: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fetchVideos = async (): Promise<Video[]> => {
  // Fetch both months for more data
  const [currentRes, lastRes] = await Promise.all([
    supabase.functions.invoke("get-videos", { body: { month: "current" } }),
    supabase.functions.invoke("get-videos", { body: { month: "last" } }),
  ]);

  const currentVideos = currentRes.data?.videos || [];
  const lastVideos = lastRes.data?.videos || [];

  return [...currentVideos, ...lastVideos];
};

const parsePublishDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Format: "23/12/2025, 1:34" or similar
  const parts = dateStr.split(",")[0].trim().split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return null;
};

const BestDayToPost = () => {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos-day-analysis"],
    queryFn: fetchVideos,
    staleTime: 1000 * 60 * 5,
  });

  const dayStats: DayStats[] = (() => {
    if (!videos || videos.length === 0) return [];

    const dayData: Record<number, { views: number[]; revenue: number[]; engagement: number[] }> = {};

    for (let i = 0; i < 7; i++) {
      dayData[i] = { views: [], revenue: [], engagement: [] };
    }

    for (const video of videos) {
      const date = parsePublishDate(video.publishDate);
      if (!date) continue;

      const dayIndex = date.getDay();
      dayData[dayIndex].views.push(video.views || 0);
      dayData[dayIndex].revenue.push(video.revenue || 0);

      const engagement = video.views > 0 ? ((video.likes || 0) / video.views) * 100 : 0;
      dayData[dayIndex].engagement.push(engagement);
    }

    return DAYS.map((day, i) => {
      const data = dayData[i];
      const count = data.views.length;
      return {
        day,
        dayIndex: i,
        avgViews: count > 0 ? data.views.reduce((a, b) => a + b, 0) / count : 0,
        avgRevenue: count > 0 ? data.revenue.reduce((a, b) => a + b, 0) / count : 0,
        avgEngagement: count > 0 ? data.engagement.reduce((a, b) => a + b, 0) / count : 0,
        videoCount: count,
      };
    });
  })();

  const bestDay = dayStats.reduce(
    (best, current) => (current.avgViews > best.avgViews ? current : best),
    dayStats[0] || { day: "-", avgViews: 0, avgRevenue: 0, avgEngagement: 0, videoCount: 0, dayIndex: 0 }
  );

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayStats;
      return (
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-xl backdrop-blur-sm">
          <p className="text-foreground font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Avg Views: <span className="text-foreground font-mono">{formatNumber(data.avgViews)}</span>
            </p>
            <p className="text-muted-foreground">
              Avg Revenue: <span className="text-primary font-mono">${data.avgRevenue.toFixed(2)}</span>
            </p>
            <p className="text-muted-foreground">
              Engagement: <span className="text-foreground font-mono">{data.avgEngagement.toFixed(2)}%</span>
            </p>
            <p className="text-muted-foreground">
              Videos: <span className="text-foreground font-mono">{data.videoCount}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="group relative">
      <div className="absolute -inset-px bg-gradient-to-b from-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      <div className="relative bg-card border border-border/50 rounded-3xl p-6 transition-all duration-500 group-hover:border-primary/30">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Best Day to Post
          </p>
          {!isLoading && bestDay && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Best:</span>
              <span className="text-primary font-medium text-sm">{bestDay.day}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="h-40 bg-secondary animate-pulse rounded-xl" />
        ) : dayStats.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayStats} barCategoryGap="20%">
                  <XAxis
                    dataKey="day"
                    stroke="hsl(0, 0%, 25%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={formatNumber}
                    stroke="hsl(0, 0%, 25%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="avgViews" radius={[4, 4, 0, 0]}>
                    {dayStats.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={
                          entry.dayIndex === bestDay.dayIndex
                            ? "hsl(160, 84%, 39%)"
                            : "hsl(160, 30%, 25%)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick stats */}
            <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-border/30">
              <div className="text-center">
                <p className="text-muted-foreground text-xs mb-1">Best Avg Views</p>
                <p className="font-mono text-foreground font-medium">
                  {formatNumber(bestDay.avgViews)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs mb-1">Best Avg Revenue</p>
                <p className="font-mono text-primary font-medium">
                  ${bestDay.avgRevenue.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs mb-1">Sample Size</p>
                <p className="font-mono text-foreground font-medium">
                  {videos?.length || 0} videos
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BestDayToPost;
