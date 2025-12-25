import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Monitor, Tv, Tablet, Gamepad2, PieChart } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DeviceData {
  device: string;
  views: number;
  minutesWatched: number;
}

const deviceIcons: Record<string, React.ReactNode> = {
  'MOBILE': <Smartphone className="w-4 h-4" />,
  'DESKTOP': <Monitor className="w-4 h-4" />,
  'TV': <Tv className="w-4 h-4" />,
  'TABLET': <Tablet className="w-4 h-4" />,
  'GAME_CONSOLE': <Gamepad2 className="w-4 h-4" />,
};

const deviceLabels: Record<string, string> = {
  'MOBILE': 'Mobile',
  'DESKTOP': 'Desktop',
  'TV': 'TV',
  'TABLET': 'Tablet',
  'GAME_CONSOLE': 'Console',
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(142, 76%, 46%)',
  'hsl(142, 76%, 56%)',
  'hsl(142, 76%, 66%)',
];

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toLocaleString();
};

const DeviceViewsChart = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['device-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-device-revenue');
      if (error) throw error;
      return data.deviceData as DeviceData[];
    },
  });

  if (isLoading) {
    return (
      <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary/50 rounded w-1/3" />
          <div className="h-24 bg-secondary/30 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data?.length) {
    return null;
  }

  const totalViews = data.reduce((sum, item) => sum + item.views, 0);
  const chartData = data.map(item => ({
    ...item,
    name: deviceLabels[item.device] || item.device,
    percentage: ((item.views / totalViews) * 100).toFixed(1),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg z-50">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatViews(data.views)} views ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-primary" />
        Views by Device
      </h3>
      
      <div className="flex items-center gap-4">
        {/* Compact pie chart */}
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="views"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
        
        {/* Legend in a compact grid */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
          {chartData.map((item, index) => (
            <div 
              key={item.device}
              className="flex items-center gap-2"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground flex-shrink-0">
                {deviceIcons[item.device]}
              </span>
              <span className="text-sm text-foreground font-medium truncate">
                {item.name}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceViewsChart;
