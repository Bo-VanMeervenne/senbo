import { useEffect, useState, useRef, useCallback } from "react";
import senneImage from "@/assets/senne-jackson.jpg";
import bowieImage from "@/assets/bowie.jpg";

const createMoneySound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTick = () => {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  };
  
  return { playTick, audioContext };
};

const useCountUp = (
  end: number, 
  duration: number = 2000, 
  isLoading: boolean = false,
  onTick?: () => void
) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (isLoading || end === 0 || hasAnimated.current) return;
    
    hasAnimated.current = true;
    startTimeRef.current = null;
    lastTickRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = end * easeOut;
      setCount(currentValue);

      const tickInterval = Math.max(end / 15, 200);
      if (Math.floor(currentValue / tickInterval) > lastTickRef.current) {
        lastTickRef.current = Math.floor(currentValue / tickInterval);
        onTick?.();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isLoading, onTick]);

  return count;
};

interface ProfileCardProps {
  name: string;
  image: string;
  revenue: number;
  isLoading?: boolean;
}

const ProfileCard = ({ name, image, revenue, isLoading }: ProfileCardProps) => {
  const audioRef = useRef<{ playTick: () => void; audioContext: AudioContext } | null>(null);
  
  const handleTick = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = createMoneySound();
    }
    audioRef.current.playTick();
  }, []);

  const animatedRevenue = useCountUp(revenue, 2000, isLoading, handleTick);
  
  const formattedRevenue = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animatedRevenue);

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className="absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Card */}
      <div className="relative bg-card border border-border/50 rounded-3xl p-8 md:p-10 transition-all duration-500 group-hover:border-primary/30">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all duration-500">
            <img src={image} alt={name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-foreground font-medium">{name}</p>
            <p className="text-muted-foreground text-sm">Creator</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-16 bg-secondary animate-pulse rounded-lg" />
        ) : (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Earnings</p>
            <p className="font-mono text-4xl md:text-5xl font-medium text-foreground tracking-tight">
              <span className="text-primary">€</span>{formattedRevenue}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface RevenueData {
  senne: number;
  bowie: number;
}

interface RevenueDashboardProps {
  data?: RevenueData;
  isLoading?: boolean;
}

const RevenueDashboard = ({ data, isLoading = false }: RevenueDashboardProps) => {
  const senneRevenue = data?.senne ?? 0;
  const bowieRevenue = data?.bowie ?? 0;
  // Total = Bowie * 2 as specified
  const totalRevenue = bowieRevenue * 2;

  const formattedTotal = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalRevenue);

  return (
    <div className="min-h-[calc(100vh-96px)] flex flex-col items-center justify-center px-6 py-12">
      
      {/* Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard
          name="Senne Jackson"
          image={senneImage}
          revenue={senneRevenue}
          isLoading={isLoading}
        />
        <ProfileCard
          name="Bowie"
          image={bowieImage}
          revenue={bowieRevenue}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default RevenueDashboard;
