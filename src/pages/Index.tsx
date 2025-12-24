import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RevenueDashboard from "@/components/RevenueDashboard";
import VideosView from "@/components/VideosView";

const fetchRevenueData = async () => {
  const { data, error } = await supabase.functions.invoke('get-revenue');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

type Tab = 'revenue' | 'videos';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('revenue');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['revenue'],
    queryFn: fetchRevenueData,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const revenueData = isError ? undefined : data;

  return (
    <div className="min-h-screen bg-background">
      {/* Tab Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 h-14">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`text-sm font-medium tracking-wide transition-colors relative py-4 ${
                activeTab === 'revenue' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Revenue
              {activeTab === 'revenue' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`text-sm font-medium tracking-wide transition-colors relative py-4 ${
                activeTab === 'videos' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Senbo Videos
              {activeTab === 'videos' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {activeTab === 'revenue' ? (
        <RevenueDashboard data={revenueData} isLoading={isLoading && !isError} />
      ) : (
        <VideosView />
      )}
    </div>
  );
};

export default Index;
