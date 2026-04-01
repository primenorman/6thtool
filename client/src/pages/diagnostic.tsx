import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Target,
  ArrowRight,
  ArrowLeft,
  Brain,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const POSITIONS = [
  "Pitcher",
  "Catcher",
  "First Base",
  "Second Base",
  "Shortstop",
  "Third Base",
  "Left Field",
  "Center Field",
  "Right Field",
  "DH",
  "Utility",
];

const LEVELS = [
  "Youth (12U)",
  "Middle School",
  "High School JV",
  "High School Varsity",
  "Travel Ball",
  "College D3/NAIA",
  "College D2",
  "College D1",
  "Independent/Minor League",
  "Professional",
];

const BLOCKERS = [
  { id: "slumps", label: "Can't break out of slumps" },
  { id: "big_moments", label: "Choke in big moments" },
  { id: "between_abs", label: "Mind wanders between at-bats" },
  { id: "errors", label: "One error spirals into more" },
  { id: "coach_pressure", label: "Tight when coaches watch" },
  { id: "fear_failure", label: "Fear of failure or looking bad" },
  { id: "overthinking", label: "Overthink mechanics at the plate" },
  { id: "pregame_anxiety", label: "Pre-game nerves or anxiety" },
  { id: "comparison", label: "Compare myself to teammates" },
];

const STRENGTHS = [
  { id: "focus", label: "Focus during at-bats" },
  { id: "confidence", label: "Confidence at the plate" },
  { id: "bounce_back", label: "Bounce-back after failure" },
  { id: "big_moments", label: "Performance in big moments" },
  { id: "between_abs", label: "Staying present between ABs" },
  { id: "pregame", label: "Pre-game mental state" },
];

interface QuizData {
  position: string[];
  level: string;
  yearsPlayed: string;
  satisfaction: number;
  strengths: Record<string, number>;
  blockers: string[];
  learningPref: string;
  sessionLength: string;
  schedule: string;
  topGoal: string;
  priorTraining: string;
}

const INITIAL_DATA: QuizData = {
  position: [],
  level: "",
  yearsPlayed: "",
  satisfaction: 5,
  strengths: {
    focus: 5,
    confidence: 5,
    bounce_back: 5,
    big_moments: 5,
    between_abs: 5,
    pregame: 5,
  },
  blockers: [],
  learningPref: "",
  sessionLength: "",
  schedule: "",
  topGoal: "",
  priorTraining: "",
};

export default function DiagnosticPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuizData>(INITIAL_DATA);
  const [generating, setGenerating] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0:
        return data.position.length > 0 && data.level && data.yearsPlayed;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return data.learningPref && data.sessionLength && data.schedule;
      case 4:
        return data.topGoal && data.priorTraining;
      default:
        return false;
    }
  }, [step, data]);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setGenerating(true);
      setTimeout(() => {
        setGenerating(false);
        setShowProfile(true);
      }, 2500);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const togglePosition = (pos: string) => {
    setData((prev) => ({
      ...prev,
      position: prev.position.includes(pos)
        ? prev.position.filter((p) => p !== pos)
        : [...prev.position, pos],
    }));
  };

  const toggleBlocker = (id: string) => {
    setData((prev) => ({
      ...prev,
      blockers: prev.blockers.includes(id)
        ? prev.blockers.filter((b) => b !== id)
        : [...prev.blockers, id],
    }));
  };

  const setStrength = (id: string, value: number) => {
    setData((prev) => ({
      ...prev,
      strengths: { ...prev.strengths, [id]: value },
    }));
  };

  const handleSaveAndSignup = () => {
    const profileData = {
      ...data,
      topStrengths: getTopStrengths(),
      weaknesses: getWeaknesses(),
      recommendedPath: getRecommendedPath(),
    };
    sessionStorage.setItem("diagnostic_results", JSON.stringify(profileData));
    navigate("/auth");
  };

  const getTopStrengths = () => {
    return Object.entries(data.strengths)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, value]) => ({
        id,
        label: STRENGTHS.find((s) => s.id === id)?.label || id,
        value,
      }));
  };

  const getWeaknesses = () => {
    return Object.entries(data.strengths)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .filter(([, value]) => value <= 6)
      .map(([id, value]) => ({
        id,
        label: STRENGTHS.find((s) => s.id === id)?.label || id,
        value,
      }));
  };

  const getRecommendedPath = () => {
    return data.satisfaction <= 5 || data.blockers.length >= 3
      ? "Fast Track (6 days)"
      : "Deep Dive (6 weeks)";
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold" data-testid="text-generating">
              ANALYZING YOUR BIO-COMPUTER
            </h2>
            <p className="text-sm text-muted-foreground">
              Generating your mental performance profile...
            </p>
          </div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 300}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showProfile) {
    const topStrengths = getTopStrengths();
    const weaknesses = getWeaknesses();
    const flaggedBlockers = data.blockers.map(
      (id) => BLOCKERS.find((b) => b.id === id)?.label || id
    );
    const path = getRecommendedPath();

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-6 py-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <Target className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-profile-title">
              Your Bio-Computer Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.position.join(" / ")} at {data.level}
            </p>
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Mental Strengths
              </h3>
              {topStrengths.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {s.value}/10
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${s.value * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {weaknesses.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Opportunity Zones
                </h3>
                {weaknesses.map((w) => (
                  <div key={w.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{w.label}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {w.value}/10
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${w.value * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {flaggedBlockers.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Flagged Blockers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {flaggedBlockers.map((b, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Recommended Path</h3>
              </div>
              <p className="text-2xl font-bold" data-testid="text-recommended-path">{path}</p>
              <p className="text-sm text-muted-foreground">
                {path.includes("Fast Track")
                  ? "Intensive daily training to rapidly rewire your mental game."
                  : "Comprehensive deep dive to build lasting mental performance habits."}
              </p>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSaveAndSignup}
            data-testid="button-save-profile"
          >
            Save My Profile & Start Training
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Bio-Computer Diagnostic</h1>
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {totalSteps}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Performance Profile</h2>
              <p className="text-sm text-muted-foreground">
                Tell us about your game so we can personalize your training.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Position(s)</label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => togglePosition(pos)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-colors",
                      data.position.includes(pos)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border hover:border-primary/50"
                    )}
                    data-testid={`button-position-${pos.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Level of Play</label>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setData((prev) => ({ ...prev, level }))}
                    className={cn(
                      "text-xs px-3 py-2 rounded-lg border text-left transition-colors",
                      data.level === level
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border hover:border-primary/50"
                    )}
                    data-testid={`button-level-${level.toLowerCase().replace(/[\s\/()]+/g, '-')}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Years Playing</label>
              <div className="flex gap-2">
                {["1-3", "4-6", "7-10", "10+"].map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      setData((prev) => ({ ...prev, yearsPlayed: y }))
                    }
                    className={cn(
                      "flex-1 text-sm px-3 py-2 rounded-lg border transition-colors",
                      data.yearsPlayed === y
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border hover:border-primary/50"
                    )}
                    data-testid={`button-years-${y}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                Overall satisfaction with your mental game
              </label>
              <div className="px-2">
                <Slider
                  value={[data.satisfaction]}
                  onValueChange={([val]) =>
                    setData((prev) => ({ ...prev, satisfaction: val }))
                  }
                  min={1}
                  max={10}
                  step={1}
                  data-testid="slider-satisfaction"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 — Struggling</span>
                <span className="font-medium text-foreground">
                  {data.satisfaction}
                </span>
                <span>10 — Elite</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Mental Strengths</h2>
              <p className="text-sm text-muted-foreground">
                Rate yourself honestly on each mental skill. No wrong answers.
              </p>
            </div>

            {STRENGTHS.map((s) => (
              <div key={s.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground">
                    {data.strengths[s.id]}/10
                  </span>
                </div>
                <Slider
                  value={[data.strengths[s.id]]}
                  onValueChange={([val]) => setStrength(s.id, val)}
                  min={1}
                  max={10}
                  step={1}
                  data-testid={`slider-strength-${s.id}`}
                />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Blocker Identification</h2>
              <p className="text-sm text-muted-foreground">
                Select any that apply to you. Be honest — this helps us target
                your training.
              </p>
            </div>

            <div className="space-y-2">
              {BLOCKERS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => toggleBlocker(b.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3",
                    data.blockers.includes(b.id)
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-muted/30 border-border hover:border-primary/50"
                  )}
                  data-testid={`button-blocker-${b.id}`}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                      data.blockers.includes(b.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {data.blockers.includes(b.id) && (
                      <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Learning Style</h2>
              <p className="text-sm text-muted-foreground">
                Help us customize your training experience.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                How do you learn best?
              </label>
              {["Reading & writing", "Watching videos", "Hands-on practice"].map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() =>
                      setData((prev) => ({ ...prev, learningPref: opt }))
                    }
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                      data.learningPref === opt
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border hover:border-primary/50"
                    )}
                    data-testid={`button-learning-${opt.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Preferred session length
              </label>
              {["5-10 min (Quick hits)", "10-15 min (Standard)", "15-20 min (Deep work)"].map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() =>
                      setData((prev) => ({ ...prev, sessionLength: opt }))
                    }
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                      data.sessionLength === opt
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border hover:border-primary/50"
                    )}
                    data-testid={`button-session-${opt.split(' ')[0]}`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">When will you train?</label>
              {["Morning (before school/work)", "After practice", "Evening (before bed)"].map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() =>
                      setData((prev) => ({ ...prev, schedule: opt }))
                    }
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                      data.schedule === opt
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border hover:border-primary/50"
                    )}
                    data-testid={`button-schedule-${opt.split(' ')[0].toLowerCase()}`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Priority Goal</h2>
              <p className="text-sm text-muted-foreground">
                What would make the biggest difference in your game?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Top area for improvement
              </label>
              {[
                "Confidence at the plate",
                "Focus & concentration",
                "Handling pressure situations",
                "Bouncing back from failure",
                "Pre-game mental preparation",
                "Overall consistency",
              ].map((opt) => (
                <button
                  key={opt}
                  onClick={() =>
                    setData((prev) => ({ ...prev, topGoal: opt }))
                  }
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                    data.topGoal === opt
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border hover:border-primary/50"
                  )}
                  data-testid={`button-goal-${opt.split(' ')[0].toLowerCase()}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Prior mental training experience
              </label>
              {[
                "None — brand new to this",
                "Some — tried a few things",
                "Moderate — worked with a sports psych",
                "Extensive — regular mental training",
              ].map((opt) => (
                <button
                  key={opt}
                  onClick={() =>
                    setData((prev) => ({ ...prev, priorTraining: opt }))
                  }
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                    data.priorTraining === opt
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border hover:border-primary/50"
                  )}
                  data-testid={`button-prior-${opt.split(' ')[0].toLowerCase()}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="flex-1"
            data-testid="button-next"
          >
            {step === totalSteps - 1 ? "Generate My Profile" : "Continue"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
