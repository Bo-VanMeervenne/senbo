import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RevenueDashboard from "@/components/RevenueDashboard";
import VideosView from "@/components/VideosView";

const fetchRevenueData = async () => {
  const { data, error } = await supabase.functions.invoke('get-revenue');
  if (error) throw new Error(error.message);
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
              Senbo
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24">
        {activeTab === 'revenue' ? (
          <RevenueDashboard data={revenueData} isLoading={isLoading && !isError} />
        ) : (
          <VideosView />
        )}
      </div>
    </div>
  );
};

export default Index;
