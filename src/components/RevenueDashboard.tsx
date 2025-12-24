import { useEffect, useState, useRef, useCallback } from "react";
import senneImage from "@/assets/senne-jackson.jpg";
import bowieImage from "@/assets/bowie.jpg";

// Energetic cash/coin sound - dopamine hit
const createMoneySound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTick = () => {
    const now = audioContext.currentTime;
    
    // Bright coin ping
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Sparkle overtone
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.setValueAtTime(3600, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.05);
    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc2.start(now);
    osc2.stop(now + 0.06);

    // Subtle bass thump
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();
    osc3.type = 'sine';
    osc3.connect(gain3);
    gain3.connect(audioContext.destination);
    osc3.frequency.setValueAtTime(200, now);
    osc3.frequency.exponentialRampToValueAtTime(60, now + 0.05);
    gain3.gain.setValueAtTime(0.08, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc3.start(now);
    osc3.stop(now + 0.06);
  };
  
  return { playTick, audioContext };
};

// Generate random chart points for background
const generateChartPath = (width: number, height: number) => {
  const points = 12;
  const step = width / (points - 1);
  let path = `M 0 ${height}`;
  
  for (let i = 0; i < points; i++) {
    const x = i * step;
    const y = height - (Math.random() * 0.6 + 0.2) * height;
    path += ` L ${x} ${y}`;
  }
  
  path += ` L ${width} ${height} Z`;
  return path;
};

interface ProfileCardProps {
  name: string;
  image: string;
  revenue: number;
  isLoading?: boolean;
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
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = end * easeOut;
      setCount(currentValue);

      const tickInterval = Math.max(end / 20, 100);
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
  const [isHovered, setIsHovered] = useState(false);
  const [chartPath] = useState(() => generateChartPath(320, 200));
  
  const handleTick = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = createMoneySound();
    }
    audioRef.current.playTick();
  }, []);

  const animatedRevenue = useCountUp(revenue, 2000, isLoading, handleTick);
  
  const formattedRevenue = '€' + new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(animatedRevenue);

  return (
    <div 
      className="relative flex flex-col items-center p-10 bg-card rounded-xl border border-border/30 overflow-hidden transition-all duration-300 hover:border-primary/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chart background on hover */}
      <svg 
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        viewBox="0 0 320 200" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(145, 80%, 42%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(145, 80%, 42%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={chartPath} fill="url(#chartGradient)" />
        <path 
          d={chartPath.replace(/ L \d+ 200 Z/, '')} 
          fill="none" 
          stroke="hsl(145, 80%, 42%)" 
          strokeWidth="1.5" 
          strokeOpacity="0.4"
        />
      </svg>

      <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden mb-5 ring-2 ring-primary/30 shadow-lg shadow-primary/20">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover saturate-125 brightness-110 contrast-105"
        />
      </div>
      <h2 className="relative z-10 text-foreground font-medium text-lg tracking-wide mb-3">{name}</h2>
      {isLoading ? (
        <div className="relative z-10 h-10 w-36 bg-secondary animate-pulse rounded" />
      ) : (
        <p className="relative z-10 text-primary font-mono font-semibold text-3xl tracking-tight">
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] text-center mb-10 font-medium">
        Revenue Split — Last Month
      </p>
      
      <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-6">
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
