import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimelineEntry {
  date: string;
  senneRevenue: number;
  boRevenue: number;
}

type TimeFilter = "7" | "30" | "60" | "month";

const fetchTimelineData = async (): Promise<TimelineEntry[]> => {
  const { data, error } = await supabase.functions.invoke("get-revenue-split-timeline");
  if (error) throw new Error(error.message);
  return data.data || [];
};

const RevenueSplitChart = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  const { data: allData, isLoading } = useQuery({
    queryKey: ["revenue-split-timeline"],
    queryFn: fetchTimelineData,
    staleTime: 1000 * 60 * 5,
  });

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!allData || allData.length === 0) return [];

    if (timeFilter === "month") {
      // Current month filter - matches the Summary sheet data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      return allData.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      });
    }

    // Find the most recent date in the data (data is already sorted)
    const mostRecentDate = new Date(allData[allData.length - 1].date);
    const daysAgo = parseInt(timeFilter);
    const cutoffDate = new Date(mostRecentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return allData.filter((entry) => new Date(entry.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  // Calculate totals for the selected period
  const totals = filteredData.reduce(
    (acc, entry) => ({
      senne: acc.senne + entry.senneRevenue,
      bo: acc.bo + entry.boRevenue,
    }),
    { senne: 0, bo: 0 }
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-xl backdrop-blur-sm">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
            {formatDate(label)}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <span className="text-muted-foreground text-sm">Senne</span>
              <span className="font-mono text-primary font-medium">
                {formatCurrency(payload[0]?.value || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-muted-foreground text-sm">Bo</span>
              <span className="font-mono font-medium" style={{ color: "hsl(0, 60%, 70%)" }}>
                {formatCurrency(payload[1]?.value || 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Revenue Split Over Time
          </p>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px] text-xs">
              Daily revenue delayed 3-5 days. Recent data are estimates.
            </TooltipContent>
          </UITooltip>
        </div>
        
        {/* Time Filter Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setTimeFilter("month")}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all duration-300 ${
              timeFilter === "month"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            Month
          </button>
          {(["7", "30", "60"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all duration-300 ${
                timeFilter === filter
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {filter}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="group relative">
        {/* Glow effect */}
        <div className="absolute -inset-px bg-gradient-to-b from-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        
        <div className="relative bg-card border border-border/50 rounded-3xl p-6 lg:p-8 transition-all duration-500 group-hover:border-primary/30">
          {/* Chart */}
          {isLoading ? (
            <div className="h-64 bg-secondary animate-pulse rounded-xl" />
          ) : filteredData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available for this period
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                    <defs>
                    <linearGradient id="senneGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(0, 100%, 50%)" />
                      <stop offset="100%" stopColor="hsl(0, 100%, 60%)" />
                    </linearGradient>
                    <linearGradient id="boGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(0, 60%, 65%)" />
                      <stop offset="100%" stopColor="hsl(0, 60%, 75%)" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="hsl(0, 0%, 25%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value}`}
                    stroke="hsl(0, 0%, 25%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    dx={-5}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Line
                    type="monotone"
                    dataKey="senneRevenue"
                    name="Senne"
                    stroke="url(#senneGradient)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: "hsl(0, 100%, 50%)",
                      stroke: "hsl(0, 100%, 50%)",
                      strokeWidth: 2
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="boRevenue"
                    name="Bo"
                    stroke="url(#boGradient)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: "hsl(0, 60%, 70%)",
                      stroke: "hsl(0, 60%, 70%)",
                      strokeWidth: 2
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Totals / Legend */}
          {!isLoading && filteredData.length > 0 && (
            <div className="flex justify-center gap-6 sm:gap-12 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/30">
              <div className="text-center min-w-0">
                <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2">Senne</p>
                <p className="font-mono text-lg sm:text-2xl text-primary font-medium truncate">
                  {formatCurrency(totals.senne)}
                </p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2">Bo</p>
                <p className="font-mono text-lg sm:text-2xl font-medium truncate" style={{ color: "hsl(0, 60%, 70%)" }}>
                  {formatCurrency(totals.bo)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueSplitChart;
