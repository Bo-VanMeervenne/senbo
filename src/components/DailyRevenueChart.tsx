import { useState, useMemo } from "react";
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
import { format, parseISO, getDay } from "date-fns";
import { TrendingUp, DollarSign, Eye, Calendar } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DailyData {
  date: string;
  revenue: number;
  views: number;
}

type FilterPreset = '7d' | '30d' | '90d' | '1y' | 'all';
type MetricType = 'revenue' | 'views';

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

type WeekdayStats = {
  day: string;
  avgRevenue: number;
  avgViews: number;
  count: number;
  isBestRevenue: boolean;
  isBestViews: boolean;
};

// Weekday Widget Component
interface WeekdayWidgetProps {
  weekdayStats: WeekdayStats[];
  metric: MetricType;
}

const WeekdayWidget = ({ weekdayStats, metric }: WeekdayWidgetProps) => {
  if (!weekdayStats.length) return null;
  
  const maxValue = Math.max(...weekdayStats.map(d => metric === 'revenue' ? d.avgRevenue : d.avgViews));
  const bestDay = weekdayStats.find(d => metric === 'revenue' ? d.isBestRevenue : d.isBestViews);

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          By Day of Week
        </h3>
        {bestDay && (
          <span className="text-xs text-muted-foreground">
            Best: <span className="text-primary font-medium">{bestDay.day}</span>
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        {weekdayStats.map((day) => {
          const isBest = metric === 'revenue' ? day.isBestRevenue : day.isBestViews;
          const value = metric === 'revenue' ? day.avgRevenue : day.avgViews;
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <UITooltip key={day.day}>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-full h-20 flex items-end justify-center">
                    <div 
                      className={`w-full max-w-[28px] rounded-t transition-all group-hover:opacity-80 ${
                        isBest 
                          ? 'bg-primary' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isBest ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day.day}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{day.day}</p>
                  <p className="text-muted-foreground">
                    {metric === 'revenue' 
                      ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} avg`
                      : `${Math.round(value).toLocaleString()} avg views`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground/70">{day.count} days</p>
                </div>
              </TooltipContent>
            </UITooltip>
          );
        })}
      </div>
    </div>
  );
};

const DailyRevenueChart = () => {
  const [filter, setFilter] = useState<FilterPreset>('7d');
  const [metric, setMetric] = useState<MetricType>('revenue');
  
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

  // Filter based on number of data points, not calendar days
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    let count: number;
    switch (filter) {
      case '7d':
        count = 7;
        break;
      case '30d':
        count = 30;
        break;
      case '90d':
        count = 90;
        break;
      case '1y':
        count = 365;
        break;
      case 'all':
      default:
        return data;
    }
    
    // Take the last N entries from the sorted data
    return data.slice(-count);
  }, [data, filter]);

  const stats = useMemo(() => {
    if (!filteredData.length) return { totalRevenue: 0, totalViews: 0, avgRevenue: 0, avgViews: 0 };
    const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenue, 0);
    const totalViews = filteredData.reduce((sum, d) => sum + d.views, 0);
    return {
      totalRevenue,
      totalViews,
      avgRevenue: totalRevenue / filteredData.length,
      avgViews: totalViews / filteredData.length,
    };
  }, [filteredData]);

  // Weekday performance - group by day of week and average (week ends on Sunday)
  const weekdayStats = useMemo((): WeekdayStats[] => {
    if (!filteredData.length) return [];
    
    // Monday = 0, Sunday = 6 (week ends on Sunday)
    const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const grouped: Record<number, { revenue: number[]; views: number[] }> = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      grouped[i] = { revenue: [], views: [] };
    }
    
    // Group data by weekday
    filteredData.forEach((d) => {
      const dayOfWeek = getDay(parseISO(d.date));
      grouped[dayOfWeek].revenue.push(d.revenue);
      grouped[dayOfWeek].views.push(d.views);
    });
    
    // Calculate averages in correct order (Mon-Sun)
    const result = dayOrder.map((dayIndex, i) => {
      const revenues = grouped[dayIndex].revenue;
      const views = grouped[dayIndex].views;
      return {
        day: dayNames[i],
        avgRevenue: revenues.length ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0,
        avgViews: views.length ? views.reduce((a, b) => a + b, 0) / views.length : 0,
        count: revenues.length,
      };
    });
    
    // Find best day
    const bestRevenue = Math.max(...result.map(r => r.avgRevenue));
    const bestViews = Math.max(...result.map(r => r.avgViews));
    
    return result.map(r => ({
      ...r,
      isBestRevenue: r.avgRevenue === bestRevenue && bestRevenue > 0,
      isBestViews: r.avgViews === bestViews && bestViews > 0,
    }));
  }, [filteredData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
          <p className="text-sm text-muted-foreground mb-2">{dataPoint.fullDate}</p>
          <p className="font-mono text-lg font-medium text-foreground">
            {metric === 'revenue' ? (
              <>
                <span className="text-primary">$</span>
                {dataPoint.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </>
            ) : (
              <>{dataPoint.views.toLocaleString()} views</>
            )}
          </p>
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
    <div className="space-y-4">
      <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily {metric === 'revenue' ? 'Revenue' : 'Views'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredData.length} days
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Metric toggle */}
              <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
                <button
                  onClick={() => setMetric('revenue')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                    metric === 'revenue'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  Revenue
                </button>
                <button
                  onClick={() => setMetric('views')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                    metric === 'views'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Views
                </button>
              </div>
              
              <div className="h-6 w-px bg-border/50" />
              
              {/* Time filter */}
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
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="font-mono text-xl font-medium text-foreground mt-1">
                {metric === 'revenue' ? (
                  <>
                    <span className="text-primary">$</span>
                    {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </>
                ) : (
                  stats.totalViews.toLocaleString()
                )}
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Avg</p>
              <p className="font-mono text-xl font-medium text-foreground mt-1">
                {metric === 'revenue' ? (
                  <>
                    <span className="text-primary">$</span>
                    {stats.avgRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </>
                ) : (
                  Math.round(stats.avgViews).toLocaleString()
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6 pt-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                  tickFormatter={(value) => metric === 'revenue' ? `$${value}` : `${(value / 1000).toFixed(0)}k`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill={metric === 'revenue' ? 'url(#revenueGradient)' : 'url(#viewsGradient)'}
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

      {/* Weekday Widget - separate card below */}
      <WeekdayWidget weekdayStats={weekdayStats} metric={metric} />
    </div>
  );
};

export default DailyRevenueChart;
