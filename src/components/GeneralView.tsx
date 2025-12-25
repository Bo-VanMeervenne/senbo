import { useEffect, useState } from "react";
import DailyRevenueChart from "@/components/DailyRevenueChart";
import TrafficSourceChart from "@/components/TrafficSourceChart";
import CountryRevenueTable from "@/components/CountryRevenueTable";
import DeviceViewsChart from "@/components/DeviceViewsChart";
import SubscriberStatsCards from "@/components/SubscriberStatsCards";
import { toast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/contexts/DashboardContext";

const funFacts = [
  { title: "🎉 Fun Fact", description: "Your best performing day this month was a Monday!" },
  { title: "📈 Growth Alert", description: "Views are up 12% compared to last week!" },
  { title: "🌍 Global Reach", description: "You reached viewers in 47 countries this month!" },
  { title: "⚡ Peak Hour", description: "Most of your views come between 6-9 PM!" },
  { title: "🔥 Trending", description: "One of your videos is gaining momentum!" },
  { title: "💰 Revenue Milestone", description: "You're on track for a great month!" },
  { title: "👥 Community", description: "Subscriber engagement is looking healthy!" },
  { title: "📱 Mobile First", description: "68% of your audience watches on mobile!" },
];

const getDaysUntilPayday = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let payday: Date;
  if (currentDay >= 22) {
    payday = new Date(currentYear, currentMonth + 1, 22);
  } else {
    payday = new Date(currentYear, currentMonth, 22);
  }

  const diffTime = payday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

interface InsightsData {
  currentMonth: {
    views: number;
    subs: number;
    watchTime: number;
    revenue: number;
  };
  lastMonth: {
    views: number;
    subs: number;
    watchTime: number;
    revenue: number;
  };
}

const GeneralView = () => {
  const daysUntilPayday = getDaysUntilPayday();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const { hideRevenue } = useDashboard();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-insights');
        if (error) throw error;
        setInsights(data);
      } catch (err) {
        console.error('Failed to fetch insights:', err);
      }
    };
    fetchInsights();
  }, []);

  useEffect(() => {
    const showRandomFact = () => {
      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      toast({
        title: randomFact.title,
        description: randomFact.description,
      });
    };

    const initialTimeout = setTimeout(showRandomFact, 30000);
    const interval = setInterval(showRandomFact, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const viewsGrowth = insights ? 
    ((insights.currentMonth.views / insights.lastMonth.views - 1) * 100).toFixed(0) : null;

  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col items-center px-6 py-12">
      {/* Welcome Header */}
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-6 animate-fade-in" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>
        WELCOME BACK
      </h1>

      {/* Insights Row */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-muted-foreground">Next Payday</span>
          <span className="text-sm font-semibold text-foreground">
            {daysUntilPayday === 0 ? "Today!" : `${daysUntilPayday} days`}
          </span>
        </div>

        {insights && (
          <>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Subs Gained</span>
              <span className="text-sm font-semibold text-foreground">
                +{formatNumber(insights.currentMonth.subs)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Views This Month</span>
              <span className="text-sm font-semibold text-foreground">
                {formatNumber(insights.currentMonth.views)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Revenue MTD</span>
              <span className="text-sm font-semibold text-foreground">
                {hideRevenue ? "****" : `$${formatNumber(insights.currentMonth.revenue)}`}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <DailyRevenueChart />

        <CountryRevenueTable />

        <TrafficSourceChart />

        <SubscriberStatsCards />

        <DeviceViewsChart />
      </div>
    </div>
  );
};

export default GeneralView;
