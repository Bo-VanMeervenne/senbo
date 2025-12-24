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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center h-14">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('revenue')}
                className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                  activeTab === 'revenue' 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                  activeTab === 'videos' 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Videos
              </button>
            </div>
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
