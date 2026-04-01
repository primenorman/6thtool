import { useAuth } from "@/hooks/use-auth";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Wrench,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { InteractiveVideoPlayer } from "@/components/interactive-video-player";
import { getWeekForLesson } from "@/lib/course-config";

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string | null;
  transcript: string | null;
  videoUrl: string | null;
  keyConcepts: string[] | null;
  orderIndex: number;
  estimatedMinutes: number;
  isCompleted?: boolean;
}

function splitContent(transcript: string): { essentials: string; apply: string; science: string } {
  const words = transcript.split(/\s+/);
  const totalWords = words.length;

  if (totalWords < 100) {
    return { essentials: transcript, apply: "", science: "" };
  }

  const paragraphs = transcript.split(/\n\n+/);

  if (paragraphs.length < 3) {
    const cutA = Math.floor(totalWords * 0.5);
    const cutB = Math.floor(totalWords * 0.8);
    const allText = words;
    return {
      essentials: allText.slice(0, cutA).join(" "),
      apply: allText.slice(cutA, cutB).join(" "),
      science: allText.slice(cutB).join(" "),
    };
  }

  let essentialsParagraphs: string[] = [];
  let applyParagraphs: string[] = [];
  let scienceParagraphs: string[] = [];
  let wordCount = 0;
  let section = 0;

  for (const p of paragraphs) {
    const pWords = p.split(/\s+/).length;
    wordCount += pWords;

    if (section === 0 && wordCount <= totalWords * 0.5) {
      essentialsParagraphs.push(p);
    } else if (section <= 1 && wordCount <= totalWords * 0.8) {
      section = 1;
      applyParagraphs.push(p);
    } else {
      section = 2;
      scienceParagraphs.push(p);
    }
  }

  if (essentialsParagraphs.length === 0) essentialsParagraphs = [paragraphs[0]];
  if (applyParagraphs.length === 0 && paragraphs.length > 1) applyParagraphs = [paragraphs[1]];

  return {
    essentials: essentialsParagraphs.join("\n\n"),
    apply: applyParagraphs.join("\n\n"),
    science: scienceParagraphs.join("\n\n"),
  };
}

export default function LessonPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute('/module/:moduleId/lesson/:lessonId');
  const moduleId = parseInt(params?.moduleId || '1');
  const lessonId = parseInt(params?.lessonId || '1');
  const [scienceExpanded, setScienceExpanded] = useState(false);

  const weekInfo = getWeekForLesson(lessonId);

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['/api/modules', moduleId, 'lessons'],
  });

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ['/api/lessons', lessonId],
    enabled: !!lessonId,
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/lessons/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleId, 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lessons', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      toast({
        title: "Lesson completed!",
        description: "Great progress on your training journey.",
      });
    },
  });

  const currentLessonIndex = lessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null;

  const content = lesson?.transcript ? splitContent(lesson.transcript) : null;

  const headerRight = (
    <Link href={`/module/${moduleId}`}>
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Module
      </Button>
    </Link>
  );

  return (
    <AppLayout
      title={lesson?.title || "Lesson"}
      subtitle={weekInfo ? `Week ${weekInfo.week.weekNumber}: ${weekInfo.week.title}` : `Module ${moduleId}`}
      currentModuleId={moduleId}
      headerRight={headerRight}
    >
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : !lesson ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lesson not found</h2>
              <p className="text-muted-foreground mb-4">This lesson doesn't exist or you don't have access.</p>
              <Link href={`/module/${moduleId}`}>
                <Button>Return to Module</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {weekInfo ? (
                    <Badge variant="outline">Week {weekInfo.week.weekNumber}</Badge>
                  ) : (
                    <Badge variant="outline">Module {moduleId}</Badge>
                  )}
                  <span>/</span>
                  <span>Lesson {currentLessonIndex + 1} of {lessons.length}</span>
                </div>

                <h1 className="text-3xl font-bold" data-testid="text-lesson-title">
                  {lesson.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{lesson.estimatedMinutes} min read</span>
                  </div>
                  {lesson.isCompleted && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>

                {lesson.keyConcepts && lesson.keyConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lesson.keyConcepts.map((concept, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <InteractiveVideoPlayer lessonId={lesson.id} />

              {content && content.essentials && (
                <Card data-testid="section-essentials">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-bold uppercase tracking-wider text-primary">
                        The Essentials
                      </h2>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown>{content.essentials}</ReactMarkdown>
                    </div>
                    {weekInfo?.week.action && (
                      <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="font-bold text-sm uppercase tracking-wider text-primary mb-1">
                          Your Action:
                        </p>
                        <p className="text-sm">{weekInfo.week.action.title}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {content && content.apply && (
                <Card data-testid="section-apply">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Wrench className="w-5 h-5 text-orange-500" />
                      <h2 className="text-lg font-bold uppercase tracking-wider text-orange-500">
                        Put It to Work
                      </h2>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown>{content.apply}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {content && content.science && (
                <Card data-testid="section-science">
                  <CardContent className="p-6 md:p-8">
                    <button
                      onClick={() => setScienceExpanded(!scienceExpanded)}
                      className="flex items-center gap-2 w-full text-left"
                      data-testid="button-toggle-science"
                    >
                      <FlaskConical className="w-5 h-5 text-blue-500" />
                      <h2 className="text-lg font-bold uppercase tracking-wider text-blue-500 flex-1">
                        Want the Science? (Optional)
                      </h2>
                      {scienceExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${scienceExpanded ? "max-h-[5000px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}
                    >
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown>{content.science}</ReactMarkdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!content && (
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <div className="prose prose-slate dark:prose-invert max-w-none" data-testid="text-lesson-content">
                      <p className="text-muted-foreground italic">
                        No content available for this lesson yet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-24 twohanded:pb-4">
                {prevLesson ? (
                  <Link href={`/module/${moduleId}/lesson/${prevLesson.id}`}>
                    <Button variant="outline" className="gap-2" data-testid="button-prev-lesson">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="truncate max-w-[120px]">Previous</span>
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!lesson.isCompleted && (
                    <Button
                      onClick={() => completeLessonMutation.mutate(lessonId)}
                      disabled={completeLessonMutation.isPending}
                      data-testid="button-mark-complete"
                    >
                      {completeLessonMutation.isPending ? "Saving..." : "Mark Complete"}
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {nextLesson ? (
                    <Link href={`/module/${moduleId}/lesson/${nextLesson.id}`}>
                      <Button variant={lesson.isCompleted ? "default" : "outline"} className="gap-2" data-testid="button-next-lesson">
                        <span className="truncate max-w-[120px]">Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/module/${moduleId}`}>
                      <Button variant="outline" className="gap-2" data-testid="button-back-module">
                        Back to Module
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <Link href={`/community?context=week_${getWeekForLesson(lesson.id)?.week?.weekNumber || 1}`}>
                <Button variant="ghost" className="w-full mt-4 gap-2 text-muted-foreground hover:text-foreground" data-testid="link-community-discuss">
                  <MessageSquare className="w-4 h-4" />
                  Discuss this in the community
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
