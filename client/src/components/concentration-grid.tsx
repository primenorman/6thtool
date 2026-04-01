import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { 
  Play, 
  RotateCcw, 
  Clock, 
  Trophy, 
  TrendingUp,
  Target,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GridScore {
  id: string;
  score: number;
  timeSeconds: number;
  completedAt: string;
}

interface GridStats {
  bestScore: number | null;
  averageScore: number | null;
  totalAttempts: number;
  recentScores: GridScore[];
}

interface ConcentrationGridProps {
  onComplete: (score: number, time: number) => void;
}

const GRID_SIZE = 10;
const TOTAL_NUMBERS = 100;
const TIME_LIMIT_SECONDS = 180;

function formatNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function ConcentrationGrid({ onComplete }: ConcentrationGridProps) {
  const [grid, setGrid] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT_SECONDS);
  const [clickedCells, setClickedCells] = useState<Set<number>>(new Set());
  const [wrongClick, setWrongClick] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: gridStats, refetch: refetchStats, isError: statsError } = useQuery<GridStats>({
    queryKey: ['/api/grid-scores/stats'],
    enabled: gameState === 'idle' || gameState === 'finished',
    retry: 1,
  });

  const generateGrid = useCallback(() => {
    const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i);
    setGrid(shuffleArray(numbers));
  }, []);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endGame(currentNumber);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, currentNumber]);

  const startGame = () => {
    generateGrid();
    setCurrentNumber(0);
    setTimeRemaining(TIME_LIMIT_SECONDS);
    setClickedCells(new Set());
    setWrongClick(null);
    setGameState('playing');
  };

  const endGame = async (finalScore: number) => {
    setGameState('finished');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const timeUsed = TIME_LIMIT_SECONDS - timeRemaining;
    
    try {
      await apiRequest('POST', '/api/grid-scores', {
        score: finalScore,
        timeSeconds: timeUsed,
      });
      refetchStats();
      toast({
        title: "Score Saved",
        description: `You found ${finalScore} numbers in ${formatTime(timeUsed)}!`,
      });
    } catch (error) {
      console.error('Failed to save grid score:', error);
      toast({
        title: "Failed to Save Score",
        description: "Your score could not be saved. Please try again.",
        variant: "destructive",
      });
    }
    
    onComplete(finalScore, timeUsed);
  };

  const handleCellClick = (num: number, index: number) => {
    if (gameState !== 'playing') return;
    
    if (num === currentNumber) {
      setClickedCells(new Set(Array.from(clickedCells).concat(num)));
      setWrongClick(null);
      
      if (currentNumber === 99) {
        endGame(100);
      } else {
        setCurrentNumber(currentNumber + 1);
      }
    } else {
      setWrongClick(num);
      setTimeout(() => setWrongClick(null), 300);
    }
  };


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentNumber / TOTAL_NUMBERS) * 100;
  const timePercentage = (timeRemaining / TIME_LIMIT_SECONDS) * 100;

  const chartData = gridStats?.recentScores
    ?.slice(0, 10)
    .reverse()
    .map((score, index) => ({
      attempt: index + 1,
      score: score.score,
      date: new Date(score.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })) || [];

  return (
    <div className="space-y-4">
      {gameState === 'idle' && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Concentration Grid</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Find numbers 00-99 in sequential order. You have 3 minutes.
                </p>
              </div>
              
              {statsError && (
                <p className="text-sm text-muted-foreground py-2">
                  Unable to load your previous stats. You can still play!
                </p>
              )}
              
              {gridStats && gridStats.totalAttempts > 0 && (
                <div className="grid grid-cols-3 gap-4 py-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{gridStats.bestScore}</div>
                    <div className="text-xs text-muted-foreground">Best Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{gridStats.averageScore}</div>
                    <div className="text-xs text-muted-foreground">Average</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{gridStats.totalAttempts}</div>
                    <div className="text-xs text-muted-foreground">Attempts</div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={startGame} 
                  size="lg" 
                  className="w-full"
                  data-testid="button-start-grid"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Exercise
                </Button>
                
                {gridStats && gridStats.totalAttempts > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowHistory(!showHistory)}
                    data-testid="button-toggle-history"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {showHistory ? 'Hide' : 'View'} Progress
                  </Button>
                )}
              </div>
              
              {showHistory && chartData.length > 1 && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score History</CardTitle>
                  </CardHeader>
                  <CardContent className="h-40">
                    <ChartContainer
                      config={{
                        score: {
                          label: "Score",
                          color: "hsl(var(--primary))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis 
                            dataKey="attempt" 
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(gameState === 'playing' || gameState === 'finished') && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                Find: <span className="font-bold text-primary ml-1">{formatNumber(currentNumber)}</span>
              </Badge>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
              timeRemaining <= 30 ? "bg-destructive/10 text-destructive" : "bg-muted"
            )}>
              <Clock className="w-4 h-4" />
              <span aria-live="polite" aria-atomic="true">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress: {currentNumber}/100</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div 
            className="grid gap-0.5 sm:gap-1"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            role="grid"
            aria-label="Concentration grid. Find numbers in order from 00 to 99."
          >
            {grid.map((num, idx) => {
              const isClicked = clickedCells.has(num);
              const isWrong = wrongClick === num;
              const isCurrent = num === currentNumber && !isClicked;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(num, idx)}
                  disabled={gameState === 'finished'}
                  role="gridcell"
                  aria-label={`Number ${formatNumber(num)}${isClicked ? ', already found' : ''}`}
                  className={cn(
                    "aspect-square flex items-center justify-center",
                    "text-xs sm:text-sm font-medium rounded-md",
                    "transition-all duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                    "min-h-[32px] min-w-[32px] sm:min-h-[40px] sm:min-w-[40px]",
                    isClicked && "bg-green-500/20 text-green-600 dark:text-green-400 scale-95",
                    isWrong && "bg-destructive/20 text-destructive animate-shake",
                    !isClicked && !isWrong && "bg-muted hover:bg-muted/80 hover-elevate active-elevate-2",
                    gameState === 'finished' && !isClicked && "opacity-50"
                  )}
                  data-testid={`grid-cell-${num}`}
                >
                  {formatNumber(num)}
                </button>
              );
            })}
          </div>

          {gameState === 'finished' && (
            <Card className={cn(
              "border-2",
              currentNumber === 100 ? "border-green-500 bg-green-500/10" : "border-primary bg-primary/10"
            )}>
              <CardContent className="p-6 text-center">
                {currentNumber === 100 ? (
                  <>
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-green-500">Perfect Score!</h3>
                    <p className="text-muted-foreground mt-1">
                      Completed in {formatTime(TIME_LIMIT_SECONDS - timeRemaining)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Time's Up!</h3>
                    <p className="text-muted-foreground mt-1">
                      You found <span className="font-bold text-primary">{currentNumber}</span> numbers
                    </p>
                    {gridStats?.bestScore && currentNumber > gridStats.bestScore && (
                      <Badge className="mt-2 bg-green-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        New Personal Best!
                      </Badge>
                    )}
                  </>
                )}
                
                <Button 
                  onClick={startGame} 
                  variant="outline" 
                  className="mt-4"
                  data-testid="button-restart-grid"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
