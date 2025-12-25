import { useState, useEffect } from "react";
import RevenueDashboard from "@/components/RevenueDashboard";
import CombinedVideosView from "@/components/CombinedVideosView";
import GeneralView from "@/components/GeneralView";
import LearnView from "@/components/LearnView";
import PasswordGate from "@/components/PasswordGate";

type Tab = 'general' | 'revenue' | 'videos' | 'learn';
type MonthTab = 'last' | 'current';
type SourceFilter = 'all' | 'senbo' | 'senne';
type MetricFilter = 'all' | 'revenue' | 'views';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [monthTab, setMonthTab] = useState<MonthTab>('current');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');

  useEffect(() => {
    const auth = localStorage.getItem("dashboard-auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  const showSubFilters = activeTab === 'revenue' || activeTab === 'videos' || activeTab === 'learn';
  const showSourceFilter = activeTab === 'videos' || activeTab === 'learn';

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
              Videos
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'learn' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Learn
            </button>
          </div>
        </div>

        {/* Sub-filters */}
        {showSubFilters && (
          <div className="flex justify-center mt-3 gap-3">
            {/* Month toggle */}
            <div className="flex items-center p-1 bg-secondary/50 backdrop-blur-xl rounded-full border border-border/30">
              <button
                onClick={() => setMonthTab('current')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  monthTab === 'current' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => setMonthTab('last')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  monthTab === 'last' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Last Month
              </button>
            </div>

            {/* Source filter - for videos and learn */}
            {showSourceFilter && (
              <div className="flex items-center p-1 bg-secondary/50 backdrop-blur-xl rounded-full border border-border/30">
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sourceFilter === 'all' 
                      ? 'bg-foreground text-background shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSourceFilter('senbo')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sourceFilter === 'senbo' 
                      ? 'bg-transparent text-primary border border-primary shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  SenBo
                </button>
                <button
                  onClick={() => setSourceFilter('senne')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    sourceFilter === 'senne' 
                      ? 'bg-transparent text-orange-500 border border-orange-500 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Senne
                </button>
              </div>
            )}

            {/* Metric filter - only for learn */}
            {activeTab === 'learn' && (
              <div className="flex items-center p-1 bg-secondary/50 backdrop-blur-xl rounded-full border border-border/30">
                <button
                  onClick={() => setMetricFilter('all')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    metricFilter === 'all' 
                      ? 'bg-foreground text-background shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMetricFilter('revenue')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    metricFilter === 'revenue' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setMetricFilter('views')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    metricFilter === 'views' 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Views
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Content */}
      <div className={showSubFilters ? 'pt-32' : 'pt-24'}>
        {activeTab === 'general' ? (
          <GeneralView />
        ) : activeTab === 'revenue' ? (
          <RevenueDashboard month={monthTab} />
        ) : activeTab === 'videos' ? (
          <CombinedVideosView month={monthTab} sourceFilter={sourceFilter} />
        ) : (
          <LearnView month={monthTab} sourceFilter={sourceFilter} metricFilter={metricFilter} />
        )}
      </div>
    </div>
  );
};

export default Index;
