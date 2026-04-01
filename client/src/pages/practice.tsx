import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AppLayout } from "@/components/app-layout";
import { ConcentrationGrid } from "@/components/concentration-grid";
import { GuidedBreathing } from "@/components/guided-breathing";
import { useIsTabletOrAbove } from "@/hooks/use-viewport-context";
import { useBadgeNotification } from "@/components/badge-notification";
import { 
  Wind, 
  Grid3X3, 
  Eye, 
  FileText,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Flame,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queuePracticeSubmission } from "@/lib/offline-db";
import { isOnline } from "@/lib/sync-manager";
import { InstallPrompt } from "@/components/install-prompt";
import { PushPrompt } from "@/components/push-prompt";

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isOnTrack: boolean;
  lastPracticeDate: string | null;
}

interface CalendarDay {
  date: string;
  completed: boolean;
  gutGoal: boolean;
  breathing: boolean;
  grid: boolean;
  epsi: boolean;
  journal: boolean;
}

interface SuccessEntry {
  description: string;
  amplified: string;
  anchored: boolean;
}

interface FailureEntry {
  description: string;
  corrected: string;
  anchored: boolean;
}

interface TodayPractice {
  id: string;
  gutGoal: string | null;
  gutGoalRecordedAt: string | null;
  breathingCompleted: boolean;
  breathingCompletedAt: string | null;
  gridScore: number | null;
  gridTimeSeconds: number | null;
  gridCompletedAt: string | null;
  epsiCompleted: boolean;
  epsiCompletedAt: string | null;
  successLog: string | null;
  failureLog: string | null;
  successFailureCompletedAt: string | null;
  isFullyCompleted: boolean;
  sessionCompletedAt: string | null;
}

const PRACTICE_STEPS = [
  { id: 1, title: "Gut Goal", icon: Target, duration: "1 min", description: "Set your single focus for today's hitting" },
  { id: 2, title: "4-7-8 Breathing", icon: Wind, duration: "2 min", description: "Center your nervous system" },
  { id: 3, title: "Concentration Grid", icon: Grid3X3, duration: "3 min", description: "Sharpen your visual focus" },
  { id: 4, title: "EPSI Visualization", icon: Eye, duration: "4 min", description: "Experience your success image" },
  { id: 5, title: "Success/Failure Log", icon: FileText, duration: "5 min", description: "Anchor corrections in your IAP" },
];

function CalendarHeatmap({ data }: { data: CalendarDay[] }) {
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];
  
  const firstDate = data.length > 0 ? new Date(data[0].date) : new Date();
  const startPadding = firstDate.getDay();
  for (let i = 0; i < startPadding; i++) {
    currentWeek.push({ date: '', completed: false, gutGoal: false, breathing: false, grid: false, epsi: false, journal: false });
  }
  
  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', completed: false, gutGoal: false, breathing: false, grid: false, epsi: false, journal: false });
    }
    weeks.push(currentWeek);
  }
  
  return (
    <div className="space-y-2">
      <div className="flex gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="w-4 h-4 text-[10px] text-muted-foreground flex items-center justify-center">{d}</div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-0.5">
            {week.map((day, di) => {
              if (!day.date) {
                return <div key={di} className="w-4 h-4" />;
              }
              const phaseCount = [day.gutGoal, day.breathing, day.grid, day.epsi, day.journal].filter(Boolean).length;
              return (
                <div
                  key={di}
                  className={cn(
                    "w-4 h-4 rounded-sm transition-colors",
                    day.completed ? "bg-green-500" :
                    phaseCount >= 3 ? "bg-green-500/60" :
                    phaseCount >= 1 ? "bg-green-500/30" :
                    "bg-muted"
                  )}
                  title={`${day.date}: ${day.completed ? 'Completed' : phaseCount > 0 ? `${phaseCount}/5 phases` : 'No practice'}`}
                  data-testid={`calendar-day-${day.date}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <div className="w-3 h-3 rounded-sm bg-green-500/30" />
        <div className="w-3 h-3 rounded-sm bg-green-500/60" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <span>More</span>
      </div>
    </div>
  );
}

function StreakDisplay({ streakInfo }: { streakInfo: StreakInfo }) {
  const isOffTrack = !streakInfo.isOnTrack;
  const hasStreak = streakInfo.currentStreak > 0;
  
  return (
    <div className={cn(
      "relative rounded-lg p-4 transition-all",
      isOffTrack && "ring-2 ring-red-500/50"
    )}>
      {isOffTrack && (
        <div className="absolute inset-0 rounded-lg bg-red-500/5 animate-pulse pointer-events-none" />
      )}
      <div className="relative flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all",
          isOffTrack 
            ? "bg-red-500/20 text-red-500" 
            : hasStreak 
              ? "bg-orange-500/20 text-orange-500" 
              : "bg-muted text-muted-foreground"
        )}>
          {isOffTrack ? (
            <AlertTriangle className="w-7 h-7" />
          ) : (
            <Flame className="w-7 h-7" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn(
              "text-3xl font-bold",
              isOffTrack ? "text-red-500" : hasStreak ? "text-orange-500" : ""
            )} data-testid="text-streak-count">
              {streakInfo.currentStreak}
            </span>
            <span className="text-sm text-muted-foreground">day streak</span>
          </div>
          {isOffTrack ? (
            <p className="text-sm text-red-500 font-medium truncate" data-testid="text-streak-warning">
              Practice today to keep your streak alive
            </p>
          ) : (
            <p className="text-sm text-muted-foreground truncate">
              {streakInfo.longestStreak > streakInfo.currentStreak 
                ? `Best: ${streakInfo.longestStreak} days` 
                : hasStreak ? "Personal best!" : "Start your streak today"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CompletionCelebration() {
  return (
    <Card className="border-2 border-green-500 bg-green-500/5">
      <CardContent className="p-8 text-center space-y-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
          Practice Complete!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Great work completing your daily mental training. 
          Consistency is the foundation of elite performance.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Sparkles className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Your streak continues
          </span>
          <Sparkles className="w-4 h-4 text-green-500" />
        </div>
      </CardContent>
    </Card>
  );
}


export default function Practice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showBadges } = useBadgeNotification();
  const showSidePanels = useIsTabletOrAbove();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [gutGoal, setGutGoal] = useState("");
  const [gridScore, setGridScore] = useState<{ score: number; time: number } | null>(null);
  const [breathingComplete, setBreathingComplete] = useState(false);
  const [epsiComplete, setEpsiComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const [successEntries, setSuccessEntries] = useState<SuccessEntry[]>([
    { description: "", amplified: "", anchored: false }
  ]);
  const [failureEntries, setFailureEntries] = useState<FailureEntry[]>([
    { description: "", corrected: "", anchored: false }
  ]);
  const [noSuccessToday, setNoSuccessToday] = useState(false);
  const [noFailureToday, setNoFailureToday] = useState(false);

  const { data: streakInfo } = useQuery<StreakInfo>({
    queryKey: ['/api/streak'],
  });

  const { data: calendar = [] } = useQuery<CalendarDay[]>({
    queryKey: ['/api/practice-calendar'],
  });

  const { data: todayPractice } = useQuery<TodayPractice | null>({
    queryKey: ['/api/daily-practice/today'],
  });

  const { data: savedEpsi } = useQuery<{ content: string } | null>({
    queryKey: ['/api/user/epsi'],
  });

  useEffect(() => {
    if (todayPractice) {
      if (todayPractice.isFullyCompleted) {
        setSessionComplete(true);
        setCompletedSteps([1, 2, 3, 4, 5]);
        return;
      }
      
      const resumed: number[] = [];
      
      if (todayPractice.gutGoal) {
        setGutGoal(todayPractice.gutGoal);
        resumed.push(1);
      }
      if (todayPractice.breathingCompleted) {
        setBreathingComplete(true);
        resumed.push(2);
      }
      if (todayPractice.gridScore !== null) {
        setGridScore({ score: todayPractice.gridScore, time: todayPractice.gridTimeSeconds || 0 });
        resumed.push(3);
      }
      if (todayPractice.epsiCompleted) {
        setEpsiComplete(true);
        resumed.push(4);
      }
      if (todayPractice.successFailureCompletedAt) {
        try {
          if (todayPractice.successLog) setSuccessEntries(JSON.parse(todayPractice.successLog));
          if (todayPractice.failureLog) setFailureEntries(JSON.parse(todayPractice.failureLog));
        } catch {}
        resumed.push(5);
      }
      
      setCompletedSteps(resumed);
      
      const firstIncomplete = [1, 2, 3, 4, 5].find(s => !resumed.includes(s));
      if (firstIncomplete) setCurrentStep(firstIncomplete);
    }
  }, [todayPractice]);

  const [offlineSaved, setOfflineSaved] = useState(false);

  const savePhaseProgress = useCallback(async (data: Record<string, any>) => {
    const payload = {
      practiceDate: new Date().toISOString().split('T')[0],
      ...data,
    };
    try {
      if (!isOnline()) {
        await queuePracticeSubmission(payload);
        setOfflineSaved(true);
        return;
      }
      await apiRequest('POST', '/api/daily-practice', payload);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-practice/today'] });
    } catch (error) {
      await queuePracticeSubmission(payload);
      setOfflineSaved(true);
      console.error('Failed to auto-save, queued offline:', error);
    }
  }, []);

  useEffect(() => {
    if (gutGoal.trim().length > 0) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        savePhaseProgress({ gutGoal, gutGoalRecordedAt: new Date().toISOString() });
      }, 10000);
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [gutGoal, savePhaseProgress]);

  const journalAutoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedJournalRef = useRef<string>("");
  useEffect(() => {
    const hasContent = successEntries.some(e => e.description.trim()) || failureEntries.some(e => e.description.trim());
    const currentJson = JSON.stringify({ s: successEntries, f: failureEntries });
    if (hasContent && currentJson !== lastSavedJournalRef.current) {
      if (journalAutoSaveRef.current) clearTimeout(journalAutoSaveRef.current);
      journalAutoSaveRef.current = setTimeout(() => {
        lastSavedJournalRef.current = currentJson;
        savePhaseProgress({
          successLog: JSON.stringify(successEntries.filter(e => e.description.trim())),
          failureLog: JSON.stringify(failureEntries.filter(e => e.description.trim())),
        });
      }, 10000);
    }
    return () => {
      if (journalAutoSaveRef.current) clearTimeout(journalAutoSaveRef.current);
    };
  }, [successEntries, failureEntries, savePhaseProgress]);

  const totalProgress = (completedSteps.length / PRACTICE_STEPS.length) * 100;

  const handleStepComplete = async (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }

    switch (stepId) {
      case 1:
        await savePhaseProgress({ 
          gutGoal, 
          gutGoalRecordedAt: new Date().toISOString() 
        });
        break;
      case 2:
        await savePhaseProgress({ 
          breathingCompleted: true, 
          breathingCompletedAt: new Date().toISOString() 
        });
        break;
      case 3:
        if (gridScore) {
          await savePhaseProgress({ 
            gridScore: gridScore.score, 
            gridTimeSeconds: gridScore.time,
            gridCompletedAt: new Date().toISOString()
          });
        }
        break;
      case 4:
        await savePhaseProgress({ 
          epsiCompleted: true, 
          epsiCompletedAt: new Date().toISOString() 
        });
        break;
    }

    if (stepId < 5) {
      setCurrentStep(stepId + 1);
    }
  };

  const handleFinishPractice = async () => {
    setIsSaving(true);
    const successData = noSuccessToday 
      ? JSON.stringify([{ description: "None today", amplified: "", anchored: false }])
      : JSON.stringify(successEntries.filter(e => e.description.trim()));
    const failureData = noFailureToday 
      ? JSON.stringify([{ description: "None today", corrected: "", anchored: false }])
      : JSON.stringify(failureEntries.filter(e => e.description.trim()));

    const practicePayload = {
      practiceDate: new Date().toISOString().split('T')[0],
      gutGoal,
      breathingCompleted: breathingComplete,
      gridScore: gridScore?.score,
      gridTimeSeconds: gridScore?.time,
      epsiCompleted: epsiComplete,
      successLog: successData,
      failureLog: failureData,
      successFailureCompletedAt: new Date().toISOString(),
      isFullyCompleted: true,
      sessionCompletedAt: new Date().toISOString(),
      totalTimeMinutes: 15,
    };

    try {
      if (!isOnline()) {
        await queuePracticeSubmission(practicePayload);
        setOfflineSaved(true);
        if (!completedSteps.includes(5)) {
          setCompletedSteps(prev => [...prev, 5]);
        }
        setSessionComplete(true);
        toast({
          title: "Saved Offline",
          description: "Your practice will sync when you're back online.",
        });
      } else {
        const practiceRes = await apiRequest('POST', '/api/daily-practice', practicePayload);
        const practiceData = await practiceRes.json();
        if (practiceData.newBadges?.length) showBadges(practiceData.newBadges);
        
        if (!completedSteps.includes(5)) {
          setCompletedSteps(prev => [...prev, 5]);
        }
        setSessionComplete(true);
        queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/daily-practice'] });
        queryClient.invalidateQueries({ queryKey: ['/api/daily-practice/today'] });
        queryClient.invalidateQueries({ queryKey: ['/api/streak'] });
        queryClient.invalidateQueries({ queryKey: ['/api/practice-calendar'] });
        toast({
          title: "Practice Complete!",
          description: "Your daily mental training session has been logged.",
        });
      }
    } catch (error) {
      try {
        await queuePracticeSubmission(practicePayload);
        setOfflineSaved(true);
        setSessionComplete(true);
        toast({
          title: "Saved Offline",
          description: "Your practice will sync when you're back online.",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to save practice. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addSuccessEntry = () => {
    if (successEntries.length < 4) {
      setSuccessEntries([...successEntries, { description: "", amplified: "", anchored: false }]);
    }
  };

  const removeSuccessEntry = (index: number) => {
    if (successEntries.length > 1) {
      setSuccessEntries(successEntries.filter((_, i) => i !== index));
    }
  };

  const updateSuccessEntry = (index: number, field: keyof SuccessEntry, value: string | boolean) => {
    const updated = [...successEntries];
    (updated[index] as any)[field] = value;
    setSuccessEntries(updated);
  };

  const addFailureEntry = () => {
    if (failureEntries.length < 4) {
      setFailureEntries([...failureEntries, { description: "", corrected: "", anchored: false }]);
    }
  };

  const removeFailureEntry = (index: number) => {
    if (failureEntries.length > 1) {
      setFailureEntries(failureEntries.filter((_, i) => i !== index));
    }
  };

  const updateFailureEntry = (index: number, field: keyof FailureEntry, value: string | boolean) => {
    const updated = [...failureEntries];
    (updated[index] as any)[field] = value;
    setFailureEntries(updated);
  };

  const canCompleteSuccessFailure = () => {
    if (noSuccessToday && noFailureToday) return true;
    const hasSuccess = noSuccessToday || successEntries.some(e => e.description.trim().length > 0);
    const hasFailure = noFailureToday || failureEntries.some(e => e.description.trim().length > 0);
    return hasSuccess && hasFailure;
  };

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2" data-testid="text-step-title">What's Your Gut Goal Today?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                What's the single most important thing for you to focus on today in your hitting? 
                Don't overthink it - trust your gut.
              </p>
              <Textarea
                placeholder="Today I will focus on..."
                value={gutGoal}
                onChange={(e) => {
                  const words = wordCount(e.target.value);
                  if (words <= 100) setGutGoal(e.target.value);
                }}
                className="min-h-[120px]"
                data-testid="input-gut-goal"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {wordCount(gutGoal)}/100 words
                </p>
                <p className="text-xs text-muted-foreground">
                  Auto-saves every 10 seconds
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleStepComplete(1)}
              disabled={gutGoal.trim().length === 0}
              className="w-full"
              data-testid="button-complete-step-1"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <GuidedBreathing 
              onComplete={() => {
                setBreathingComplete(true);
                handleStepComplete(2);
              }} 
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Concentration Grid</h3>
              <p className="text-sm text-muted-foreground">
                Find and tap numbers 00-99 in order as fast as you can. You have 3 minutes.
              </p>
            </div>
            <ConcentrationGrid 
              onComplete={(score, time) => {
                setGridScore({ score, time });
                handleStepComplete(3);
              }} 
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">EPSI Visualization</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Read your EPSI slowly, then close your eyes and experience it vividly for 4 minutes.
              </p>
            </div>
            
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">Your Endpoint Success Image</h4>
                </div>
                {savedEpsi?.content ? (
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm italic leading-relaxed whitespace-pre-wrap" data-testid="text-saved-epsi">
                      {savedEpsi.content}
                    </p>
                  </div>
                ) : (
                  <div className="bg-background/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No EPSI saved yet. Complete Module 6 to create your Endpoint Success Image.
                    </p>
                    <p className="text-sm italic text-muted-foreground mt-3">
                      For now, visualize yourself at the plate, perfectly balanced, eyes locked on the pitcher's 
                      release point. Feel the calm certainty in your body. See the ball leave the 
                      pitcher's hand, watch it all the way in, feel the perfect swing, hear the 
                      crack of the bat...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              onClick={() => {
                setEpsiComplete(true);
                handleStepComplete(4);
              }}
              className="w-full"
              data-testid="button-complete-epsi"
            >
              I've Completed My Visualization
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <h3 className="text-lg font-semibold">Success / Failure Log</h3>
                <span className="text-xs text-muted-foreground" data-testid="text-journal-autosave">Auto-saves every 10s</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Reflect on recent performances. Amplify successes and correct failures through your IAP.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-600 dark:text-green-400">Recent Successes</h4>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="no-success"
                    checked={noSuccessToday}
                    onCheckedChange={(checked) => setNoSuccessToday(checked === true)}
                    data-testid="checkbox-no-success"
                  />
                  <label htmlFor="no-success" className="text-sm text-muted-foreground cursor-pointer">
                    None today
                  </label>
                </div>
              </div>

              {!noSuccessToday && successEntries.map((entry, index) => (
                <Card key={index} className="bg-green-500/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium">Success #{index + 1}</label>
                      {successEntries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSuccessEntry(index)}
                          data-testid={`button-remove-success-${index}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="What happened? (brief description)"
                      value={entry.description}
                      onChange={(e) => updateSuccessEntry(index, 'description', e.target.value)}
                      data-testid={`input-success-desc-${index}`}
                    />
                    <Textarea
                      placeholder="Describe this as a perfect 10/10 experience. Amplify every detail."
                      value={entry.amplified}
                      onChange={(e) => updateSuccessEntry(index, 'amplified', e.target.value)}
                      className="min-h-[80px]"
                      data-testid={`input-success-amplified-${index}`}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`anchored-success-${index}`}
                        checked={entry.anchored}
                        onCheckedChange={(checked) => updateSuccessEntry(index, 'anchored', checked === true)}
                        data-testid={`checkbox-success-anchored-${index}`}
                      />
                      <label htmlFor={`anchored-success-${index}`} className="text-sm text-muted-foreground cursor-pointer">
                        I anchored this in my IAP
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!noSuccessToday && successEntries.length < 4 && (
                <Button variant="outline" onClick={addSuccessEntry} className="w-full" data-testid="button-add-success">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Success
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-orange-600 dark:text-orange-400">Learning Opportunities</h4>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="no-failure"
                    checked={noFailureToday}
                    onCheckedChange={(checked) => setNoFailureToday(checked === true)}
                    data-testid="checkbox-no-failure"
                  />
                  <label htmlFor="no-failure" className="text-sm text-muted-foreground cursor-pointer">
                    None today
                  </label>
                </div>
              </div>

              {!noFailureToday && failureEntries.map((entry, index) => (
                <Card key={index} className="bg-orange-500/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium">Correction #{index + 1}</label>
                      {failureEntries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFailureEntry(index)}
                          data-testid={`button-remove-failure-${index}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Brief description (10 words max - don't dwell)"
                      value={entry.description}
                      onChange={(e) => {
                        const words = wordCount(e.target.value);
                        if (words <= 10) updateFailureEntry(index, 'description', e.target.value);
                      }}
                      data-testid={`input-failure-desc-${index}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {wordCount(entry.description)}/10 words
                    </p>
                    <Textarea
                      placeholder="What would the perfect 10/10 response have been? Describe the corrected version in vivid detail."
                      value={entry.corrected}
                      onChange={(e) => updateFailureEntry(index, 'corrected', e.target.value)}
                      className="min-h-[80px]"
                      data-testid={`input-failure-corrected-${index}`}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`anchored-failure-${index}`}
                        checked={entry.anchored}
                        onCheckedChange={(checked) => updateFailureEntry(index, 'anchored', checked === true)}
                        data-testid={`checkbox-failure-anchored-${index}`}
                      />
                      <label htmlFor={`anchored-failure-${index}`} className="text-sm text-muted-foreground cursor-pointer">
                        I anchored the correction in my IAP
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!noFailureToday && failureEntries.length < 4 && (
                <Button variant="outline" onClick={addFailureEntry} className="w-full" data-testid="button-add-failure">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Correction
                </Button>
              )}
            </div>

            <Button 
              onClick={() => {
                handleStepComplete(5);
                handleFinishPractice();
              }}
              disabled={isSaving || !canCompleteSuccessFailure()}
              className="w-full"
              data-testid="button-finish-practice"
            >
              {isSaving ? "Saving..." : "Complete Practice"}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout
      title="Daily Practice"
      subtitle="15-minute mental training session"
    >
      <div className="p-4 md:p-6 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6 min-w-0">
          <div className="grid tablet:grid-cols-3 gap-6 min-w-0">
            <div className="tablet:col-span-2 space-y-6 min-w-0 overflow-hidden">
              {streakInfo && (
                <Card>
                  <CardContent className="p-4">
                    <StreakDisplay streakInfo={streakInfo} />
                  </CardContent>
                </Card>
              )}

              {sessionComplete ? (
                <CompletionCelebration />
              ) : (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Session Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {completedSteps.length}/{PRACTICE_STEPS.length} phases
                        </span>
                      </div>
                      <Progress value={totalProgress} className="h-2" />
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between gap-1 pb-2">
                    {PRACTICE_STEPS.map((step) => {
                      const StepIcon = step.icon;
                      const isCompleted = completedSteps.includes(step.id);
                      const isCurrent = currentStep === step.id;
                      
                      return (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStep(step.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2 rounded-lg flex-1 min-w-0 transition-colors",
                            isCurrent && "bg-primary/10",
                            isCompleted && !isCurrent && "bg-green-500/10"
                          )}
                          data-testid={`button-step-${step.id}`}
                        >
                          <div className={cn(
                            "w-9 h-9 twohanded:w-10 twohanded:h-10 rounded-full flex items-center justify-center shrink-0",
                            isCompleted ? "bg-green-500 text-white" :
                            isCurrent ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 twohanded:w-5 twohanded:h-5" />
                            ) : (
                              <StepIcon className="w-4 h-4 twohanded:w-5 twohanded:h-5" />
                            )}
                          </div>
                          <div className="text-center min-w-0 w-full">
                            <span className={cn(
                              "text-[10px] twohanded:text-xs font-medium block truncate",
                              isCurrent ? "text-primary" : 
                              isCompleted ? "text-green-600 dark:text-green-400" : 
                              "text-muted-foreground"
                            )}>
                              {step.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {step.duration}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 min-w-0">
                        {(() => {
                          const StepIcon = PRACTICE_STEPS[currentStep - 1].icon;
                          return (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <StepIcon className="w-5 h-5 text-primary" />
                            </div>
                          );
                        })()}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate">{PRACTICE_STEPS[currentStep - 1].title}</CardTitle>
                          <CardDescription className="truncate">{PRACTICE_STEPS[currentStep - 1].description}</CardDescription>
                        </div>
                        {completedSteps.includes(currentStep) && (
                          <Badge variant="default" className="ml-auto bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderStepContent()}
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      data-testid="button-prev-step"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    {currentStep < 5 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                        data-testid="button-next-step"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {showSidePanels && <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Practice Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarHeatmap data={calendar} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Today's Phases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {PRACTICE_STEPS.map((step) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md text-sm",
                          isCompleted && "bg-green-500/10"
                        )}
                        data-testid={`phase-status-${step.id}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <StepIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn(
                          isCompleted ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        )}>
                          {step.title}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">{step.duration}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>}
          </div>
        </div>

        {offlineSaved && (
          <div className="fixed bottom-24 left-4 right-4 z-40 bg-yellow-500/90 text-black text-sm font-medium text-center py-2 px-4 rounded-lg" data-testid="offline-indicator">
            Saved offline — will sync when connected
          </div>
        )}

        <InstallPrompt afterFirstPractice={sessionComplete} />
        <PushPrompt afterFirstPractice={sessionComplete} />
      </div>
    </AppLayout>
  );
}
