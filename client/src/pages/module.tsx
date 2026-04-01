import { useAuth } from "@/hooks/use-auth";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play,
  CheckCircle2,
  Circle,
  ChevronRight,
  Clock,
  BookOpen,
  FileText,
  Lock,
  Download,
  Headphones,
  Grid3X3,
  Shield,
  Trophy,
  Flame,
  Target,
  Send,
  AlertCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ModuleWithProgress {
  id: number;
  title: string;
  description: string;
  objectives: string[];
  orderIndex: number;
  estimatedMinutes: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string | null;
  content: string | null;
  orderIndex: number;
  estimatedMinutes: number;
  lessonType: string;
  isCompleted?: boolean;
}

interface Resource {
  id: number;
  moduleId: number | null;
  title: string;
  description: string | null;
  resourceType: string;
  fileUrl: string;
}

interface MasteryRequirement {
  id: string;
  moduleId: number;
  requirementType: string;
  title: string;
  description: string | null;
  verificationCriteria: string | null;
  isRequired: boolean;
  autoVerify: boolean;
  targetTemplateSlug: string | null;
  minValue: number | null;
  orderIndex: number;
  estimatedMinutes: number | null;
}

interface MasterySubmission {
  id: string;
  userId: string;
  requirementId: string;
  status: string;
  evidence: string | null;
  fileUrl: string | null;
  verificationFeedback: string | null;
  revisionCount: number;
}

interface MasteryStatus {
  unlocked: boolean;
  requirements: {
    requirement: MasteryRequirement;
    submission: MasterySubmission | null;
    met: boolean;
  }[];
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'audio':
      return Headphones;
    case 'grid':
      return Grid3X3;
    default:
      return FileText;
  }
};

const getResourceBadge = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'audio':
      return 'Audio';
    case 'grid':
      return 'Grid';
    default:
      return 'File';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return Play;
    case 'exercise':
      return FileText;
    case 'reading':
      return BookOpen;
    default:
      return BookOpen;
  }
};

export default function ModulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute('/module/:id');
  const moduleId = parseInt(params?.id || '1');

  const { data: currentModule, isLoading: moduleLoading, isError: moduleError } = useQuery<ModuleWithProgress>({
    queryKey: ['/api/modules', moduleId],
  });

  const { data: lessons = [], isLoading: lessonsLoading, isError: lessonsError } = useQuery<Lesson[]>({
    queryKey: ['/api/modules', moduleId, 'lessons'],
  });

  const { data: allResources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });
  
  const moduleResources = allResources.filter(r => r.moduleId === moduleId);

  const { data: masteryStatus, isLoading: masteryLoading } = useQuery<MasteryStatus>({
    queryKey: ['/api/mastery/module', moduleId],
  });

  const masteryCount = masteryStatus?.requirements?.length || 0;
  const masteryMet = masteryStatus?.requirements?.filter(r => r.met).length || 0;

  const hasError = moduleError || lessonsError;

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest('POST', `/api/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules', moduleId, 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      toast({
        title: "Lesson completed!",
        description: "Great progress on your training journey.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark lesson complete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completedLessons = lessons.filter(l => l.isCompleted).length;
  const progressPercent = lessons.length > 0 
    ? Math.round((completedLessons / lessons.length) * 100) 
    : 0;
  const currentLesson = lessons.find(l => !l.isCompleted);
  const totalDuration = lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 0), 0);

  const isLoading = moduleLoading || lessonsLoading;

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-muted-foreground">Failed to load module. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  if (!currentModule && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Module not found</p>
      </div>
    );
  }

  return (
    <AppLayout
      title={`Module ${moduleId}: ${currentModule?.title || ''}`}
      subtitle={`${completedLessons} of ${lessons.length} lessons complete`}
      currentModuleId={moduleId}
    >
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid tablet:grid-cols-3 gap-6">
              <div className="tablet:col-span-2 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">About This Module</h2>
                  {isLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <p className="text-muted-foreground">{currentModule?.description}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Learning Objectives</h3>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {currentModule?.objectives?.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{progressPercent}%</p>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>~{totalDuration || currentModule?.estimatedMinutes || 0} min total</span>
                    </div>
                  </CardContent>
                </Card>

                {currentLesson && (
                  <Link href={`/module/${moduleId}/lesson/${currentLesson.id}`}>
                    <Button 
                      className="w-full" 
                      data-testid="button-continue-lesson"
                    >
                      Continue: {currentLesson.title}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(moduleId >= 1 && moduleId <= 7) && <ModuleVideoPlayer moduleId={moduleId} />}

        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="lessons" data-testid="tab-lessons">
              <BookOpen className="w-4 h-4 mr-2" />
              Lessons ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="mastery" data-testid="tab-mastery">
              <Shield className="w-4 h-4 mr-2" />
              Mastery ({masteryMet}/{masteryCount})
            </TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">
              <Download className="w-4 h-4 mr-2" />
              Resources ({moduleResources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <CardTitle>Lessons</CardTitle>
                <CardDescription>Complete each lesson in order to progress</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : lessons.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No lessons available for this module yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => {
                      const Icon = getTypeIcon(lesson.lessonType);
                      const isLocked = index > 0 && !lessons[index - 1].isCompleted;
                      const isCurrent = !lesson.isCompleted && !isLocked && 
                        lessons.slice(0, index).every(l => l.isCompleted);

                      return (
                        <div
                          key={lesson.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                            lesson.isCompleted && "bg-green-500/5 border-green-500/20",
                            isCurrent && "bg-primary/5 border-primary/20",
                            isLocked && "opacity-50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            lesson.isCompleted 
                              ? "bg-green-500 text-white" 
                              : isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                          )}>
                            {lesson.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isLocked ? (
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <Icon className={cn(
                                "w-5 h-5",
                                !isCurrent && "text-muted-foreground"
                              )} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{lesson.title}</h4>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {lesson.lessonType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.estimatedMinutes} min</span>
                            </div>
                          </div>

                          {isLocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              data-testid={`button-lesson-${lesson.id}`}
                            >
                              Locked
                              <Lock className="w-4 h-4 ml-1" />
                            </Button>
                          ) : (
                            <Link href={`/module/${moduleId}/lesson/${lesson.id}`}>
                              <Button
                                variant={lesson.isCompleted ? "ghost" : isCurrent ? "default" : "outline"}
                                size="sm"
                                data-testid={`button-lesson-${lesson.id}`}
                              >
                                {lesson.isCompleted ? "Review" : isCurrent ? "Continue" : "Start"}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mastery">
            <MasteryRequirementsPanel
              moduleId={moduleId}
              masteryStatus={masteryStatus}
              isLoading={masteryLoading}
            />
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Module Resources</CardTitle>
                <CardDescription>Downloadable materials for this module</CardDescription>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                ) : moduleResources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No downloadable resources available for this module yet.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {moduleResources.map((resource) => {
                      const Icon = getResourceIcon(resource.resourceType);
                      return (
                        <Card key={resource.id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{resource.title}</h4>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {getResourceBadge(resource.resourceType)}
                                  </Badge>
                                </div>
                                {resource.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {resource.description}
                                  </p>
                                )}
                                <a 
                                  href={resource.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  download
                                >
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    data-testid={`button-download-${resource.id}`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

const getRequirementIcon = (type: string) => {
  switch (type) {
    case 'lessons_complete': return BookOpen;
    case 'template_verified': return FileText;
    case 'practice_streak': return Flame;
    case 'grid_score': return Grid3X3;
    case 'self_assessment': return Target;
    default: return Shield;
  }
};

const getStatusBadge = (met: boolean, submission: MasterySubmission | null) => {
  if (met) return { label: "Complete", variant: "default" as const, className: "bg-green-600 text-white" };
  if (!submission) return { label: "Not Started", variant: "outline" as const, className: "" };
  if (submission.status === 'pending') return { label: "Pending Review", variant: "secondary" as const, className: "" };
  if (submission.status === 'rejected') return { label: "Needs Revision", variant: "destructive" as const, className: "" };
  return { label: submission.status, variant: "outline" as const, className: "" };
};

function MasteryRequirementsPanel({ moduleId, masteryStatus, isLoading }: {
  moduleId: number;
  masteryStatus: MasteryStatus | undefined;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async ({ requirementId, evidence }: { requirementId: string; evidence?: string }) => {
      return apiRequest('POST', '/api/mastery/submit', { requirementId, evidence });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mastery/module', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setExpandedReq(null);
      setEvidenceText("");
      setSubmittingId(null);
      toast({ title: "Submitted!", description: "Your evidence has been submitted for review." });
    },
    onError: (error: any) => {
      setSubmittingId(null);
      toast({ title: "Error", description: error?.message || "Failed to submit. Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const requirements = masteryStatus?.requirements || [];
  const allRequired = requirements.filter(r => r.requirement.isRequired);
  const requiredMet = allRequired.filter(r => r.met).length;
  const allMet = requiredMet === allRequired.length && allRequired.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Mastery Requirements
            </CardTitle>
            <CardDescription>
              Complete these requirements to demonstrate mastery and unlock the next module
            </CardDescription>
          </div>
          {allMet && (
            <Badge className="bg-green-600 text-white" data-testid="badge-mastery-complete">
              <Trophy className="w-3 h-3 mr-1" />
              Mastery Achieved
            </Badge>
          )}
        </div>
        {allRequired.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm text-muted-foreground">
                {requiredMet} of {allRequired.length} required complete
              </span>
              <span className="text-sm font-medium">
                {Math.round((requiredMet / allRequired.length) * 100)}%
              </span>
            </div>
            <Progress value={(requiredMet / allRequired.length) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {requirements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No mastery requirements defined for this module yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requirements.map(({ requirement: req, submission, met }) => {
              const Icon = getRequirementIcon(req.requirementType);
              const badge = getStatusBadge(met, submission);
              const isExpanded = expandedReq === req.id;
              const canSubmit = !met && (!submission || submission.status === 'rejected');
              const needsTextEvidence = req.requirementType === 'self_assessment';
              const isAutoVerify = req.autoVerify;

              return (
                <div
                  key={req.id}
                  className={cn(
                    "border rounded-lg transition-colors",
                    met && "bg-green-500/5 border-green-500/20",
                    submission?.status === 'rejected' && "border-destructive/30",
                    !met && !submission && "border-border"
                  )}
                  data-testid={`mastery-req-${req.id}`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      met ? "bg-green-500 text-white"
                        : submission?.status === 'pending' ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-muted"
                    )}>
                      {met ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{req.title}</h4>
                        {!req.isRequired && (
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        )}
                      </div>
                      {req.description && (
                        <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                      )}
                      {submission?.status === 'rejected' && submission.verificationFeedback && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded bg-destructive/5 text-sm">
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <span className="text-destructive">{submission.verificationFeedback}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={badge.variant} className={badge.className} data-testid={`badge-status-${req.id}`}>
                        {badge.label}
                      </Badge>
                      {canSubmit && (
                        <Button
                          size="sm"
                          variant={isExpanded ? "secondary" : "default"}
                          onClick={() => {
                            if (isAutoVerify && !needsTextEvidence) {
                              setSubmittingId(req.id);
                              submitMutation.mutate({ requirementId: req.id });
                            } else {
                              setExpandedReq(isExpanded ? null : req.id);
                              setEvidenceText("");
                            }
                          }}
                          disabled={submitMutation.isPending && submittingId === req.id}
                          data-testid={`button-submit-${req.id}`}
                        >
                          {submitMutation.isPending && submittingId === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isAutoVerify && !needsTextEvidence ? (
                            <>Verify</>
                          ) : (
                            <>Submit</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && canSubmit && (
                    <div className="px-4 pb-4 border-t pt-3 space-y-3">
                      {req.verificationCriteria && (
                        <p className="text-xs text-muted-foreground">
                          Criteria: {req.verificationCriteria}
                        </p>
                      )}
                      {needsTextEvidence && (
                        <Textarea
                          placeholder="Write your response here..."
                          value={evidenceText}
                          onChange={(e) => setEvidenceText(e.target.value)}
                          className="min-h-[120px]"
                          data-testid={`textarea-evidence-${req.id}`}
                        />
                      )}
                      {req.requirementType === 'template_verified' && req.targetTemplateSlug && (
                        <div className="text-sm text-muted-foreground">
                          Complete and submit the <Link href="/templates" className="text-primary underline">template</Link> first, then click Verify here.
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setExpandedReq(null); setEvidenceText(""); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (needsTextEvidence) {
                              const wordCount = evidenceText.trim().split(/\s+/).filter(Boolean).length;
                              if (wordCount < 50) {
                                toast({ title: "Too short", description: `Please write at least 50 words (currently ${wordCount}).`, variant: "destructive" });
                                return;
                              }
                            }
                            setSubmittingId(req.id);
                            submitMutation.mutate({
                              requirementId: req.id,
                              evidence: needsTextEvidence ? evidenceText : undefined,
                            });
                          }}
                          disabled={submitMutation.isPending}
                          data-testid={`button-confirm-submit-${req.id}`}
                        >
                          {submitMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Send className="w-4 h-4 mr-1" />
                          )}
                          Submit Evidence
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModuleVideoPlayer({ moduleId }: { moduleId: number }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setVideoUrl(null);
    fetch(`/api/video-url/${moduleId}`)
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setVideoUrl(data.url);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [moduleId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Module Overview Video
        </CardTitle>
        <CardDescription>
          Watch this introduction before starting the lessons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
          {loading && (
            <Skeleton className="w-full h-full" />
          )}
          {error && (
            <p className="text-muted-foreground text-sm">Video unavailable</p>
          )}
          {videoUrl && !loading && !error && (
            <video
              key={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full"
              data-testid="video-module-overview"
              src={videoUrl}
              onError={() => setError(true)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
