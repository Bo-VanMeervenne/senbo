import { useEffect } from "react";
import DailyRevenueChart from "@/components/DailyRevenueChart";
import TrafficSourceChart from "@/components/TrafficSourceChart";
import CountryRevenueTable from "@/components/CountryRevenueTable";
import DeviceViewsChart from "@/components/DeviceViewsChart";
import SubscriberStatsCards from "@/components/SubscriberStatsCards";
import { toast } from "@/hooks/use-toast";

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

const GeneralView = () => {
  useEffect(() => {
    const showRandomFact = () => {
      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      toast({
        title: randomFact.title,
        description: randomFact.description,
      });
    };

    // Show first fact after 30 seconds
    const initialTimeout = setTimeout(showRandomFact, 30000);
    
    // Then show every 2 minutes
    const interval = setInterval(showRandomFact, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col items-center px-6 py-12">
      <h1 className="text-3xl font-light text-foreground mb-2">
        welcome bro's 👋
      </h1>
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-8">
        Overall Performance
      </p>
      
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
