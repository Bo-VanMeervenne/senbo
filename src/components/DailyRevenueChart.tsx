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
import { format, parseISO, getDay, startOfMonth, endOfMonth, isSameMonth, subMonths } from "date-fns";
import { TrendingUp, DollarSign, Eye, Calendar, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DailyData {
  date: string;
  revenue: number;
  views: number;
}

type FilterPreset = '7d' | '30d' | '90d' | '1y' | 'all' | 'month';
type MetricType = 'revenue' | 'views';

const filterLabels: Record<FilterPreset, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '1y': '1Y',
  'all': 'All',
  'month': 'Month',
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

// Weekday Widget Component - Revenue only
interface WeekdayWidgetProps {
  weekdayStats: WeekdayStats[];
}

const WeekdayWidget = ({ weekdayStats }: WeekdayWidgetProps) => {
  if (!weekdayStats.length) return null;
  
  const maxValue = Math.max(...weekdayStats.map(d => d.avgRevenue));
  const bestDay = weekdayStats.find(d => d.isBestRevenue);

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Revenue by Day of Week
          </h3>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground/40 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">3-5 day revenue delay</TooltipContent>
          </UITooltip>
        </div>
        {bestDay && (
          <span className="text-xs text-muted-foreground">
            Best: <span className="text-primary font-medium">{bestDay.day}</span>
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        {weekdayStats.map((day) => {
          const heightPercent = maxValue > 0 ? (day.avgRevenue / maxValue) * 100 : 0;
          
          return (
            <UITooltip key={day.day}>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-full h-20 flex items-end justify-center">
                    <div 
                      className={`w-full max-w-[28px] rounded-t transition-all group-hover:opacity-80 ${
                        day.isBestRevenue 
                          ? 'bg-primary' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${day.isBestRevenue ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day.day}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{day.day}</p>
                  <p className="text-muted-foreground">
                    ${day.avgRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} avg
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
  const [selectedMonth, setSelectedMonth] = useState<Date>(subMonths(new Date(), 1)); // Default to last month
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

  // Filter based on number of data points or selected month
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    // Handle month filter separately
    if (filter === 'month') {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      return data.filter((d) => {
        const date = parseISO(d.date);
        return date >= monthStart && date <= monthEnd;
      });
    }
    
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
  }, [data, filter, selectedMonth]);

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
        <div className="p-4 md:p-6 border-b border-border/20">
          <div className="flex flex-col gap-4">
            {/* Title row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base md:text-lg font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                    Daily {metric === 'revenue' ? 'Revenue' : 'Views'}
                  </h3>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] text-xs">
                      {metric === 'revenue' 
                        ? 'Revenue is delayed 3-5 days. Recent data shown with dashed line.' 
                        : 'Views are delayed 24-48 hours.'}
                    </TooltipContent>
                  </UITooltip>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {filteredData.length} days
                </p>
              </div>
            </div>
            
            {/* Controls row - scrollable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {/* Metric toggle */}
              <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 flex-shrink-0">
                <button
                  onClick={() => setMetric('revenue')}
                  className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 md:gap-1.5 ${
                    metric === 'revenue'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span className="hidden sm:inline">Revenue</span>
                </button>
                <button
                  onClick={() => setMetric('views')}
                  className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 md:gap-1.5 ${
                    metric === 'views'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Views</span>
                </button>
              </div>
              
              <div className="h-6 w-px bg-border/50 flex-shrink-0" />
              
              {/* Time filter */}
              <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 flex-shrink-0">
                {(Object.keys(filterLabels) as FilterPreset[]).filter(key => key !== 'month').map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      filter === key
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {filterLabels[key]}
                  </button>
                ))}
                
                {/* Month selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={`px-2 md:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                        filter === 'month'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {filter === 'month' ? format(selectedMonth, 'MMM yyyy') : 'Month'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          {format(selectedMonth, 'MMMM yyyy')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedMonth(prev => {
                            const next = new Date(prev);
                            next.setMonth(next.getMonth() + 1);
                            // Don't go past current month
                            return next > new Date() ? prev : next;
                          })}
                          disabled={isSameMonth(selectedMonth, new Date())}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Quick month selection */}
                      <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 6 }, (_, i) => {
                          const month = subMonths(new Date(), i);
                          return (
                            <Button
                              key={i}
                              variant={isSameMonth(month, selectedMonth) ? "default" : "ghost"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => {
                                setSelectedMonth(month);
                                setFilter('month');
                              }}
                            >
                              {format(month, 'MMM')}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => setFilter('month')}
                      >
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4">
            <div className="bg-secondary/30 rounded-lg p-2.5 md:p-3">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="font-mono text-lg md:text-xl font-medium text-foreground mt-1">
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
            <div className="bg-secondary/30 rounded-lg p-2.5 md:p-3">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Daily Avg</p>
              <p className="font-mono text-lg md:text-xl font-medium text-foreground mt-1">
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
        <div className="p-4 md:p-6 pt-4">
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
      <WeekdayWidget weekdayStats={weekdayStats} />
    </div>
  );
};

export default DailyRevenueChart;
