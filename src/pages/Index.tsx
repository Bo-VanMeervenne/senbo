import { useState, useEffect } from "react";
import RevenueDashboard from "@/components/RevenueDashboard";
import VideosView from "@/components/VideosView";
import SenneVideosView from "@/components/SenneVideosView";
import CombinedVideosView from "@/components/CombinedVideosView";
import GeneralView from "@/components/GeneralView";
import PasswordGate from "@/components/PasswordGate";

type Tab = 'general' | 'revenue' | 'videos' | 'senne' | 'both';
type MonthTab = 'last' | 'current';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [monthTab, setMonthTab] = useState<MonthTab>('current');

  useEffect(() => {
    const auth = localStorage.getItem("dashboard-auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-1 p-1 bg-card/80 backdrop-blur-xl rounded-full border border-border/50">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'general' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'revenue' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Revenue Split
            </button>
            
            <span className="text-muted-foreground/30 text-xs px-2">|</span>
            
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'videos' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              S&B
            </button>
            <button
              onClick={() => setActiveTab('senne')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'senne' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Senne
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'both' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Month sub-tabs - only show for revenue, videos, and senne */}
        {activeTab !== 'general' && (
          <div className="flex justify-center mt-3">
            <div className="relative flex items-center p-1 bg-secondary/50 backdrop-blur-xl rounded-full border border-border/30">
              {/* Sliding background */}
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-full shadow-sm transition-all duration-300 ease-out ${
                  monthTab === 'current' ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />
              
              <button
                onClick={() => setMonthTab('current')}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 ${
                  monthTab === 'current' 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => setMonthTab('last')}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 ${
                  monthTab === 'last' 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Last Month
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <div className={activeTab === 'general' ? 'pt-24' : 'pt-32'}>
        {activeTab === 'general' ? (
          <GeneralView />
        ) : activeTab === 'revenue' ? (
          <RevenueDashboard month={monthTab} />
        ) : activeTab === 'videos' ? (
          <VideosView month={monthTab} />
        ) : activeTab === 'senne' ? (
          <SenneVideosView month={monthTab} />
        ) : (
          <CombinedVideosView month={monthTab} />
        )}
      </div>
    </div>
  );
};

export default Index;
