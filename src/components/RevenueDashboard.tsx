import { useEffect, useState, useRef } from "react";
import senneImage from "@/assets/senne-jackson.jpg";
import bowieImage from "@/assets/bowie.jpg";

const useCountUp = (
  end: number, 
  duration: number = 2000, 
  isLoading: boolean = false,
  key?: string
) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const lastEndRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    
    // Reset and re-animate when end value changes
    if (lastEndRef.current !== end) {
      lastEndRef.current = end;
      setCount(0);
      startTimeRef.current = null;
    }
    
    if (end === 0) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = end * easeOut;
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isLoading, key]);

  return count;
};

interface ProfileCardProps {
  name: string;
  image: string;
  revenueDollars: number;
  revenueEuros: number;
  isLoading?: boolean;
}

const ProfileCard = ({ name, image, revenueDollars, revenueEuros, isLoading }: ProfileCardProps) => {
  const animatedDollars = useCountUp(revenueDollars, 2000, isLoading);
  const animatedEuros = useCountUp(revenueEuros, 2000, isLoading);
  
  const formattedDollars = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animatedDollars);

  const formattedEuros = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animatedEuros);

  return (
    <div className="group relative h-full">
      {/* Glow effect */}
      <div className="absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Card */}
      <div className="relative bg-card border border-border/50 rounded-3xl p-8 lg:p-12 transition-all duration-500 group-hover:border-primary/30 h-full flex flex-col">
        <div className="flex items-center gap-5 mb-8 lg:mb-12">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all duration-500">
            <img src={image} alt={name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-foreground font-medium text-lg lg:text-xl">{name}</p>
            <p className="text-muted-foreground text-sm lg:text-base">Creator</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-24 bg-secondary animate-pulse rounded-lg" />
        ) : (
          <div className="mt-auto">
            <p className="font-mono text-4xl lg:text-6xl font-medium text-foreground tracking-tight">
              <span className="text-primary">$</span>{formattedDollars}
            </p>
            <p className="font-mono text-lg lg:text-2xl text-muted-foreground mt-3">
              <span className="text-primary/60">€</span>{formattedEuros}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ShareBarProps {
  senneShare: number;
  bowieShare: number;
  isLoading?: boolean;
}

const ShareBar = ({ senneShare, bowieShare, isLoading }: ShareBarProps) => {
  const animatedSenne = useCountUp(senneShare, 2000, isLoading);
  const animatedBowie = useCountUp(bowieShare, 2000, isLoading);

  return (
    <div className="w-full max-w-4xl flex items-center gap-6">
      <span className="text-sm text-foreground font-mono font-medium min-w-[48px] text-right">{animatedSenne.toFixed(0)}%</span>
      
      {isLoading ? (
        <div className="flex-1 h-2 bg-primary/10 animate-pulse rounded-full" />
      ) : (
        <div className="flex-1 h-2 bg-primary/10 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(var(--primary),0.3)]"
            style={{ width: `${animatedSenne}%` }}
          />
        </div>
      )}
      
      <span className="text-sm text-foreground font-mono font-medium min-w-[48px]">{animatedBowie.toFixed(0)}%</span>
    </div>
  );
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RevenueData {
  senneDollars: number;
  bowieDollars: number;
  senneEuros: number;
  bowieEuros: number;
}

interface RevenueDashboardProps {
  month: 'last' | 'current';
}

const fetchRevenueData = async (month: 'last' | 'current'): Promise<RevenueData> => {
  const { data, error } = await supabase.functions.invoke('get-revenue', {
    body: { month }
  });
  if (error) throw new Error(error.message);
  return data;
};

const RevenueDashboard = ({ month }: RevenueDashboardProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['revenue', month],
    queryFn: () => fetchRevenueData(month),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const revenueData = isError ? undefined : data;
  const senneDollars = revenueData?.senneDollars ?? 0;
  const bowieDollars = revenueData?.bowieDollars ?? 0;
  const senneEuros = revenueData?.senneEuros ?? 0;
  const bowieEuros = revenueData?.bowieEuros ?? 0;

  const totalDollars = senneDollars + bowieDollars;
  const senneShare = totalDollars > 0 ? (senneDollars / totalDollars) * 100 : 50;
  const bowieShare = totalDollars > 0 ? (bowieDollars / totalDollars) * 100 : 50;

  const headerText = month === 'current' 
    ? 'Revenue from current month (live)' 
    : 'Revenue from last month, updated on the 20th';

  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col items-center justify-center px-6 py-12">
      
      {/* Header */}
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-8">{headerText}</p>
      
      {/* Share Bar */}
      <ShareBar senneShare={senneShare} bowieShare={bowieShare} isLoading={isLoading} />
      
      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-10">
        <ProfileCard
          name="Senne Jackson"
          image={senneImage}
          revenueDollars={senneDollars}
          revenueEuros={senneEuros}
          isLoading={isLoading}
        />
        <ProfileCard
          name="Bowie"
          image={bowieImage}
          revenueDollars={bowieDollars}
          revenueEuros={bowieEuros}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default RevenueDashboard;
