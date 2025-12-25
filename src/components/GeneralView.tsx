import { useEffect, useState } from "react";
import DailyRevenueChart from "@/components/DailyRevenueChart";
import TrafficSourceChart from "@/components/TrafficSourceChart";
import CountryRevenueTable from "@/components/CountryRevenueTable";
import DeviceViewsChart from "@/components/DeviceViewsChart";
import SubscriberStatsCards from "@/components/SubscriberStatsCards";
import { toast } from "@/hooks/use-toast";
import { Flame, Trophy, Target, Zap } from "lucide-react";

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

const achievements = [
  { icon: Flame, label: "7 Day Streak", value: "🔥", color: "text-orange-500" },
  { icon: Trophy, label: "Top 10%", value: "Creators", color: "text-yellow-500" },
  { icon: Target, label: "Monthly Goal", value: "78%", color: "text-emerald-500" },
  { icon: Zap, label: "Momentum", value: "+12%", color: "text-blue-500" },
];

const GeneralView = () => {
  const [streak] = useState(7);

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
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-2 animate-fade-in">
        WELCOME BRO'S 👋
      </h1>
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-8">
        Overall Performance
      </p>

      {/* Achievement Pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm hover:border-border transition-colors"
          >
            <achievement.icon className={`w-4 h-4 ${achievement.color}`} />
            <span className="text-sm text-muted-foreground">{achievement.label}</span>
            <span className="text-sm font-semibold text-foreground">{achievement.value}</span>
          </div>
        ))}
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
