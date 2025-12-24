import { useEffect, useState, useRef, useCallback } from "react";
import senneImage from "@/assets/senne-jackson.jpg";
import bowieImage from "@/assets/bowie.jpg";

// Refined money sound - subtle and elegant
const createMoneySound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTick = () => {
    const now = audioContext.currentTime;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  };
  
  return { playTick, audioContext };
};

interface ProfileCardProps {
  name: string;
  image: string;
  revenue: number;
  isLoading?: boolean;
}

const useCountUp = (
  end: number, 
  duration: number = 2400, 
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

      const tickInterval = Math.max(end / 18, 150);
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

const ProfileCard = ({ name, image, revenue, isLoading }: ProfileCardProps) => {
  const audioRef = useRef<{ playTick: () => void; audioContext: AudioContext } | null>(null);
  
  const handleTick = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = createMoneySound();
    }
    audioRef.current.playTick();
  }, []);

  const animatedRevenue = useCountUp(revenue, 2400, isLoading, handleTick);
  
  const formattedRevenue = '€' + new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animatedRevenue);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full overflow-hidden mb-6 ring-1 ring-border">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Name */}
      <p className="text-muted-foreground text-xs uppercase tracking-[0.25em] mb-4">
        {name}
      </p>
      
      {/* Revenue */}
      {isLoading ? (
        <div className="h-14 w-48 bg-secondary/50 animate-pulse rounded" />
      ) : (
        <p className="font-display text-5xl md:text-6xl text-primary tracking-tight font-semibold">
          {formattedRevenue}
        </p>
      )}
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

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-8 py-16">
      {/* Header */}
      <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] mb-16">
        Revenue · Last Month
      </p>
      
      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
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
