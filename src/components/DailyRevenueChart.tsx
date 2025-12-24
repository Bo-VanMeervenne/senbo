import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
} from "recharts";
import { format, parseISO, subDays, subMonths, subQuarters, subYears, isAfter } from "date-fns";
import { TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyData {
  date: string;
  revenue: number;
  views: number;
}

type FilterPreset = '7d' | '30d' | '90d' | '1y' | 'all';

const filterLabels: Record<FilterPreset, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '1y': '1Y',
  'all': 'All',
};

const fetchDailyRevenue = async (): Promise<DailyData[]> => {
  const { data, error } = await supabase.functions.invoke('get-daily-revenue');
  if (error) throw new Error(error.message);
  return data?.data || [];
};

const DailyRevenueChart = () => {
  const [filter, setFilter] = useState<FilterPreset>('7d');
  const [showViews, setShowViews] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
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

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (filter) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '1y':
        cutoffDate = subYears(now, 1);
        break;
      case 'all':
      default:
        return data;
    }
    
    return data.filter(d => isAfter(parseISO(d.date), cutoffDate));
  }, [data, filter]);

  // Scroll to zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const filters: FilterPreset[] = ['7d', '30d', '90d', '1y', 'all'];
    const currentIndex = filters.indexOf(filter);
    
    if (e.deltaY > 0 && currentIndex < filters.length - 1) {
      // Scroll down = zoom out
      setFilter(filters[currentIndex + 1]);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      // Scroll up = zoom in
      setFilter(filters[currentIndex - 1]);
    }
  }, [filter]);

  useEffect(() => {
    const chartElement = chartRef.current;
    if (chartElement) {
      chartElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => chartElement.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const stats = useMemo(() => {
    if (!filteredData.length) return { totalRevenue: 0, totalViews: 0, avgRevenue: 0 };
    const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenue, 0);
    const totalViews = filteredData.reduce((sum, d) => sum + d.views, 0);
    return {
      totalRevenue,
      totalViews,
      avgRevenue: totalRevenue / filteredData.length,
    };
  }, [filteredData]);

  const CustomTooltip = ({ active, payload }: any) => {
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
              {filteredData.length} days • scroll to zoom
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
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
              {(Object.keys(filterLabels) as FilterPreset[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    filter === key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filterLabels[key]}
                </button>
              ))}
            </div>
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
      <div className="p-6 pt-4" ref={chartRef}>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: showViews ? 50 : 10, left: 0, bottom: 0 }}
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
                <YAxis
                  yAxisId="views"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  width={45}
                />
              )}
              
              {showViews && (
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  fill="url(#viewsGradient)"
                  yAxisId="views"
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
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DailyRevenueChart;
