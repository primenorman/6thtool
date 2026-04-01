import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  MessageCircle,
  HelpCircle,
  GitBranch,
  Brain,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Volume2,
  Maximize,
  Minimize,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InteractionOption {
  id: string;
  label: string;
  isCorrect?: boolean;
  followUpContent?: string;
  branchToSec?: number;
}

interface InteractionPoint {
  id: string;
  lessonId: number;
  timestampSec: number;
  promptType: string;
  promptText: string;
  promptSubtext?: string | null;
  options: InteractionOption[];
  followUpContent?: string | null;
  isPausePoint: boolean;
  orderIndex: number;
  isPublished: boolean;
}

interface InteractionResponse {
  id: string;
  userId: string;
  interactionPointId: string;
  lessonId: number;
  selectedOptionId?: string | null;
  responseText?: string | null;
  isCorrect?: boolean | null;
  respondedAt: string;
}

interface InteractiveVideoPlayerProps {
  lessonId: number;
}

const PROMPT_TYPE_ICONS: Record<string, typeof Brain> = {
  multiple_choice: HelpCircle,
  reflection: MessageCircle,
  scenario: GitBranch,
  knowledge_check: Brain,
};

const PROMPT_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Quick Check",
  reflection: "Pause & Reflect",
  scenario: "Decision Point",
  knowledge_check: "Knowledge Check",
};

const PROMPT_TYPE_COLORS: Record<string, string> = {
  multiple_choice: "bg-blue-500",
  reflection: "bg-purple-500",
  scenario: "bg-amber-500",
  knowledge_check: "bg-emerald-500",
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function InteractiveVideoPlayer({ lessonId }: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeInteraction, setActiveInteraction] = useState<InteractionPoint | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpContent, setFollowUpContent] = useState<string>("");
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);

  const { data: interactionPoints = [] } = useQuery<InteractionPoint[]>({
    queryKey: ["/api/lessons", lessonId, "interactions"],
  });

  const { data: previousResponses = [] } = useQuery<InteractionResponse[]>({
    queryKey: ["/api/lessons", lessonId, "interaction-responses"],
  });

  useEffect(() => {
    if (previousResponses.length > 0) {
      const ids = new Set(previousResponses.map((r) => r.interactionPointId));
      setAnsweredIds(ids);
    }
  }, [previousResponses]);

  const respondMutation = useMutation({
    mutationFn: (data: { interactionPointId: string; selectedOptionId?: string; responseText?: string; isCorrect?: boolean; lessonId: number }) =>
      apiRequest("POST", `/api/interactions/${data.interactionPointId}/respond`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "interaction-responses"] });
    },
  });

  useEffect(() => {
    setVideoLoading(true);
    setVideoError(false);
    setVideoUrl(null);
    fetch(`/api/lesson-video-url/${lessonId}`)
      .then((res) => {
        if (!res.ok) throw new Error("No video");
        return res.json();
      })
      .then((data) => {
        if (data.url) setVideoUrl(data.url);
        else setVideoError(true);
      })
      .catch(() => setVideoError(true))
      .finally(() => setVideoLoading(false));
  }, [lessonId]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setCurrentTime(t);

    if (activeInteraction) return;

    for (const point of interactionPoints) {
      if (!point.isPausePoint) continue;
      if (answeredIds.has(point.id) && point.promptType !== "reflection") continue;
      if (lastTriggeredId === point.id) continue;
      if (Math.abs(t - point.timestampSec) < 0.8) {
        video.pause();
        setIsPlaying(false);
        setActiveInteraction(point);
        setLastTriggeredId(point.id);
        setSelectedOption(null);
        setReflectionText("");
        setShowFollowUp(false);
        break;
      }
    }
  }, [interactionPoints, activeInteraction, answeredIds, lastTriggeredId]);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleSubmitResponse = () => {
    if (!activeInteraction) return;

    const options = (activeInteraction.options || []) as InteractionOption[];
    let isCorrect: boolean | undefined;
    let followUp = "";

    if (activeInteraction.promptType === "knowledge_check" && selectedOption) {
      const selected = options.find((o) => o.id === selectedOption);
      isCorrect = selected?.isCorrect ?? false;
      followUp = selected?.followUpContent || (isCorrect ? "Correct! Great understanding." : "Not quite. Review this concept again.");
    } else if (activeInteraction.promptType === "multiple_choice" && selectedOption) {
      const selected = options.find((o) => o.id === selectedOption);
      followUp = selected?.followUpContent || activeInteraction.followUpContent || "";
    } else if (activeInteraction.promptType === "scenario" && selectedOption) {
      const selected = options.find((o) => o.id === selectedOption);
      followUp = selected?.followUpContent || "";
    } else if (activeInteraction.promptType === "reflection") {
      followUp = activeInteraction.followUpContent || "Great reflection. Let's continue.";
    }

    respondMutation.mutate({
      interactionPointId: activeInteraction.id,
      selectedOptionId: selectedOption || undefined,
      responseText: reflectionText || undefined,
      isCorrect,
      lessonId,
    });

    setAnsweredIds((prev) => { const next = new Set(Array.from(prev)); next.add(activeInteraction.id); return next; });

    if (followUp) {
      setFollowUpContent(followUp);
      setShowFollowUp(true);
    } else {
      dismissInteraction();
    }
  };

  const dismissInteraction = () => {
    const video = videoRef.current;
    if (!video || !activeInteraction) return;

    const options = (activeInteraction.options || []) as InteractionOption[];
    if (activeInteraction.promptType === "scenario" && selectedOption) {
      const selected = options.find((o) => o.id === selectedOption);
      if (selected?.branchToSec != null) {
        video.currentTime = selected.branchToSec;
      }
    }

    setActiveInteraction(null);
    setShowFollowUp(false);
    setFollowUpContent("");
    setSelectedOption(null);
    setReflectionText("");
    video.play();
    setIsPlaying(true);
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || activeInteraction) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container && !video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if ((video as any)?.webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen();
    } else if ((container as any)?.webkitRequestFullscreen) {
      (container as any).webkitRequestFullscreen();
    } else if (container?.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  if (videoError && !videoUrl) {
    if (interactionPoints.length === 0) return null;
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Video not available. Interactive elements will be available when video is uploaded.</p>
        </CardContent>
      </Card>
    );
  }

  const hasInteractions = interactionPoints.length > 0;
  const completedCount = interactionPoints.filter((p) => answeredIds.has(p.id)).length;

  return (
    <Card data-testid="card-interactive-video">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            {hasInteractions ? "Interactive Lesson" : "Lesson Video"}
          </CardTitle>
          {hasInteractions && (
            <Badge variant="outline" className="gap-1" data-testid="badge-interaction-count">
              <Sparkles className="w-3 h-3" />
              {completedCount}/{interactionPoints.length} interactions
            </Badge>
          )}
        </div>
        <CardDescription>
          {hasInteractions
            ? "Watch and respond to questions as they appear. The video will pause at key moments."
            : "Watch this video to deepen your understanding of this lesson"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={containerRef} className={cn("relative rounded-lg overflow-hidden bg-black", isFullscreen && "flex flex-col justify-center")}>
          <div className={cn("aspect-video flex items-center justify-center relative", isFullscreen && "aspect-auto flex-1")}>
            {videoLoading && <Skeleton className="w-full h-full absolute inset-0" />}
            {videoUrl && !videoLoading && (
              <video
                ref={videoRef}
                playsInline
                preload="metadata"
                className="w-full h-full"
                data-testid="video-interactive-lesson"
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onLoadedMetadata={handleLoadedMetadata}
                onError={() => {
                  setVideoError(true);
                  setVideoUrl(null);
                }}
                onClick={togglePlayPause}
              />
            )}

            {activeInteraction && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 z-10 animate-in fade-in duration-300">
                <InteractionOverlay
                  point={activeInteraction}
                  selectedOption={selectedOption}
                  reflectionText={reflectionText}
                  showFollowUp={showFollowUp}
                  followUpContent={followUpContent}
                  onSelectOption={handleOptionSelect}
                  onReflectionChange={setReflectionText}
                  onSubmit={handleSubmitResponse}
                  onDismiss={dismissInteraction}
                  isPending={respondMutation.isPending}
                />
              </div>
            )}

            {!isPlaying && !activeInteraction && videoUrl && !videoLoading && (
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                data-testid="button-play-overlay"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </button>
            )}
          </div>

          {hasInteractions && duration > 0 && (
            <InteractionTimeline
              interactionPoints={interactionPoints}
              answeredIds={answeredIds}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
              activeId={activeInteraction?.id ?? null}
            />
          )}
        </div>

        {!hasInteractions && videoUrl && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePlayPause} data-testid="button-play-pause">
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} data-testid="button-fullscreen">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {hasInteractions && videoUrl && (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={togglePlayPause} disabled={!!activeInteraction} data-testid="button-play-pause">
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <Button variant="outline" size="sm" onClick={toggleFullscreen} data-testid="button-fullscreen-interactive">
                {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
              </Button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(PROMPT_TYPE_LABELS).map(([type, label]) => {
                const count = interactionPoints.filter((p) => p.promptType === type).length;
                if (count === 0) return null;
                return (
                  <span key={type} className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", PROMPT_TYPE_COLORS[type])} />
                    {count} {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InteractionTimeline({
  interactionPoints,
  answeredIds,
  currentTime,
  duration,
  onSeek,
  activeId,
}: {
  interactionPoints: InteractionPoint[];
  answeredIds: Set<string>;
  currentTime: number;
  duration: number;
  onSeek: (sec: number) => void;
  activeId: string | null;
}) {
  return (
    <div className="relative h-8 bg-gray-900 border-t border-gray-700" data-testid="timeline-bar">
      <div
        className="absolute top-0 left-0 h-full bg-primary/30 transition-all"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />

      <div
        className="absolute top-0 h-full w-0.5 bg-white z-10"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />

      {interactionPoints.map((point) => {
        const pos = (point.timestampSec / duration) * 100;
        const isAnswered = answeredIds.has(point.id);
        const isActive = activeId === point.id;
        const colorClass = PROMPT_TYPE_COLORS[point.promptType] || "bg-blue-500";

        return (
          <button
            key={point.id}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full transition-all z-20",
              isActive ? "w-4 h-4 ring-2 ring-white scale-125" : "w-3 h-3 hover:scale-125",
              isAnswered ? "opacity-50" : "opacity-100",
              colorClass
            )}
            style={{ left: `calc(${pos}% - 6px)` }}
            title={`${PROMPT_TYPE_LABELS[point.promptType] || point.promptType} at ${formatTime(point.timestampSec)}`}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(Math.max(0, point.timestampSec - 2));
            }}
            data-testid={`timeline-marker-${point.id}`}
          />
        );
      })}

      <button
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = x / rect.width;
          onSeek(pct * duration);
        }}
        data-testid="timeline-seek"
      />
    </div>
  );
}

function InteractionOverlay({
  point,
  selectedOption,
  reflectionText,
  showFollowUp,
  followUpContent,
  onSelectOption,
  onReflectionChange,
  onSubmit,
  onDismiss,
  isPending,
}: {
  point: InteractionPoint;
  selectedOption: string | null;
  reflectionText: string;
  showFollowUp: boolean;
  followUpContent: string;
  onSelectOption: (id: string) => void;
  onReflectionChange: (text: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
  isPending: boolean;
}) {
  const options = (point.options || []) as InteractionOption[];
  const Icon = PROMPT_TYPE_ICONS[point.promptType] || HelpCircle;
  const colorClass = PROMPT_TYPE_COLORS[point.promptType] || "bg-blue-500";

  if (showFollowUp) {
    return (
      <div className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-5 space-y-4">
            {point.promptType === "knowledge_check" && (
              <div className="flex items-center gap-2">
                {options.find((o) => o.id === selectedOption)?.isCorrect ? (
                  <Badge className="bg-emerald-500 text-white gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Correct
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Not quite
                  </Badge>
                )}
              </div>
            )}
            <p className="text-sm leading-relaxed">{followUpContent}</p>
            <Button onClick={onDismiss} className="w-full gap-2" data-testid="button-continue-video">
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <Card className="border-0 shadow-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white", colorClass)}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {PROMPT_TYPE_LABELS[point.promptType] || point.promptType}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-base leading-snug">{point.promptText}</h3>
            {point.promptSubtext && (
              <p className="text-xs text-muted-foreground mt-1 italic">{point.promptSubtext}</p>
            )}
          </div>

          {(point.promptType === "multiple_choice" || point.promptType === "knowledge_check" || point.promptType === "scenario") && (
            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onSelectOption(opt.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border-2 transition-all text-sm",
                    selectedOption === opt.id
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                  data-testid={`option-${opt.id}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {point.promptType === "reflection" && (
            <Textarea
              value={reflectionText}
              onChange={(e) => onReflectionChange(e.target.value)}
              placeholder="Take a moment to reflect..."
              className="min-h-[80px] resize-none text-sm"
              data-testid="input-reflection"
            />
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={onSubmit}
              disabled={
                isPending ||
                (point.promptType !== "reflection" && !selectedOption) ||
                (point.promptType === "reflection" && reflectionText.trim().length < 3)
              }
              className="flex-1 gap-2"
              data-testid="button-submit-interaction"
            >
              {isPending ? "Saving..." : "Submit"}
              <ChevronRight className="w-4 h-4" />
            </Button>
            {point.promptType === "reflection" && (
              <Button variant="ghost" size="sm" onClick={onDismiss} data-testid="button-skip-reflection">
                Skip
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
