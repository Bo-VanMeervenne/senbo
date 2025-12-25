import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, TrendingUp, Eye, DollarSign, ThumbsUp, Share2, UserPlus, Clock, RotateCcw, Zap } from "lucide-react";

interface Video {
  title: string;
  videoId: string | null;
  views: number;
  revenue: number;
  likes: number;
  shares: number;
  subsGained: number;
  minutesWatched: number;
  thumbnailUrl: string;
  source: 'senbo' | 'senne';
}

interface Question {
  id: string;
  text: string;
  metric: keyof Pick<Video, 'views' | 'revenue' | 'likes' | 'shares' | 'subsGained' | 'minutesWatched'>;
  higherWins: boolean;
  icon: React.ElementType;
}

const questions: Question[] = [
  { id: 'more-revenue', text: 'Which video earned MORE revenue?', metric: 'revenue', higherWins: true, icon: DollarSign },
  { id: 'less-revenue', text: 'Which video earned LESS revenue?', metric: 'revenue', higherWins: false, icon: DollarSign },
  { id: 'more-views', text: 'Which video got MORE views?', metric: 'views', higherWins: true, icon: Eye },
  { id: 'less-views', text: 'Which video got LESS views?', metric: 'views', higherWins: false, icon: Eye },
  { id: 'more-likes', text: 'Which video got MORE likes?', metric: 'likes', higherWins: true, icon: ThumbsUp },
  { id: 'more-shares', text: 'Which video got MORE shares?', metric: 'shares', higherWins: true, icon: Share2 },
  { id: 'more-subs', text: 'Which video gained MORE subscribers?', metric: 'subsGained', higherWins: true, icon: UserPlus },
  { id: 'less-subs', text: 'Which video gained LESS subscribers?', metric: 'subsGained', higherWins: false, icon: UserPlus },
  { id: 'more-watchtime', text: 'Which video has MORE watch time?', metric: 'minutesWatched', higherWins: true, icon: Clock },
];

const fetchAllVideos = async (month: 'current' | 'last'): Promise<Video[]> => {
  const { data, error } = await supabase.functions.invoke('get-all-videos', {
    body: { month }
  });
  if (error) throw new Error(error.message);
  return (data?.videos || []).filter((v: Video) => v.videoId);
};

const formatMetricValue = (value: number, metric: string): string => {
  if (metric === 'revenue') {
    return '$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (metric === 'minutesWatched') {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M min';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K min';
    return value.toFixed(0) + ' min';
  }
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
  return value.toString();
};

type MetricFilter = 'all' | 'revenue' | 'views';

interface LearnViewProps {
  month: 'last' | 'current';
  sourceFilter: 'all' | 'senbo' | 'senne';
  metricFilter: MetricFilter;
}

const LearnView = ({ month, sourceFilter, metricFilter }: LearnViewProps) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  

  const { data: allVideosRaw = [], isLoading } = useQuery({
    queryKey: ['learn-videos', month],
    queryFn: () => fetchAllVideos(month),
    staleTime: 1000 * 60 * 5,
  });

  // Filter videos by source
  const allVideos = useMemo(() => {
    if (sourceFilter === 'all') return allVideosRaw;
    return allVideosRaw.filter(v => v.source === sourceFilter);
  }, [allVideosRaw, sourceFilter]);

  // Get the month label for questions
  const monthLabel = month === 'current' ? 'this month' : 'last month';

  // Filter questions by metric
  const filteredQuestions = useMemo(() => {
    if (metricFilter === 'all') return questions;
    if (metricFilter === 'revenue') return questions.filter(q => q.metric === 'revenue');
    if (metricFilter === 'views') return questions.filter(q => q.metric === 'views');
    return questions;
  }, [metricFilter]);

  // Generate random pairs of videos with questions
  const rounds = useMemo(() => {
    if (allVideos.length < 2 || filteredQuestions.length === 0) return [];
    
    const pairs: { left: Video; right: Video; question: Question }[] = [];
    const usedPairs = new Set<string>();
    
    // If filtering by source, just pick random pairs from that source
    // If all, try to balance mixed pairs
    const senboVideos = allVideos.filter(v => v.source === 'senbo');
    const senneVideos = allVideos.filter(v => v.source === 'senne');
    
    for (let attempt = 0; attempt < 200 && pairs.length < 50; attempt++) {
      let leftVideo: Video | undefined;
      let rightVideo: Video | undefined;
      
      if (sourceFilter === 'all' && senboVideos.length > 0 && senneVideos.length > 0) {
        // Balance: alternate between mixed, senbo-only, senne-only
        const pairTypes: Array<'mixed' | 'senbo' | 'senne'> = ['mixed', 'mixed', 'senbo', 'senne'];
        const pairType = pairTypes[attempt % pairTypes.length];
        
        if (pairType === 'mixed') {
          leftVideo = senboVideos[Math.floor(Math.random() * senboVideos.length)];
          rightVideo = senneVideos[Math.floor(Math.random() * senneVideos.length)];
        } else if (pairType === 'senbo' && senboVideos.length >= 2) {
          const idx1 = Math.floor(Math.random() * senboVideos.length);
          let idx2 = Math.floor(Math.random() * senboVideos.length);
          while (idx2 === idx1) idx2 = Math.floor(Math.random() * senboVideos.length);
          leftVideo = senboVideos[idx1];
          rightVideo = senboVideos[idx2];
        } else if (pairType === 'senne' && senneVideos.length >= 2) {
          const idx1 = Math.floor(Math.random() * senneVideos.length);
          let idx2 = Math.floor(Math.random() * senneVideos.length);
          while (idx2 === idx1) idx2 = Math.floor(Math.random() * senneVideos.length);
          leftVideo = senneVideos[idx1];
          rightVideo = senneVideos[idx2];
        }
      }
      
      // Fallback or filtered source: pick from filtered list
      if (!leftVideo || !rightVideo) {
        const idx1 = Math.floor(Math.random() * allVideos.length);
        let idx2 = Math.floor(Math.random() * allVideos.length);
        while (idx2 === idx1 || allVideos[idx1].videoId === allVideos[idx2].videoId) {
          idx2 = Math.floor(Math.random() * allVideos.length);
        }
        leftVideo = allVideos[idx1];
        rightVideo = allVideos[idx2];
      }
      
      if (!leftVideo || !rightVideo || leftVideo.videoId === rightVideo.videoId) continue;
      
      const pairKey = [leftVideo.videoId, rightVideo.videoId].sort().join('-');
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      
      const question = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
      pairs.push({
        left: leftVideo,
        right: rightVideo,
        question
      });
    }
    return pairs;
  }, [allVideos, sourceFilter, filteredQuestions]);

  const currentRound = rounds[roundIndex];

  const handleChoice = useCallback((choice: 'left' | 'right') => {
    if (!currentRound || showResult) return;

    setSelectedSide(choice);
    const { left, right, question } = currentRound;
    const leftValue = left[question.metric];
    const rightValue = right[question.metric];

    let isCorrect: boolean;
    if (question.higherWins) {
      isCorrect = choice === 'left' ? leftValue > rightValue : rightValue > leftValue;
    } else {
      isCorrect = choice === 'left' ? leftValue < rightValue : rightValue < leftValue;
    }

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > highStreak) setHighStreak(newStreak);
        return newStreak;
      });
      setShowResult('correct');
    } else {
      setStreak(0);
      setShowResult('wrong');
    }

    setTimeout(() => {
      setShowResult(null);
      setSelectedSide(null);
      setRoundIndex(i => (i + 1) % rounds.length);
    }, 1500);
  }, [currentRound, showResult, rounds.length, highStreak]);


  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setRoundIndex(0);
    setShowResult(null);
    setSelectedSide(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
        <p className="text-muted-foreground">Not enough videos to play</p>
      </div>
    );
  }

  const QuestionIcon = currentRound?.question.icon || Eye;

  return (
    <div className="min-h-[calc(100vh-160px)] px-4 py-6 max-w-6xl mx-auto">
      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-full border border-border/30">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-mono text-lg font-semibold">{score}</span>
          <span className="text-muted-foreground text-sm">score</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-full border border-border/30">
          <Zap className="w-4 h-4 text-orange-500" />
          <span className="font-mono text-lg font-semibold">{streak}</span>
          <span className="text-muted-foreground text-sm">streak</span>
        </div>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-full border border-border/30 hover:border-primary/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Reset</span>
        </button>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRound?.question.id + roundIndex}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border border-border/50 rounded-2xl shadow-lg">
            <QuestionIcon className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">{currentRound?.question.text}</span>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">{monthLabel}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
        {['left', 'right'].map((side) => {
          const video = side === 'left' ? currentRound?.left : currentRound?.right;
          const isSelected = selectedSide === side;
          const metricValue = video ? video[currentRound!.question.metric] : 0;
          const otherValue = side === 'left' 
            ? currentRound?.right[currentRound!.question.metric] 
            : currentRound?.left[currentRound!.question.metric];
          const isWinner = currentRound?.question.higherWins 
            ? metricValue > (otherValue || 0)
            : metricValue < (otherValue || 0);

          return (
            <motion.div
              key={side + roundIndex}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              onClick={() => !showResult && handleChoice(side as 'left' | 'right')}
              className={`relative cursor-pointer select-none ${showResult ? 'pointer-events-none' : ''}`}
            >
              {/* Card */}
              <div className={`relative aspect-[9/16] rounded-3xl overflow-hidden border-2 transition-all duration-300 ${
                isSelected && showResult === 'correct' 
                  ? 'border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]' 
                  : isSelected && showResult === 'wrong'
                    ? 'border-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]'
                    : 'border-border/50 hover:border-primary/50'
              }`}>
                {/* Thumbnail */}
                {video?.videoId && (
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
                    }}
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Source badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                  video?.source === 'senne' ? 'bg-orange-500 text-white' : 'bg-primary text-primary-foreground'
                }`}>
                  {video?.source === 'senne' ? 'Senne' : 'SenBo'}
                </div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm line-clamp-2 mb-2">{video?.title}</p>
                </div>

                {/* Result overlay */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/70"
                    >
                      {isSelected ? (
                        showResult === 'correct' ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                              <Check className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-emerald-400 font-semibold text-lg">Correct!</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-3">
                              <X className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-red-400 font-semibold text-lg">Wrong!</span>
                          </motion.div>
                        )
                      ) : null}

                      {/* Show actual value */}
                      <div className="mt-4 px-4 py-2 bg-card/90 rounded-xl">
                        <span className={`font-mono text-lg font-bold ${isWinner ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {formatMetricValue(metricValue, currentRound!.question.metric)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* High streak */}
      {highStreak > 0 && (
        <div className="text-center mt-12 text-muted-foreground text-sm">
          Best streak: <span className="text-primary font-semibold">{highStreak}</span>
        </div>
      )}
    </div>
  );
};

export default LearnView;