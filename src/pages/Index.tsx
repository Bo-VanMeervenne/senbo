import { useState, useEffect } from "react";
import RevenueDashboard from "@/components/RevenueDashboard";
import VideosView from "@/components/VideosView";
import SenneVideosView from "@/components/SenneVideosView";
import GeneralView from "@/components/GeneralView";
import PasswordGate from "@/components/PasswordGate";

type Tab = 'general' | 'revenue' | 'videos' | 'senne';
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
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'videos' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Senne & Bo
            </button>
            <button
              onClick={() => setActiveTab('senne')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'senne' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Senne Only
            </button>
          </div>
        </div>

        {/* Month sub-tabs - only show for revenue, videos, and senne */}
        {activeTab !== 'general' && (
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-1 p-0.5 bg-secondary/50 backdrop-blur-xl rounded-lg border border-border/30">
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
        ) : (
          <SenneVideosView month={monthTab} />
        )}
      </div>
    </div>
  );
};

export default Index;
