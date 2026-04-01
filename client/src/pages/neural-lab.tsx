import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/app-layout";
import { 
  Brain,
  Zap,
  Target,
  Play,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type PitchType = "fastball" | "curveball" | "slider" | "changeup";

interface PitchConfig {
  type: PitchType;
  label: string;
  color: string;
  description: string;
}

const PITCH_TYPES: PitchConfig[] = [
  { type: "fastball", label: "Fastball", color: "bg-red-500", description: "Straight & fast" },
  { type: "curveball", label: "Curveball", color: "bg-blue-500", description: "Sharp break down" },
  { type: "slider", label: "Slider", color: "bg-purple-500", description: "Lateral movement" },
  { type: "changeup", label: "Changeup", color: "bg-green-500", description: "Slow & deceptive" },
];

const DRILL_LENGTH = 10;

interface DrillResult {
  pitchType: PitchType;
  selectedType: PitchType;
  reactionTimeMs: number;
  wasCorrect: boolean;
}

type DrillPhase = "intro" | "ready" | "showing" | "waiting" | "result" | "complete";

export default function NeuralLabPage() {
  const { toast } = useToast();
  
  const [phase, setPhase] = useState<DrillPhase>("intro");
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentPitchType, setCurrentPitchType] = useState<PitchType | null>(null);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [showTime, setShowTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/user/stats'],
  });

  const { data: leaderboard } = useQuery<any[]>({
    queryKey: ['/api/neural-lab/leaderboard'],
  });

  const { data: userBestSession } = useQuery<any>({
    queryKey: ['/api/neural-lab/best'],
  });

  const submitSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return apiRequest('POST', '/api/neural-lab/session', sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/neural-lab/leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/neural-lab/best'] });
    },
  });

  const startDrill = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setResults([]);
    setCurrentPitch(0);
    setPhase("ready");
    
    setTimeout(() => {
      showNextPitch();
    }, 1500);
  }, []);

  const showNextPitch = useCallback(() => {
    const randomPitch = PITCH_TYPES[Math.floor(Math.random() * PITCH_TYPES.length)];
    setCurrentPitchType(randomPitch.type);
    setPhase("showing");
    
    const displayTime = 300 + Math.random() * 400;
    
    timerRef.current = setTimeout(() => {
      setPhase("waiting");
      setShowTime(performance.now());
    }, displayTime);
  }, []);

  const handlePitchSelect = useCallback((selectedType: PitchType) => {
    if (phase !== "waiting" || !currentPitchType || !showTime) return;

    const reactionTime = Math.round(performance.now() - showTime);
    const wasCorrect = selectedType === currentPitchType;
    
    const result: DrillResult = {
      pitchType: currentPitchType,
      selectedType,
      reactionTimeMs: reactionTime,
      wasCorrect,
    };

    setResults(prev => [...prev, result]);
    setPhase("result");

    setTimeout(() => {
      if (currentPitch + 1 >= DRILL_LENGTH) {
        setPhase("complete");
        
        const allResults = [...results, result];
        const correctResults = allResults.filter(r => r.wasCorrect);
        const avgReaction = Math.round(
          allResults.reduce((sum, r) => sum + r.reactionTimeMs, 0) / allResults.length
        );
        const fastestReaction = Math.min(...allResults.map(r => r.reactionTimeMs));
        const accuracy = (correctResults.length / allResults.length) * 100;

        submitSessionMutation.mutate({
          sessionId,
          totalPitches: allResults.length,
          correctPitches: correctResults.length,
          averageReactionMs: avgReaction,
          fastestReactionMs: fastestReaction,
          accuracy,
          results: allResults,
        });
      } else {
        setCurrentPitch(prev => prev + 1);
        setPhase("ready");
        setTimeout(showNextPitch, 800);
      }
    }, 800);
  }, [phase, currentPitchType, showTime, currentPitch, results, sessionId, showNextPitch, submitSessionMutation]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const currentPitchConfig = currentPitchType 
    ? PITCH_TYPES.find(p => p.type === currentPitchType) 
    : null;

  const correctCount = results.filter(r => r.wasCorrect).length;
  const avgReaction = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.reactionTimeMs, 0) / results.length)
    : 0;

  const headerRight = (
    <Link href="/leaderboard">
      <Button variant="outline" size="sm" data-testid="link-leaderboard">
        <Trophy className="w-4 h-4 mr-2" />
        Leaderboard
      </Button>
    </Link>
  );

  return (
    <AppLayout title="Neural Lab" headerRight={headerRight}>
      <div className="p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {phase === "intro" && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Pitch Recognition Drill</h2>
                    <p className="text-white/80">Train your perceptual recognition speed</p>
                  </div>
                </div>
                <p className="text-white/90 mb-6">
                  A pitch type will flash on screen. Identify it as quickly as possible.
                  Your reaction time is measured in milliseconds. Lower is better.
                </p>
                <div className="grid grid-cols-2 twohanded:grid-cols-4 gap-3 mb-6">
                  {PITCH_TYPES.map(pitch => (
                    <div key={pitch.type} className="bg-white/10 rounded-lg p-3 text-center">
                      <div className={cn("w-8 h-8 rounded-full mx-auto mb-2", pitch.color)} />
                      <p className="font-medium">{pitch.label}</p>
                      <p className="text-xs text-white/60">{pitch.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">
                      {DRILL_LENGTH} pitches per session
                    </p>
                    {userBestSession && (
                      <p className="text-sm">
                        Your best: <span className="font-bold text-primary">{userBestSession.averageReactionMs}ms</span> avg
                      </p>
                    )}
                  </div>
                  <Button size="lg" onClick={startDrill} data-testid="button-start-drill">
                    <Play className="w-5 h-5 mr-2" />
                    Start Drill
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(phase === "ready" || phase === "showing" || phase === "waiting" || phase === "result") && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    Pitch {currentPitch + 1} / {DRILL_LENGTH}
                  </Badge>
                  <Progress value={((currentPitch + 1) / DRILL_LENGTH) * 100} className="w-32 h-2" />
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{correctCount}</span>
                </div>
              </div>

              <Card className="min-h-[400px] flex items-center justify-center relative overflow-hidden">
                {phase === "ready" && (
                  <div className="text-center animate-pulse">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground">Get ready...</p>
                  </div>
                )}

                {phase === "showing" && currentPitchConfig && (
                  <div className="text-center animate-in zoom-in duration-150">
                    <div className={cn(
                      "w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl",
                      currentPitchConfig.color
                    )}>
                      <span className="text-3xl font-bold text-white">{currentPitchConfig.label}</span>
                    </div>
                  </div>
                )}

                {phase === "waiting" && (
                  <div className="text-center">
                    <p className="text-2xl font-bold mb-6 text-primary animate-pulse">
                      What pitch was it?
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      {PITCH_TYPES.map(pitch => (
                        <Button
                          key={pitch.type}
                          variant="outline"
                          size="lg"
                          className={cn(
                            "h-20 text-lg font-medium transition-all hover:scale-105",
                            `hover:${pitch.color} hover:text-white`
                          )}
                          onClick={() => handlePitchSelect(pitch.type)}
                          data-testid={`button-pitch-${pitch.type}`}
                        >
                          <div className={cn("w-4 h-4 rounded-full mr-2", pitch.color)} />
                          {pitch.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {phase === "result" && results.length > 0 && (
                  <div className="text-center animate-in fade-in duration-200">
                    {results[results.length - 1].wasCorrect ? (
                      <>
                        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <p className="text-2xl font-bold text-green-500 mb-2">Correct!</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                        <p className="text-2xl font-bold text-red-500 mb-2">Incorrect</p>
                      </>
                    )}
                    <p className="text-4xl font-bold">
                      {results[results.length - 1].reactionTimeMs}
                      <span className="text-lg text-muted-foreground ml-1">ms</span>
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {phase === "complete" && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Drill Complete!</h2>
                <p className="text-white/80">Your neural pathways are strengthening</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{correctCount}/{DRILL_LENGTH}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{avgReaction}<span className="text-lg">ms</span></p>
                    <p className="text-sm text-muted-foreground">Avg Reaction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {Math.round((correctCount / DRILL_LENGTH) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-sm font-medium text-muted-foreground">Results by pitch:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {results.map((result, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-sm",
                          result.wasCorrect ? "bg-green-500/10" : "bg-red-500/10"
                        )}
                      >
                        <span className="capitalize">{result.pitchType}</span>
                        <span className="font-mono">{result.reactionTimeMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={startDrill} className="flex-1" data-testid="button-restart-drill">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Link href="/leaderboard" className="flex-1">
                    <Button variant="outline" className="w-full" data-testid="button-view-leaderboard">
                      <Trophy className="w-4 h-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
