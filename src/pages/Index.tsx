import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RevenueDashboard from "@/components/RevenueDashboard";
import VideosView from "@/components/VideosView";

type Tab = 'revenue' | 'videos';
type MonthTab = 'last' | 'current';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('revenue');
  const [monthTab, setMonthTab] = useState<MonthTab>('last');

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-1 p-1 bg-card/80 backdrop-blur-xl rounded-full border border-border/50">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'revenue' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'videos' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              SENBO
            </button>
          </div>
        </div>

        {/* Month sub-tabs */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-1 p-0.5 bg-secondary/50 backdrop-blur-xl rounded-lg border border-border/30">
            <button
              onClick={() => setMonthTab('last')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                monthTab === 'last' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setMonthTab('current')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                monthTab === 'current' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Current Month
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32">
        {activeTab === 'revenue' ? (
          <RevenueDashboard month={monthTab} />
        ) : (
          <VideosView month={monthTab} />
        )}
      </div>
    </div>
  );
};

export default Index;
