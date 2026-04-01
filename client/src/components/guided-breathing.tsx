import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidedBreathingProps {
  onComplete: () => void;
}

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

const INHALE_DURATION = 4;
const HOLD_DURATION = 7;
const EXHALE_DURATION = 8;
const TOTAL_CYCLE_DURATION = INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION;
const TOTAL_CYCLES = 4;

const phaseConfig: Record<Exclude<Phase, 'idle' | 'complete'>, { 
  label: string; 
  duration: number; 
  color: string;
  scale: number;
}> = {
  inhale: { 
    label: "Inhale", 
    duration: INHALE_DURATION, 
    color: "from-blue-400 to-cyan-400",
    scale: 1.4
  },
  hold: { 
    label: "Hold", 
    duration: HOLD_DURATION, 
    color: "from-cyan-400 to-teal-400",
    scale: 1.4
  },
  exhale: { 
    label: "Exhale", 
    duration: EXHALE_DURATION, 
    color: "from-teal-400 to-blue-400",
    scale: 1
  },
};

export function GuidedBreathing({ onComplete }: GuidedBreathingProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = useCallback((frequency: number = 440, duration: number = 0.3) => {
    if (!audioEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [audioEnabled]);

  const getNextPhase = useCallback((currentPhase: Phase): { phase: Phase; cycleIncrement: boolean } => {
    switch (currentPhase) {
      case 'idle':
        return { phase: 'inhale', cycleIncrement: false };
      case 'inhale':
        return { phase: 'hold', cycleIncrement: false };
      case 'hold':
        return { phase: 'exhale', cycleIncrement: false };
      case 'exhale':
        return { phase: 'inhale', cycleIncrement: true };
      default:
        return { phase: 'idle', cycleIncrement: false };
    }
  }, []);

  const startExercise = () => {
    setPhase('inhale');
    setCurrentCycle(1);
    setPhaseTimeLeft(INHALE_DURATION);
    setIsRunning(true);
    playChime(523.25);
  };

  const pauseExercise = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeExercise = () => {
    setIsRunning(true);
  };

  const resetExercise = () => {
    setIsRunning(false);
    setPhase('idle');
    setCurrentCycle(1);
    setPhaseTimeLeft(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (!isRunning || phase === 'idle' || phase === 'complete') {
      return;
    }

    timerRef.current = setInterval(() => {
      setPhaseTimeLeft((prev) => {
        if (prev <= 1) {
          const { phase: nextPhase, cycleIncrement } = getNextPhase(phase);
          
          if (cycleIncrement && currentCycle >= TOTAL_CYCLES) {
            setPhase('complete');
            setIsRunning(false);
            playChime(659.25, 0.5);
            setTimeout(() => onComplete(), 500);
            return 0;
          }
          
          if (cycleIncrement) {
            setCurrentCycle((c) => c + 1);
          }
          
          const chimeFreq = nextPhase === 'inhale' ? 523.25 : nextPhase === 'hold' ? 587.33 : 493.88;
          playChime(chimeFreq);
          
          setPhase(nextPhase);
          return phaseConfig[nextPhase as keyof typeof phaseConfig]?.duration || 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, phase, currentCycle, getNextPhase, onComplete, playChime]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getCurrentPhaseConfig = () => {
    if (phase === 'idle' || phase === 'complete') return null;
    return phaseConfig[phase];
  };

  const config = getCurrentPhaseConfig();
  const progressPercentage = ((currentCycle - 1) / TOTAL_CYCLES) * 100;
  const cycleProgress = phase !== 'idle' && phase !== 'complete' 
    ? ((getPhaseElapsed() / TOTAL_CYCLE_DURATION) * 100) 
    : 0;

  function getPhaseElapsed(): number {
    if (phase === 'idle' || phase === 'complete') return 0;
    const cfg = phaseConfig[phase];
    const elapsed = cfg.duration - phaseTimeLeft;
    
    if (phase === 'inhale') return elapsed;
    if (phase === 'hold') return INHALE_DURATION + elapsed;
    if (phase === 'exhale') return INHALE_DURATION + HOLD_DURATION + elapsed;
    return 0;
  }

  const getAnimationDuration = () => {
    if (phase === 'inhale') return `${INHALE_DURATION}s`;
    if (phase === 'exhale') return `${EXHALE_DURATION}s`;
    return '0s';
  };

  if (phase === 'complete') {
    return (
      <Card className="border-2 border-green-500 bg-green-500/10">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
            Breathing Complete
          </h3>
          <p className="text-muted-foreground mt-2">
            You completed {TOTAL_CYCLES} cycles of 4-7-8 breathing.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Take a moment to notice how you feel.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={resetExercise}
            data-testid="button-breathing-restart"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {phase === 'idle' && (
        <Card className="w-full max-w-md bg-gradient-to-br from-blue-500/5 to-cyan-500/10">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">4-7-8 Breathing Technique</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A calming breath pattern to center your focus
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center py-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <div className="text-lg font-bold text-blue-500">4s</div>
                <div className="text-xs text-muted-foreground">Inhale</div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <div className="text-lg font-bold text-cyan-500">7s</div>
                <div className="text-xs text-muted-foreground">Hold</div>
              </div>
              <div className="p-2 rounded-lg bg-teal-500/10">
                <div className="text-lg font-bold text-teal-500">8s</div>
                <div className="text-xs text-muted-foreground">Exhale</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {TOTAL_CYCLES} cycles • ~{Math.round((TOTAL_CYCLE_DURATION * TOTAL_CYCLES) / 60)} minutes
            </p>
            
            <div className="flex items-center justify-center gap-2 py-2">
              <Switch
                id="audio-toggle"
                checked={audioEnabled}
                onCheckedChange={setAudioEnabled}
                data-testid="switch-audio-toggle"
              />
              <Label htmlFor="audio-toggle" className="text-sm flex items-center gap-1">
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Audio cues
              </Label>
            </div>
            
            <Button 
              size="lg" 
              className="w-full"
              onClick={startExercise}
              data-testid="button-breathing-start"
            >
              <Play className="w-5 h-5 mr-2" />
              Begin Breathing
            </Button>
          </CardContent>
        </Card>
      )}

      {phase !== 'idle' && (
        <>
          <div className="flex items-center justify-center gap-2 py-2">
            <Switch
              id="audio-toggle-active"
              checked={audioEnabled}
              onCheckedChange={setAudioEnabled}
              data-testid="switch-audio-toggle-active"
            />
            <Label htmlFor="audio-toggle-active" className="text-sm flex items-center gap-1">
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Label>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Cycle {currentCycle} of {TOTAL_CYCLES}
            </p>
            <Progress value={progressPercentage + (cycleProgress / TOTAL_CYCLES)} className="w-48 h-2" />
          </div>

          <div className="relative flex items-center justify-center h-64 w-64">
            <div
              className={cn(
                "absolute inset-0 rounded-full opacity-20 blur-xl transition-all",
                `bg-gradient-to-br ${config?.color}`
              )}
              style={{
                transform: `scale(${config?.scale || 1})`,
                transition: phase === 'hold' ? 'none' : `transform ${getAnimationDuration()} ease-in-out`
              }}
            />
            
            <div
              className={cn(
                "absolute rounded-full bg-gradient-to-br transition-all",
                config?.color
              )}
              style={{
                width: '160px',
                height: '160px',
                transform: `scale(${config?.scale || 1})`,
                transition: phase === 'hold' ? 'none' : `transform ${getAnimationDuration()} ease-in-out`
              }}
              data-testid="breathing-circle"
            />
            
            <div className="relative z-10 text-center text-white">
              <div className="text-5xl font-bold mb-1" data-testid="text-phase-countdown">
                {phaseTimeLeft}
              </div>
              <div className="text-lg font-medium opacity-90" data-testid="text-phase-label">
                {config?.label}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className={cn(
              "text-lg font-medium transition-colors",
              phase === 'inhale' && "text-blue-500",
              phase === 'hold' && "text-cyan-500",
              phase === 'exhale' && "text-teal-500"
            )}>
              {phase === 'inhale' && "Breathe in slowly through your nose"}
              {phase === 'hold' && "Hold your breath gently"}
              {phase === 'exhale' && "Release slowly through your mouth"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="icon"
              onClick={resetExercise}
              data-testid="button-breathing-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button 
              size="lg"
              onClick={isRunning ? pauseExercise : resumeExercise}
              data-testid="button-breathing-toggle"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
