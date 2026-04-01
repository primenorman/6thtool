import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { AppLayout } from "@/components/app-layout";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Flag,
  Zap,
  Target,
  Brain,
  Moon,
  Shield,
  Compass,
  AlertTriangle,
  History,
  BarChart3,
  Search,
  X,
  Calendar,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PerformanceJournalEntry } from "@shared/schema";
import { getModeConfig, type ModeConfig, type PromptSection, type Prompt } from "@/lib/journal-modes";

const MODE_CARDS: { mode: string; icon: any; label: string; subtitle: string; time: string; color: string }[] = [
  { mode: "pre_game", icon: Zap, label: "Pre-Game Prime", subtitle: "Activate your executive center before competition", time: "8-12 min", color: "text-amber-500" },
  { mode: "post_game", icon: Target, label: "Post-Game Download", subtitle: "Decode performance signal and equilibrate perception", time: "10-15 min", color: "text-blue-500" },
  { mode: "slump_protocol", icon: Shield, label: "Slump Protocol", subtitle: "Neural repair and perception equilibration", time: "20-30 min", color: "text-red-500" },
  { mode: "value_audit", icon: Compass, label: "Value Audit", subtitle: "Weekly identity and hierarchy calibration", time: "20-25 min", color: "text-purple-500" },
  { mode: "nightly_myelination", icon: Moon, label: "Nightly Myelination", subtitle: "Sleep-prep consolidation and signal review", time: "5-8 min", color: "text-teal-500" },
];

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string | Date | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getModeLabel(mode: string) {
  return MODE_CARDS.find(m => m.mode === mode)?.label ?? mode;
}

function getModeColor(mode: string) {
  return MODE_CARDS.find(m => m.mode === mode)?.color ?? "text-foreground";
}

export default function JournalPage() {
  const [view, setView] = useState<"selector" | "session" | "history" | "detail" | "completion" | "stats">("selector");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<PerformanceJournalEntry | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>("");
  const [historySearch, setHistorySearch] = useState("");
  const { toast } = useToast();

  const { data: entries = [], isLoading: entriesLoading } = useQuery<PerformanceJournalEntry[]>({
    queryKey: ["/api/performance-journal"],
  });

  const { data: inProgress } = useQuery<PerformanceJournalEntry | null>({
    queryKey: ["/api/performance-journal/in-progress"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { mode: string }) => apiRequest("POST", "/api/performance-journal", data),
    onSuccess: async (res) => {
      const entry = await res.json();
      setActiveSessionId(entry.id);
      setView("session");
      queryClient.invalidateQueries({ queryKey: ["/api/performance-journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-journal/in-progress"] });
    },
    onError: () => toast({ title: "Failed to start session", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/performance-journal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-journal/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-journal/stats"] });
      setView("selector");
      toast({ title: "Session deleted" });
    },
  });

  const handleStartMode = (mode: string) => {
    setSelectedMode(mode);
    createMutation.mutate({ mode });
  };

  const handleResumeSession = () => {
    if (inProgress) {
      setActiveSessionId(inProgress.id);
      setSelectedMode(inProgress.mode);
      setView("session");
    }
  };

  const handleSessionComplete = (entry: PerformanceJournalEntry) => {
    setDetailEntry(entry);
    setView("completion");
    queryClient.invalidateQueries({ queryKey: ["/api/performance-journal"] });
    queryClient.invalidateQueries({ queryKey: ["/api/performance-journal/in-progress"] });
    queryClient.invalidateQueries({ queryKey: ["/api/performance-journal/stats"] });
  };

  const filteredEntries = entries
    .filter(e => e.status === "completed")
    .filter(e => !historyFilter || e.mode === historyFilter)
    .filter(e => {
      if (!historySearch) return true;
      const s = historySearch.toLowerCase();
      const responses = (e.responses || {}) as Record<string, any>;
      return Object.values(responses).some(v => typeof v === "string" && v.toLowerCase().includes(s))
        || getModeLabel(e.mode).toLowerCase().includes(s);
    });

  if (view === "stats") {
    return (
      <JournalDashboard onBack={() => setView("selector")} />
    );
  }

  if (view === "session" && activeSessionId && selectedMode) {
    return (
      <SessionView
        sessionId={activeSessionId}
        mode={selectedMode}
        onComplete={handleSessionComplete}
        onBack={() => setView("selector")}
      />
    );
  }

  if (view === "completion" && detailEntry) {
    return (
      <CompletionView
        entry={detailEntry}
        onBack={() => { setView("selector"); setDetailEntry(null); }}
        onViewHistory={() => setView("history")}
      />
    );
  }

  if (view === "detail" && detailEntry) {
    return (
      <EntryDetailView
        entry={detailEntry}
        onBack={() => { setView("history"); setDetailEntry(null); }}
        onDelete={() => deleteMutation.mutate(detailEntry.id)}
      />
    );
  }

  if (view === "history") {
    return (
      <AppLayout title="Session History" subtitle="Review past sessions">
        <div className="p-4 md:p-6 pb-24 twohanded:pb-6 min-w-0">
          <div className="max-w-2xl mx-auto space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView("selector")} data-testid="button-back-history">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-history-search"
                />
                {historySearch && (
                  <button onClick={() => setHistorySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={historyFilter === "" ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setHistoryFilter("")}
                data-testid="filter-all"
              >All</Badge>
              {MODE_CARDS.map(m => (
                <Badge
                  key={m.mode}
                  variant={historyFilter === m.mode ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setHistoryFilter(m.mode)}
                  data-testid={`filter-${m.mode}`}
                >{m.label}</Badge>
              ))}
            </div>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No completed sessions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map(entry => (
                  <Card
                    key={entry.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => { setDetailEntry(entry); setView("detail"); }}
                    data-testid={`card-session-${entry.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("font-semibold text-sm", getModeColor(entry.mode))}>
                              {getModeLabel(entry.mode)}
                            </span>
                            {entry.signalQuality && (
                              <Badge variant="secondary" className="text-[10px]">
                                Signal: {entry.signalQuality}/10
                              </Badge>
                            )}
                            {entry.flaggedForReview && (
                              <Flag className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(entry.completedAt || entry.createdAt)}
                            </span>
                            {entry.dominantEmotion && (
                              <span>{entry.dominantEmotion}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Performance Protocol" subtitle="Select your session">
      <div className="p-4 md:p-6 pb-24 twohanded:pb-6 min-w-0">
        <div className="max-w-2xl mx-auto space-y-4 min-w-0">
          {inProgress && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Session in progress</p>
                    <p className="text-xs text-muted-foreground">{getModeLabel(inProgress.mode)} — started {formatTime(inProgress.createdAt)}</p>
                  </div>
                  <Button size="sm" onClick={handleResumeSession} data-testid="button-resume-session">
                    Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {MODE_CARDS.map(({ mode, icon: Icon, label, subtitle, time, color }) => (
              <Card
                key={mode}
                className="hover-elevate cursor-pointer"
                onClick={() => handleStartMode(mode)}
                data-testid={`card-mode-${mode}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-md flex items-center justify-center bg-muted flex-shrink-0", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm">{label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {time}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setView("history")} data-testid="button-view-history">
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setView("stats")} data-testid="button-view-stats">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SessionView({ sessionId, mode, onComplete, onBack }: {
  sessionId: string;
  mode: string;
  onComplete: (entry: PerformanceJournalEntry) => void;
  onBack: () => void;
}) {
  const modeConfig = getModeConfig(mode);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const { toast } = useToast();

  const { data: sessionData } = useQuery<PerformanceJournalEntry>({
    queryKey: ["/api/performance-journal", sessionId],
  });

  useEffect(() => {
    if (sessionData) {
      const savedResponses = (sessionData.responses || {}) as Record<string, any>;
      setResponses(savedResponses);
      if (sessionData.currentSection > 0) {
        setCurrentSectionIdx(sessionData.currentSection);
      }
      lastSavedRef.current = JSON.stringify(savedResponses);
    }
  }, [sessionData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/performance-journal/${sessionId}`, data),
  });

  const doAutoSave = useCallback(() => {
    const currentJson = JSON.stringify(responses);
    if (currentJson !== lastSavedRef.current && Object.keys(responses).length > 0) {
      lastSavedRef.current = currentJson;
      saveMutation.mutate({
        responses,
        currentSection: currentSectionIdx,
      });
    }
  }, [responses, currentSectionIdx]);

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(doAutoSave, 10000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [responses, doAutoSave]);

  if (!modeConfig) return null;

  const sections = modeConfig.sections;
  const currentSection = sections[currentSectionIdx];
  const isLastSection = currentSectionIdx === sections.length - 1;
  const totalSections = sections.length;

  const sectionHasRequiredEmpty = (section: PromptSection): boolean => {
    return section.prompts.some((p: Prompt) => {
      if (p.optional) return false;
      const val = responses[p.id];
      if (p.type === "slider") return val === undefined || val === null;
      if (p.type === "multi_select") return !val || (Array.isArray(val) && val.length === 0);
      if (p.type === "text" || p.type === "long_text") return !val || (typeof val === "string" && val.trim() === "");
      return !val;
    });
  };

  const canAdvance = !sectionHasRequiredEmpty(currentSection);

  const handleNext = () => {
    if (!canAdvance) return;
    doAutoSave();
    if (isLastSection) {
      handleComplete();
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSectionIdx(prev => prev + 1);
        setIsTransitioning(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentSectionIdx > 0) {
      doAutoSave();
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSectionIdx(prev => prev - 1);
        setIsTransitioning(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  };

  const handleComplete = () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    const extractedData: any = {
      responses,
      currentSection: totalSections,
      status: "completed",
    };
    if (responses["amygdala_scan"]) extractedData.amygdalaScore = responses["amygdala_scan"];
    if (responses["signal_quality_target"] || responses["signal_quality_post"] || responses["signal_quality_nightly"])
      extractedData.signalQuality = responses["signal_quality_target"] || responses["signal_quality_post"] || responses["signal_quality_nightly"];
    if (responses["emotional_tag"]) extractedData.dominantEmotion = responses["emotional_tag"];
    if (responses["executive_percent"]) extractedData.executivePercent = responses["executive_percent"];
    if (responses["alignment_score"]) extractedData.valueAlignment = responses["alignment_score"];

    saveMutation.mutate(extractedData, {
      onSuccess: async (res) => {
        const entry = await res.json();
        onComplete(entry);
      },
      onError: () => toast({ title: "Failed to save session", variant: "destructive" }),
    });
  };

  const updateResponse = (promptId: string, value: any) => {
    setResponses(prev => ({ ...prev, [promptId]: value }));
  };

  return (
    <AppLayout title={modeConfig.label} hideHeader hideMobileNav>
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-session">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Exit
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentSectionIdx + 1} / {totalSections}
              </span>
              <div className="flex gap-1">
                {sections.map((_: PromptSection, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i < currentSectionIdx ? "w-4 bg-primary" :
                      i === currentSectionIdx ? "w-6 bg-primary" : "w-4 bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "flex-1 p-4 md:p-6 pb-24 transition-opacity duration-200",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}>
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{currentSection.label}</p>
              <h2 className="text-lg font-semibold mt-1">{currentSection.title}</h2>
              {currentSection.description && (
                <p className="text-sm text-muted-foreground mt-2 italic leading-relaxed">{currentSection.description}</p>
              )}
            </div>

            <div className="space-y-6">
              {currentSection.prompts.map(prompt => (
                <PromptField
                  key={prompt.id}
                  prompt={prompt}
                  value={responses[prompt.id]}
                  allResponses={responses}
                  onChange={(val) => updateResponse(prompt.id, val)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentSectionIdx === 0}
              data-testid="button-prev-section"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canAdvance}
              data-testid="button-next-section"
            >
              {isLastSection ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function PromptField({ prompt, value, allResponses, onChange }: {
  prompt: Prompt;
  value: any;
  allResponses: Record<string, any>;
  onChange: (val: any) => void;
}) {
  if (prompt.condition && !prompt.condition(allResponses)) {
    return null;
  }

  const defaultValue = prompt.defaultFrom ? allResponses[prompt.defaultFrom] : undefined;
  const currentValue = value ?? defaultValue ?? (prompt.type === "slider" ? undefined : prompt.type === "multi_select" ? [] : "");

  return (
    <div className="space-y-2" data-testid={`prompt-${prompt.id}`}>
      <label className="text-sm font-medium leading-relaxed whitespace-pre-line">{prompt.label}</label>
      {prompt.sublabel && (
        <p className="text-xs text-muted-foreground italic">{prompt.sublabel}</p>
      )}

      {prompt.type === "text" && (
        <Input
          value={currentValue as string}
          onChange={e => onChange(e.target.value)}
          placeholder={prompt.placeholder || ""}
          data-testid={`input-${prompt.id}`}
        />
      )}

      {prompt.type === "long_text" && (
        <Textarea
          value={currentValue as string}
          onChange={e => onChange(e.target.value)}
          placeholder={prompt.placeholder || ""}
          className="min-h-[120px] resize-none text-sm leading-relaxed"
          data-testid={`textarea-${prompt.id}`}
        />
      )}

      {prompt.type === "slider" && (
        <div className="space-y-3 pt-2">
          <Slider
            value={[currentValue as number ?? prompt.min ?? 1]}
            onValueChange={([v]) => onChange(v)}
            min={prompt.min ?? 1}
            max={prompt.max ?? 10}
            step={1}
            data-testid={`slider-${prompt.id}`}
          />
          <div className="flex justify-between items-start gap-2">
            <span className="text-[11px] text-muted-foreground max-w-[45%]">{prompt.minLabel}</span>
            <span className="text-lg font-bold tabular-nums">{currentValue ?? "—"}</span>
            <span className="text-[11px] text-muted-foreground max-w-[45%] text-right">{prompt.maxLabel}</span>
          </div>
        </div>
      )}

      {prompt.type === "multi_select" && (
        <div className="space-y-2">
          {prompt.options?.map(opt => {
            const selected = Array.isArray(currentValue) && currentValue.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const arr = Array.isArray(currentValue) ? [...currentValue] : [];
                    if (checked) arr.push(opt.value);
                    else {
                      const idx = arr.indexOf(opt.value);
                      if (idx >= 0) arr.splice(idx, 1);
                    }
                    onChange(arr);
                  }}
                  data-testid={`checkbox-${prompt.id}-${opt.value}`}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            );
          })}
          {prompt.hasOther && (
            <Input
              placeholder="Something else..."
              value={
                Array.isArray(currentValue)
                  ? currentValue.find((v: string) => v.startsWith("other:"))?.replace("other:", "") ?? ""
                  : ""
              }
              onChange={e => {
                const arr = Array.isArray(currentValue) ? currentValue.filter((v: string) => !v.startsWith("other:")) : [];
                if (e.target.value.trim()) arr.push(`other:${e.target.value}`);
                onChange(arr);
              }}
              className="mt-1"
              data-testid={`input-${prompt.id}-other`}
            />
          )}
        </div>
      )}

      {prompt.type === "single_select" && (
        <div className="space-y-2">
          {prompt.options?.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full text-left p-3 rounded-md text-sm transition-colors border",
                currentValue === opt.value
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover-elevate"
              )}
              data-testid={`option-${prompt.id}-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {prompt.type === "toggle" && (
        <div className="flex flex-wrap gap-2">
          {prompt.options?.map(opt => (
            <Button
              key={opt.value}
              variant={currentValue === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(opt.value)}
              data-testid={`toggle-${prompt.id}-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {prompt.type === "number" && (
        <Input
          type="number"
          value={currentValue as string}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={prompt.placeholder || ""}
          data-testid={`number-${prompt.id}`}
        />
      )}

      {prompt.type === "multi_text" && (
        <div className="space-y-2">
          {Array.from({ length: prompt.count || 3 }).map((_, i) => {
            const arr = Array.isArray(currentValue) ? currentValue : [];
            return (
              <Input
                key={i}
                value={arr[i] ?? ""}
                onChange={e => {
                  const newArr = [...arr];
                  newArr[i] = e.target.value;
                  onChange(newArr);
                }}
                placeholder={`${i + 1}.`}
                data-testid={`input-${prompt.id}-${i}`}
              />
            );
          })}
        </div>
      )}

      {prompt.type === "dual_slider" && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{prompt.label1 || "Executive"}</span>
              <span className="font-semibold text-foreground">{currentValue?.a ?? 50}%</span>
            </div>
            <Slider
              value={[currentValue?.a ?? 50]}
              onValueChange={([v]) => onChange({ a: v, b: 100 - v })}
              min={0}
              max={100}
              step={5}
              data-testid={`slider-${prompt.id}-a`}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{prompt.label2 || "Amygdala"}</span>
              <span className="font-semibold text-foreground">{currentValue?.b ?? 50}%</span>
            </div>
            <Slider
              value={[currentValue?.b ?? 50]}
              onValueChange={([v]) => onChange({ a: 100 - v, b: v })}
              min={0}
              max={100}
              step={5}
              data-testid={`slider-${prompt.id}-b`}
            />
          </div>
        </div>
      )}

      {prompt.optional && <span className="text-[10px] text-muted-foreground">(optional)</span>}
    </div>
  );
}

function CompletionView({ entry, onBack, onViewHistory }: {
  entry: PerformanceJournalEntry;
  onBack: () => void;
  onViewHistory: () => void;
}) {
  const modeConfig = getModeConfig(entry.mode);
  const responses = (entry.responses || {}) as Record<string, any>;

  const flagMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/performance-journal/${entry.id}`, { flaggedForReview: !entry.flaggedForReview }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-journal"] });
    },
  });

  const processIntention = responses["process_intention"] || responses["tomorrow_anchor"] || responses["commitment_action"];
  const signalTarget = entry.signalQuality;

  let autoInsight = "";
  if (entry.mode === "pre_game") {
    const highestValue = responses["highest_value_anchor"];
    const stateIssues = Array.isArray(responses["state_identifier"]) ? responses["state_identifier"] : [];
    const mainRisk = stateIssues.length > 0 ? stateIssues[0]?.replace("other:", "") : null;
    autoInsight = `Your highest value today: ${highestValue ? '"' + (highestValue.length > 60 ? highestValue.slice(0, 60) + '...' : highestValue) + '"' : 'identified'}. ${mainRisk ? 'Your one risk: ' + mainRisk + '.' : ''} You found the benefit in the worst case — your nervous system can release the anxiety.`;
  } else if (entry.mode === "post_game") {
    autoInsight = `Signal quality: ${signalTarget || "rated"}. ${entry.dominantEmotion ? "Dominant state: " + entry.dominantEmotion + "." : ""} ${entry.executivePercent ? "Executive center: " + entry.executivePercent + "%." : ""}`;
  } else if (entry.mode === "slump_protocol") {
    autoInsight = "A slump is not a character problem. It is a signal problem. You've addressed the biology, the perception, and the circuitry. The repair has begun.";
  } else if (entry.mode === "value_audit") {
    autoInsight = `Value alignment: ${entry.valueAlignment || "assessed"}/10. The gap between stated and demonstrated values is now visible. Clarity is the first step to recalibration.`;
  } else if (entry.mode === "nightly_myelination") {
    autoInsight = "Your nervous system will consolidate these circuits tonight. Sleep is the construction crew. You've given them the blueprint.";
  }

  return (
    <AppLayout title="Session Complete" hideHeader>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 twohanded:pb-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold">{modeConfig?.label || "Session"} Complete</h2>
            <p className="text-sm text-muted-foreground mt-1">{formatDate(entry.completedAt || entry.createdAt)}</p>
          </div>

          {processIntention && (
            <Card>
              <CardContent className="p-6">
                <p className="text-lg font-semibold leading-relaxed text-center">
                  "{processIntention}"
                </p>
              </CardContent>
            </Card>
          )}

          {signalTarget && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">Signal Quality Target</span>
              <span className="text-2xl font-bold">{signalTarget}/10</span>
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground italic leading-relaxed">{autoInsight}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={onBack} data-testid="button-done">
              Done
            </Button>
            <Button variant="outline" onClick={() => flagMutation.mutate()} data-testid="button-flag-review">
              <Flag className="w-4 h-4 mr-2" />
              {entry.flaggedForReview ? "Unflag" : "Flag for Review"}
            </Button>
            <Button variant="ghost" onClick={onViewHistory} data-testid="button-view-all-sessions">
              View All Sessions
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function EntryDetailView({ entry, onBack, onDelete }: {
  entry: PerformanceJournalEntry;
  onBack: () => void;
  onDelete: () => void;
}) {
  const modeConfig = getModeConfig(entry.mode);
  const responses = (entry.responses || {}) as Record<string, any>;

  if (!modeConfig) return null;

  return (
    <AppLayout title={modeConfig.label} hideHeader>
      <div className="p-4 md:p-6 pb-24 twohanded:pb-6 min-w-0">
        <div className="max-w-2xl mx-auto space-y-6 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-detail">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} data-testid="button-delete-session">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={cn("text-lg font-bold", getModeColor(entry.mode))}>{modeConfig.label}</h2>
              {entry.signalQuality && (
                <Badge variant="secondary">Signal: {entry.signalQuality}/10</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(entry.completedAt || entry.createdAt)} at {formatTime(entry.completedAt || entry.createdAt)}
            </p>
          </div>

          {modeConfig.sections.map((section, sIdx) => {
            const hasAnyResponse = section.prompts.some(p => {
              const v = responses[p.id];
              return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
            });
            if (!hasAnyResponse) return null;

            return (
              <div key={sIdx} className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{section.label}</p>
                  <h3 className="text-sm font-semibold mt-0.5">{section.title}</h3>
                </div>
                {section.prompts.map(prompt => {
                  const val = responses[prompt.id];
                  if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) return null;

                  let displayVal: string;
                  if (prompt.type === "slider" || prompt.type === "number") {
                    displayVal = String(val);
                    if (prompt.type === "slider") displayVal += "/10";
                  } else if (prompt.type === "multi_select") {
                    displayVal = Array.isArray(val)
                      ? val.map((v: string) => v.startsWith("other:") ? v.replace("other:", "") : prompt.options?.find(o => o.value === v)?.label || v).join(", ")
                      : String(val);
                  } else if (prompt.type === "single_select" || prompt.type === "toggle") {
                    displayVal = prompt.options?.find(o => o.value === val)?.label || String(val);
                  } else if (prompt.type === "dual_slider") {
                    displayVal = `Executive: ${val?.a ?? 50}% / Amygdala: ${val?.b ?? 50}%`;
                  } else if (prompt.type === "multi_text") {
                    displayVal = Array.isArray(val) ? val.filter(Boolean).join("\n") : String(val);
                  } else {
                    displayVal = String(val);
                  }

                  return (
                    <div key={prompt.id} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{prompt.label.split("\n")[0]}</p>
                      <p className="text-sm whitespace-pre-line">{displayVal}</p>
                    </div>
                  );
                })}
                <div className="border-b" />
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

interface JournalStats {
  totalSessions: number;
  completedSessions: number;
  streak: number;
  lastSessionDate: string | null;
  modeBreakdown: Record<string, number>;
  avgSignalQuality: number | null;
  avgValueAlignment: number | null;
  signalQualityTrend: { date: string; value: number }[];
  emotionFrequency: Record<string, number>;
  executiveAvg: number | null;
}

const STREAK_MILESTONES = [
  { days: 3, label: "3-Day Spark", desc: "Neural pathways starting to form" },
  { days: 7, label: "7-Day Foundation", desc: "Myelin sheath strengthening" },
  { days: 14, label: "14-Day Circuit", desc: "New neural circuits establishing" },
  { days: 21, label: "21-Day Habit", desc: "Automatic pattern forming" },
  { days: 30, label: "30-Day Lock-In", desc: "Deep myelination achieved" },
  { days: 60, label: "60-Day Mastery", desc: "Executive center rewired" },
  { days: 100, label: "100-Day Elite", desc: "Elite mental architecture" },
];

const EMOTION_COLORS: Record<string, string> = {
  pride: "bg-amber-500",
  relief: "bg-green-500",
  frustration: "bg-red-500",
  embarrassment: "bg-rose-400",
  anger: "bg-red-600",
  numbness: "bg-gray-400",
  satisfaction: "bg-emerald-500",
  confused: "bg-purple-400",
  grateful: "bg-pink-500",
};

function JournalDashboard({ onBack }: { onBack: () => void }) {
  const { data: stats, isLoading } = useQuery<JournalStats>({
    queryKey: ["/api/performance-journal/stats"],
  });

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" subtitle="Performance analytics">
        <div className="p-4 md:p-6 pb-24 twohanded:pb-6 min-w-0">
          <div className="max-w-2xl mx-auto space-y-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) return null;

  const currentMilestone = STREAK_MILESTONES.filter(m => stats.streak >= m.days).pop();
  const nextMilestone = STREAK_MILESTONES.find(m => stats.streak < m.days);
  const milestoneProgress = nextMilestone ? (stats.streak / nextMilestone.days) * 100 : 100;

  const maxEmotion = Object.entries(stats.emotionFrequency).sort((a, b) => b[1] - a[1]);
  const totalEmotionCount = maxEmotion.reduce((s, [, c]) => s + c, 0);

  return (
    <AppLayout title="Dashboard" subtitle="Performance analytics">
      <div className="p-4 md:p-6 pb-24 twohanded:pb-6 min-w-0">
        <div className="max-w-2xl mx-auto space-y-4 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.completedSessions}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.avgSignalQuality?.toFixed(1) ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Avg Signal Quality</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.executiveAvg ? `${Math.round(stats.executiveAvg)}%` : "—"}</p>
                <p className="text-xs text-muted-foreground">Avg Executive %</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{stats.avgValueAlignment?.toFixed(1) ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Avg Value Alignment</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className={cn("w-5 h-5", stats.streak > 0 ? "text-amber-500" : "text-muted-foreground")} />
                  <div>
                    <span className="text-xl font-bold tabular-nums">{stats.streak}</span>
                    <span className="text-sm text-muted-foreground ml-1">day streak</span>
                  </div>
                </div>
                {currentMilestone && (
                  <Badge variant="secondary" className="text-[10px]">{currentMilestone.label}</Badge>
                )}
              </div>
              {nextMilestone && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Next: {nextMilestone.label}</span>
                    <span>{stats.streak}/{nextMilestone.days} days</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">{nextMilestone.desc}</p>
                </div>
              )}
              {stats.streak >= 100 && (
                <p className="text-xs text-muted-foreground italic">Elite mental architecture achieved. Keep building.</p>
              )}
            </CardContent>
          </Card>

          {stats.signalQualityTrend.length > 1 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Signal Quality Trend</h3>
                <div className="flex items-end gap-1 h-24">
                  {stats.signalQualityTrend.map((point, i) => {
                    const height = (point.value / 10) * 100;
                    const isRecent = i >= stats.signalQualityTrend.length - 3;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                        data-testid={`bar-signal-${i}`}
                      >
                        <span className={cn("text-[9px] tabular-nums", isRecent ? "text-foreground font-medium" : "text-muted-foreground")}>
                          {point.value}
                        </span>
                        <div
                          className={cn(
                            "w-full rounded-sm transition-all",
                            point.value >= 7 ? "bg-primary" : point.value >= 4 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ height: `${height}%`, minHeight: "4px" }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{stats.signalQualityTrend[0]?.date}</span>
                  <span>{stats.signalQualityTrend[stats.signalQualityTrend.length - 1]?.date}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {maxEmotion.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Emotional Landscape</h3>
                <div className="space-y-2">
                  {maxEmotion.slice(0, 6).map(([emotion, count]) => {
                    const pct = totalEmotionCount > 0 ? (count / totalEmotionCount) * 100 : 0;
                    return (
                      <div key={emotion} className="space-y-1" data-testid={`emotion-bar-${emotion}`}>
                        <div className="flex justify-between text-xs">
                          <span className="capitalize">{emotion}</span>
                          <span className="text-muted-foreground tabular-nums">{count} ({Math.round(pct)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", EMOTION_COLORS[emotion] || "bg-primary")}
                            style={{ width: `${pct}%`, minWidth: "4px" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {Object.keys(stats.modeBreakdown).length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Mode Usage</h3>
                <div className="space-y-2">
                  {Object.entries(stats.modeBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mode, count]) => (
                      <div key={mode} className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm", getModeColor(mode))}>{getModeLabel(mode)}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {stats.executiveAvg !== null && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Command Center Ratio</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Executive</span>
                      <span className="font-medium tabular-nums">{Math.round(stats.executiveAvg)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${stats.executiveAvg}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Amygdala</span>
                      <span className="font-medium tabular-nums">{Math.round(100 - stats.executiveAvg)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${100 - stats.executiveAvg}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  {stats.executiveAvg >= 70
                    ? "Strong executive control. Your decisions are coming from the right place."
                    : stats.executiveAvg >= 50
                    ? "Balanced. Room to strengthen executive center dominance."
                    : "Amygdala-dominant. Focus on centering techniques before competition."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
