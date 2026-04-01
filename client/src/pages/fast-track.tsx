import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBadgeNotification } from "@/components/badge-notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/app-layout";
import {
  Target,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Wind,
  Eye,
  Zap,
  Clock,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LessonId = "0.1" | "0.2" | "0.3";

interface BreathingState {
  phase: "inhale" | "hold" | "exhale" | "idle";
  count: number;
  cycles: number;
  running: boolean;
}

export default function FastTrackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showBadges } = useBadgeNotification();
  const [, navigate] = useLocation();
  const [activeLesson, setActiveLesson] = useState<LessonId>("0.1");
  const [completedLessons, setCompletedLessons] = useState<Set<LessonId>>(
    new Set()
  );
  const [certaintyRating, setCertaintyRating] = useState(5);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [breathingState, setBreathingState] = useState<BreathingState>({
    phase: "idle",
    count: 0,
    cycles: 0,
    running: false,
  });
  const [visualizationWords, setVisualizationWords] = useState("");
  const [confidence, setConfidence] = useState(5);
  const [focus, setFocus] = useState(5);
  const [readiness, setReadiness] = useState(5);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const breathingRef = useRef<NodeJS.Timeout | null>(null);

  const completeLesson = useCallback(
    async (lessonId: LessonId) => {
      setCompletedLessons((prev) => new Set(prev).add(lessonId));

      if (lessonId === "0.1") {
        try {
          await apiRequest("POST", "/api/certainty-ratings", {
            rating: certaintyRating,
            notes: "Day 0 baseline from Fast Track",
          });
        } catch (e) {
          console.error("Error saving certainty rating:", e);
        }
      }

      if (lessonId === "0.2" && !xpAwarded) {
        try {
          const res = await apiRequest("POST", "/api/xp/award", {
            eventType: "first_practice",
            xpAmount: 50,
            description: "Completed first 15-minute practice",
          });
          const data = await res.json();
          if (data.newBadges?.length) showBadges(data.newBadges);
          setXpAwarded(true);
          setPracticeComplete(true);
        } catch (e) {
          console.error("Error awarding XP:", e);
        }
      }

      if (lessonId === "0.3") {
        try {
          await apiRequest("POST", "/api/certainty-ratings", {
            rating: certaintyRating,
            notes: "Day 0 certainty rating system lesson",
          });
          const res = await apiRequest("POST", "/api/xp/award", {
            eventType: "day0_complete",
            xpAmount: 50,
            description: "Completed Day 0 Fast Track",
          });
          const data = await res.json();
          if (data.newBadges?.length) showBadges(data.newBadges);
          await apiRequest("POST", "/api/auth/update-profile", {
            onboardingCompleted: true,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (e) {
          console.error("Error:", e);
        }
        toast({
          title: "Day 0 Complete!",
          description: "You've earned 100 XP. Your training begins now.",
        });
        setTimeout(() => navigate("/"), 2000);
      }
    },
    [certaintyRating, xpAwarded, toast, navigate]
  );

  const startBreathing = () => {
    if (breathingState.running) {
      if (breathingRef.current) clearInterval(breathingRef.current);
      setBreathingState((prev) => ({ ...prev, running: false, phase: "idle" }));
      return;
    }

    setBreathingState({ phase: "inhale", count: 4, cycles: 0, running: true });

    let phase: "inhale" | "hold" | "exhale" = "inhale";
    let count = 4;
    let cycles = 0;
    const totalCycles = 3;

    breathingRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (phase === "inhale") {
          phase = "hold";
          count = 7;
        } else if (phase === "hold") {
          phase = "exhale";
          count = 8;
        } else {
          cycles++;
          if (cycles >= totalCycles) {
            clearInterval(breathingRef.current!);
            setBreathingState({
              phase: "idle",
              count: 0,
              cycles: totalCycles,
              running: false,
            });
            return;
          }
          phase = "inhale";
          count = 4;
        }
      }
      setBreathingState({ phase, count, cycles, running: true });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (breathingRef.current) clearInterval(breathingRef.current);
    };
  }, []);

  const lessons = [
    {
      id: "0.1" as LessonId,
      title: "The Operating System Concept",
      time: "~10 min",
      icon: Target,
    },
    {
      id: "0.2" as LessonId,
      title: "Your First 15-Minute Practice",
      time: "~15 min",
      icon: Play,
    },
    {
      id: "0.3" as LessonId,
      title: "The Certainty Rating System",
      time: "~5 min",
      icon: Zap,
    },
  ];

  return (
    <AppLayout title="Day 0: Fast Track" hideMobileNav>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" data-testid="text-fast-track-title">
            Day 0: Fast Track
          </h1>
          <p className="text-sm text-muted-foreground">
            Install your mental performance operating system in 30 minutes.
          </p>
        </div>

        <div className="flex gap-2">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson.id)}
              className={cn(
                "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors",
                activeLesson === lesson.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : completedLessons.has(lesson.id)
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                  : "bg-muted/50 border-border"
              )}
              data-testid={`button-lesson-${lesson.id}`}
            >
              {completedLessons.has(lesson.id) ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <lesson.icon className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="hidden sm:inline">{lesson.title.split(" ").slice(0, 2).join(" ")}</span>
              <span className="sm:hidden">{lesson.id}</span>
            </button>
          ))}
        </div>

        {activeLesson === "0.1" && (
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-2xl sm:text-3xl font-bold leading-tight" data-testid="text-hook">
                  Your brain is hardware.
                  <br />
                  <span className="text-primary">
                    You've been running the wrong software.
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  60-second concept that changes everything
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Every baseball player has the same hardware — eyes, hands,
                reflexes. The difference between a .200 hitter and a .300 hitter
                isn't physical. It's the mental software running behind the
                scenes.
              </p>
              <p>
                Your brain is a bio-computer. Right now, it's running programs
                you never installed — doubt loops, fear scripts, overthinking
                routines. These programs fire automatically in pressure moments,
                hijacking your natural ability.
              </p>
              <p>
                The 6th Tool is a systematic method to identify those bad
                programs, uninstall them, and replace them with elite
                performance software. It's not motivation. It's not "just believe
                in yourself." It's a precise mental technology based on
                Cybernetic Transposition.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">
                Your First Action: Baseline Certainty Rating
              </h3>
              <p className="text-sm text-muted-foreground">
                How certain are you right now that you can perform at your best
                when it matters?
              </p>
              <div className="px-2">
                <Slider
                  value={[certaintyRating]}
                  onValueChange={([val]) => setCertaintyRating(val)}
                  min={1}
                  max={10}
                  step={1}
                  data-testid="slider-certainty"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 — Not at all</span>
                <span className="text-lg font-bold text-foreground">
                  {certaintyRating}
                </span>
                <span>10 — Absolutely</span>
              </div>
            </div>

            <button
              onClick={() => setShowDeepDive(!showDeepDive)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
              data-testid="button-deep-dive-toggle"
            >
              <span className="font-medium">
                Deep Dive: Cybernetic Transposition
              </span>
              {showDeepDive ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDeepDive && (
              <div className="p-4 rounded-lg bg-muted/30 text-sm space-y-3">
                <p>
                  Cybernetic Transposition (CT) was developed by Dr. Stuart
                  Lichtman, combining principles from systems engineering,
                  neuroscience, and behavioral psychology. "Cybernetic" comes
                  from the Greek word for "self-steering" — like a guided
                  missile that constantly adjusts its course toward a target.
                </p>
                <p>
                  Your brain has four processing modes: Left brain (logical),
                  Right brain (intuitive), Midbrain (emotional), and Brain Stem
                  (habitual). Elite performance requires all four to align on the
                  same target. When they conflict, you get mechanical
                  breakdowns, choking under pressure, and inconsistency.
                </p>
                <p>
                  The 6th Tool teaches you to align all four brain levels toward
                  a single performance target — your Endpoint Success Image
                  (EPSI). When aligned, you enter a state of flow where your
                  best baseball happens automatically.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => completeLesson("0.1")}
              disabled={completedLessons.has("0.1")}
              data-testid="button-complete-0.1"
            >
              {completedLessons.has("0.1") ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Completed
                </>
              ) : (
                <>
                  Mark Complete & Continue{" "}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {activeLesson === "0.2" && (
          <div className="space-y-6">
            {practiceComplete ? (
              <Card className="border-green-500/30 bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="text-4xl">🔥</div>
                  <h2
                    className="text-xl font-bold"
                    data-testid="text-practice-complete"
                  >
                    PRACTICE COMPLETE
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Flame className="w-5 h-5" />
                    <span className="text-lg font-bold">Streak: 1 day</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    +50 XP earned! You're on your way.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">
                    Your First 15-Minute Practice
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Follow each step. No shortcuts.
                  </p>
                </div>

                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          Step 1: Breathing (3 min)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          4-7-8 pattern: Inhale 4s, Hold 7s, Exhale 8s
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div
                        className={cn(
                          "w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-1000",
                          breathingState.phase === "inhale"
                            ? "scale-110 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : breathingState.phase === "hold"
                            ? "scale-110 border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                            : breathingState.phase === "exhale"
                            ? "scale-90 border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-border"
                        )}
                      >
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {breathingState.running
                              ? breathingState.count
                              : "4-7-8"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {breathingState.running
                              ? breathingState.phase
                              : "Ready"}
                          </p>
                        </div>
                      </div>

                      {breathingState.cycles >= 3 ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> 3 cycles
                          complete
                        </p>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={startBreathing}
                          data-testid="button-start-breathing"
                        >
                          {breathingState.running
                            ? "Stop"
                            : breathingState.cycles > 0
                            ? `Continue (${breathingState.cycles}/3)`
                            : "Start Breathing"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          Step 2: Visualization (5 min)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Close your eyes. Replay your best at-bat ever. Then
                          describe it in 3 words.
                        </p>
                      </div>
                    </div>

                    <Textarea
                      value={visualizationWords}
                      onChange={(e) => setVisualizationWords(e.target.value)}
                      placeholder="e.g., Locked in. Crushing. Unstoppable."
                      className="h-16"
                      data-testid="input-visualization"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          Step 3: Self-Assessment (5 min)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Rate yourself right now.
                        </p>
                      </div>
                    </div>

                    {[
                      { label: "Confidence", value: confidence, setter: setConfidence },
                      { label: "Focus", value: focus, setter: setFocus },
                      { label: "Readiness", value: readiness, setter: setReadiness },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value}/10</span>
                        </div>
                        <Slider
                          value={[item.value]}
                          onValueChange={([v]) => item.setter(v)}
                          min={1}
                          max={10}
                          step={1}
                          data-testid={`slider-${item.label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => completeLesson("0.2")}
                  disabled={
                    breathingState.cycles < 3 ||
                    !visualizationWords.trim()
                  }
                  data-testid="button-complete-0.2"
                >
                  Complete Practice{" "}
                  <span className="ml-2 text-xs opacity-80">+50 XP</span>
                </Button>
              </>
            )}
          </div>
        )}

        {activeLesson === "0.3" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">The Certainty Rating System</h2>
              <p className="text-sm text-muted-foreground">
                Your daily pulse check on mental performance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  range: "1-3",
                  label: "Reboot",
                  color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                  desc: "System needs reset. Focus on breathing & basics.",
                },
                {
                  range: "4-6",
                  label: "Lagging",
                  color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                  desc: "Running slow. Extra visualization today.",
                },
                {
                  range: "7-8",
                  label: "Optimized",
                  color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                  desc: "Good flow state. Maintain with practice.",
                },
                {
                  range: "9-10",
                  label: "Elite",
                  color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                  desc: "Peak performance zone. Trust the system.",
                },
              ].map((tier) => (
                <Card key={tier.range}>
                  <CardContent className="p-3 space-y-1">
                    <div
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full inline-block",
                        tier.color
                      )}
                    >
                      {tier.range}: {tier.label}
                    </div>
                    <p className="text-xs text-muted-foreground">{tier.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm">
                  Log Today's Certainty Rating
                </h3>
                <p className="text-sm text-muted-foreground">
                  How certain are you that your mental game will support you this
                  week?
                </p>
                <div className="px-2">
                  <Slider
                    value={[certaintyRating]}
                    onValueChange={([val]) => setCertaintyRating(val)}
                    min={1}
                    max={10}
                    step={1}
                    data-testid="slider-final-certainty"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 — Reboot</span>
                  <span className="text-2xl font-bold text-foreground">
                    {certaintyRating}
                  </span>
                  <span>10 — Elite</span>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={() => completeLesson("0.3")}
              data-testid="button-complete-0.3"
            >
              Complete Day 0 & Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
