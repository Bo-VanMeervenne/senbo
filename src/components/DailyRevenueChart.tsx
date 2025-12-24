import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { TrendingUp, Eye, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyData {
  date: string;
  revenue: number;
  views: number;
}

interface DailyRevenueResponse {
  data: DailyData[];
}

const fetchDailyRevenue = async (): Promise<DailyData[]> => {
  const { data, error } = await supabase.functions.invoke('get-daily-revenue');
  if (error) throw new Error(error.message);
  return data?.data || [];
};

const DailyRevenueChart = () => {
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [showViews, setShowViews] = useState(false);
  
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['daily-revenue'],
    queryFn: fetchDailyRevenue,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const data = useMemo(() => {
    if (!rawData?.length) return [];
    return rawData.map((item) => ({
      ...item,
      formattedDate: format(parseISO(item.date), 'MMM d'),
      fullDate: format(parseISO(item.date), 'MMM d, yyyy'),
    }));
  }, [rawData]);

  const visibleData = useMemo(() => {
    if (!data.length) return [];
    const start = brushRange.startIndex ?? 0;
    const end = brushRange.endIndex ?? data.length - 1;
    return data.slice(start, end + 1);
  }, [data, brushRange]);

  const stats = useMemo(() => {
    if (!visibleData.length) return { totalRevenue: 0, totalViews: 0, avgRevenue: 0 };
    const totalRevenue = visibleData.reduce((sum, d) => sum + d.revenue, 0);
    const totalViews = visibleData.reduce((sum, d) => sum + d.views, 0);
    return {
      totalRevenue,
      totalViews,
      avgRevenue: totalRevenue / visibleData.length,
    };
  }, [visibleData]);

  const handleZoomIn = useCallback(() => {
    if (!data.length) return;
    const currentStart = brushRange.startIndex ?? 0;
    const currentEnd = brushRange.endIndex ?? data.length - 1;
    const range = currentEnd - currentStart;
    const zoomAmount = Math.floor(range * 0.2);
    if (range > 7) {
      setBrushRange({
        startIndex: currentStart + zoomAmount,
        endIndex: currentEnd - zoomAmount,
      });
    }
  }, [data.length, brushRange]);

  const handleZoomOut = useCallback(() => {
    if (!data.length) return;
    const currentStart = brushRange.startIndex ?? 0;
    const currentEnd = brushRange.endIndex ?? data.length - 1;
    const range = currentEnd - currentStart;
    const zoomAmount = Math.floor(range * 0.3);
    setBrushRange({
      startIndex: Math.max(0, currentStart - zoomAmount),
      endIndex: Math.min(data.length - 1, currentEnd + zoomAmount),
    });
  }, [data.length, brushRange]);

  const handleReset = useCallback(() => {
    setBrushRange({});
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
          <p className="text-sm text-muted-foreground mb-2">{dataPoint.fullDate}</p>
          <div className="space-y-1">
            <p className="font-mono text-lg font-medium text-foreground">
              <span className="text-primary">$</span>
              {dataPoint.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {showViews && (
              <p className="font-mono text-sm text-muted-foreground">
                {dataPoint.views.toLocaleString()} views
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-card/50 border border-border/30 rounded-2xl p-6">
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data.length) {
    return (
      <div className="w-full bg-card/50 border border-border/30 rounded-2xl p-6">
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No daily revenue data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Daily Revenue
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {visibleData.length} days selected
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViews(!showViews)}
              className={`h-8 px-3 text-xs transition-all ${showViews ? 'bg-primary/10 border-primary/30' : ''}`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Views
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 w-8 p-0">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="font-mono text-xl font-medium text-foreground mt-1">
              <span className="text-primary">$</span>
              {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Average</p>
            <p className="font-mono text-xl font-medium text-foreground mt-1">
              <span className="text-primary">$</span>
              {stats.avgRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Views</p>
            <p className="font-mono text-xl font-medium text-foreground mt-1">
              {stats.totalViews.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="formattedDate"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {showViews && (
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  fill="url(#viewsGradient)"
                  yAxisId={1}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
              />
              
              <Brush
                dataKey="formattedDate"
                height={32}
                stroke="hsl(var(--border))"
                fill="hsl(var(--secondary))"
                tickFormatter={() => ''}
                startIndex={brushRange.startIndex}
                endIndex={brushRange.endIndex}
                onChange={(range) => {
                  if (range.startIndex !== undefined && range.endIndex !== undefined) {
                    setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex });
                  }
                }}
              >
                <AreaChart data={data}>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </Brush>
              
              {showViews && (
                <YAxis
                  yAxisId={1}
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  width={50}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DailyRevenueChart;
