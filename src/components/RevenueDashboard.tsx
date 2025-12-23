import { useEffect, useState, useRef, useCallback } from "react";
import senneImage from "@/assets/senne-jackson.jpg";
import bowieImage from "@/assets/bowie.jpg";

// Create a subtle coin tick sound using Web Audio API
const createCoinSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTick = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(2400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.03);
    
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  };
  
  return { playTick, audioContext };
};

interface ProfileCardProps {
  name: string;
  image: string;
  revenue: number;
  isLoading?: boolean;
  onCountStart?: () => void;
}

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
      
      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = end * easeOut;
      setCount(currentValue);

      // Play tick sound at intervals (every ~€100 or so)
      const tickInterval = Math.max(end / 30, 50);
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
      audioRef.current = createCoinSound();
    }
    audioRef.current.playTick();
  }, []);

  const animatedRevenue = useCountUp(revenue, 2000, isLoading, handleTick);
  
  const formattedRevenue = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animatedRevenue);

  return (
    <div className="flex flex-col items-center p-10 bg-card rounded-xl border border-border/30">
      <div className="w-20 h-20 rounded-full overflow-hidden mb-5 ring-2 ring-primary/30 shadow-lg shadow-primary/20">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover saturate-125 brightness-110 contrast-105"
        />
      </div>
      <h2 className="text-foreground font-medium text-lg tracking-wide mb-3">{name}</h2>
      {isLoading ? (
        <div className="h-10 w-36 bg-secondary animate-pulse rounded" />
      ) : (
        <p className="text-primary font-mono font-semibold text-3xl tracking-tight">
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[800px]">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] text-center mb-8 font-medium">
          Revenue Split — Last Month
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        
        <p className="text-muted-foreground/50 text-[10px] uppercase tracking-[0.15em] text-center mt-8">
          Updates on the 20th of each month
        </p>
      </div>
    </div>
  );
};

export default RevenueDashboard;
