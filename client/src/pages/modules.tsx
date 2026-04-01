import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";
import {
  Lock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Clock,
  Zap,
  Brain,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COURSE_WEEKS } from "@/lib/course-config";

interface ModuleWithProgress {
  id: number;
  title: string;
  description: string;
  objectives: string[];
  orderIndex: number;
  estimatedMinutes: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  lessonsCompleted?: number;
  totalLessons?: number;
}

export default function ModulesPage() {
  const { data: modules, isLoading } = useQuery<ModuleWithProgress[]>({
    queryKey: ["/api/modules"],
  });

  const weekStatuses = COURSE_WEEKS.map(week => {
    const weekModules = modules?.filter(m => week.originalModuleIds.includes(m.id)) || [];
    const allComplete = weekModules.length > 0 && weekModules.every(m => m.isCompleted);
    const anyUnlocked = weekModules.some(m => m.isUnlocked);
    const firstModuleId = week.originalModuleIds[0];
    return { ...week, allComplete, anyUnlocked, firstModuleId };
  });

  const completedWeeks = weekStatuses.filter(w => w.allComplete).length;
  const overallProgress = Math.round((completedWeeks / 6) * 100);

  return (
    <AppLayout
      title="6-Week Training Path"
      subtitle="Your mental performance system installation"
    >
      <div className="p-4 md:p-6 min-w-0">
        <div className="max-w-2xl mx-auto space-y-6 min-w-0">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground" data-testid="text-weeks-progress">
                  {completedWeeks}/6 weeks
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {weekStatuses.map((week) => {
                const isLocked = !week.anyUnlocked;

                return (
                  <Link key={week.weekNumber} href={isLocked ? "#" : `/module/${week.firstModuleId}`}>
                    <Card
                      className={cn(
                        "transition-colors",
                        isLocked && "opacity-60",
                        !isLocked && "hover-elevate cursor-pointer"
                      )}
                      data-testid={`card-week-${week.weekNumber}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-lg font-bold",
                            week.allComplete
                              ? "bg-green-500/15 text-green-600 dark:text-green-400"
                              : week.anyUnlocked
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {week.allComplete ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : isLocked ? (
                              <Lock className="w-5 h-5" />
                            ) : (
                              `W${week.weekNumber}`
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={cn(
                                "font-semibold text-sm truncate",
                                isLocked && "text-muted-foreground"
                              )} data-testid={`text-week-title-${week.weekNumber}`}>
                                Week {week.weekNumber}: {week.title}
                              </h3>
                              {week.allComplete && (
                                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400">
                                  Complete
                                </Badge>
                              )}
                              {!week.allComplete && week.anyUnlocked && (
                                <Badge variant="secondary" className="text-[10px]">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {week.subtitle}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {week.lessons.length} lessons
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {week.completionXp} XP
                              </span>
                            </div>
                          </div>

                          {!isLocked && (
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <Link href="/springer-protocol">
            <Card className="hover-elevate cursor-pointer overflow-hidden" data-testid="card-springer-protocol">
              <CardContent className="p-0">
                <div className="p-4 flex items-center gap-4 min-w-0" style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,255,170,0.15)", border: "1px solid rgba(0,255,170,0.3)" }}>
                    <Zap className="w-6 h-6" style={{ color: "#00FFAA" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-white truncate">The Springer Protocol</h3>
                      <Badge className="text-[10px] bg-[#00FFAA]/20 text-[#00FFAA] border-[#00FFAA]/30">Bonus</Badge>
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#A0A0B0" }}>
                      How a 14-year pro discovered the cybernetic code
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#00FFAA" }} />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/neural-lab">
            <Card className="hover-elevate cursor-pointer overflow-hidden" data-testid="card-neural-lab">
              <CardContent className="p-0">
                <div className="p-4 flex items-center gap-4 min-w-0" style={{ background: "linear-gradient(135deg, #0D1117 0%, #161B22 100%)" }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(100,149,237,0.15)", border: "1px solid rgba(100,149,237,0.3)" }}>
                    <Brain className="w-6 h-6" style={{ color: "#6495ED" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-white truncate">Neural Lab</h3>
                      <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">Training</Badge>
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#A0A0B0" }}>
                      Pitch recognition and reaction time training
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#6495ED" }} />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
