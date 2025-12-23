import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RevenueDashboard from "@/components/RevenueDashboard";

const fetchRevenueData = async () => {
  const { data, error } = await supabase.functions.invoke('get-revenue');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

const Index = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['revenue'],
    queryFn: fetchRevenueData,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // If API fails, show placeholder data
  const revenueData = isError ? undefined : data;

  return <RevenueDashboard data={revenueData} isLoading={isLoading && !isError} />;
};

export default Index;
