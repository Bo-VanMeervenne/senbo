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
  Legend,
} from "recharts";

interface TimelineEntry {
  date: string;
  senneRevenue: number;
  boRevenue: number;
}

type TimeFilter = "7" | "30" | "60";

const fetchTimelineData = async (): Promise<TimelineEntry[]> => {
  const { data, error } = await supabase.functions.invoke("get-revenue-split-timeline");
  if (error) throw new Error(error.message);
  return data.data || [];
};

const RevenueSplitChart = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7");

  const { data: allData, isLoading } = useQuery({
    queryKey: ["revenue-split-timeline"],
    queryFn: fetchTimelineData,
    staleTime: 1000 * 60 * 5,
  });

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!allData || allData.length === 0) return [];

    const now = new Date();
    const daysAgo = parseInt(timeFilter);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

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
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-muted-foreground text-sm mb-2">{formatDate(label)}</p>
          <p className="text-[#22c55e] font-medium">
            Senne: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-[#3b82f6] font-medium">
            Bo: {formatCurrency(payload[1]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-foreground font-medium text-lg">Revenue Split Over Time</h3>
          
          {/* Time Filter Toggle */}
          <div className="flex bg-secondary rounded-lg p-1">
            {(["7", "30", "60"] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  timeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter} Days
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-64 bg-secondary animate-pulse rounded-lg" />
        ) : filteredData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-foreground text-sm">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="senneRevenue"
                  name="Senne"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#22c55e" }}
                />
                <Line
                  type="monotone"
                  dataKey="boRevenue"
                  name="Bo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Totals */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="text-muted-foreground text-sm">Senne:</span>
              <span className="text-foreground font-medium">{formatCurrency(totals.senne)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-muted-foreground text-sm">Bo:</span>
              <span className="text-foreground font-medium">{formatCurrency(totals.bo)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueSplitChart;
