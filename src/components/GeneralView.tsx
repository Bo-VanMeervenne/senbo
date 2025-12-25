import { useEffect } from "react";
import DailyRevenueChart from "@/components/DailyRevenueChart";
import TrafficSourceChart from "@/components/TrafficSourceChart";
import CountryRevenueTable from "@/components/CountryRevenueTable";
import DeviceViewsChart from "@/components/DeviceViewsChart";
import SubscriberStatsCards from "@/components/SubscriberStatsCards";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

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
    // Next payday is 22nd of next month
    payday = new Date(currentYear, currentMonth + 1, 22);
  } else {
    // Next payday is 22nd of this month
    payday = new Date(currentYear, currentMonth, 22);
  }

  const diffTime = payday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const GeneralView = () => {
  const daysUntilPayday = getDaysUntilPayday();

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

  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col items-center px-6 py-12">
      {/* Welcome Header */}
      <h1 className="text-2xl font-medium tracking-tight text-foreground mb-2 animate-fade-in">Welcome</h1>
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-8">Overall Performance</p>

      {/* Real Stats */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-muted-foreground">Next Payday</span>
          <span className="text-sm font-semibold text-foreground">
            {daysUntilPayday === 0 ? "Today!" : `${daysUntilPayday} days`}
          </span>
        </div>
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
