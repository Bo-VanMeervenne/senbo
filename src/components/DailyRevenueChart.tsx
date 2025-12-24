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
import { format, parseISO } from "date-fns";
import { TrendingUp, DollarSign, Eye } from "lucide-react";

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
  );
};

export default DailyRevenueChart;
