import { useQuery } from "@tanstack/react-query";
import RevenueDashboard from "@/components/RevenueDashboard";

const fetchRevenueData = async () => {
  const response = await fetch('/api/get-revenue');
  if (!response.ok) {
    throw new Error('Failed to fetch revenue data');
  }
  return response.json();
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
