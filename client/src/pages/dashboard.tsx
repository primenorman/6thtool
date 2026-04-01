import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/app-layout";
import { Link, useLocation } from "wouter";
import {
  Flame,
  Target,
  BookOpen,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  Brain,
  Zap,
  FileText,
  Headphones,
  Users,
  AlertTriangle,
  Trophy,
  Award,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface XpStatus {
  currentXp: number;
  currentLevel: string;
  nextLevel: string | null;
  xpToNext: number;
  xpInLevel: number;
  levelMax: number;
}

interface UserStats {
  streak: number;
  modulesCompleted: number;
  totalJournalEntries: number;
  todayPracticeComplete: boolean;
  lastCertaintyRating: number | null;
}

interface ModuleWithProgress {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  estimatedMinutes: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: xpStatus } = useQuery<XpStatus>({
    queryKey: ["/api/xp/status"],
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: modules = [] } = useQuery<ModuleWithProgress[]>({
    queryKey: ["/api/modules"],
  });

  const { data: certaintyRatings = [] } = useQuery<Array<{ ratingDate: string; rating: number }>>({
    queryKey: ["/api/certainty-ratings"],
  });

  const { data: badgeList = [] } = useQuery<Array<{ id: string; name: string; iconEmoji: string; earnedAt: string | null }>>({
    queryKey: ["/api/badges"],
  });

  const earnedBadges = badgeList.filter(b => b.earnedAt);

  const streak = stats?.streak || user?.currentStreak || 0;
  const todayDone = stats?.todayPracticeComplete || false;
  const currentXp = xpStatus?.currentXp || user?.currentXp || 0;
  const currentLevel = xpStatus?.currentLevel || user?.currentLevel || "Rookie";
  const nextLevel = xpStatus?.nextLevel;
  const xpToNext = xpStatus?.xpToNext || 0;
  const xpProgress =
    xpStatus && xpStatus.levelMax > 0
      ? Math.min(100, (xpStatus.xpInLevel / xpStatus.levelMax) * 100)
      : 0;

  const currentModule = modules.find((m) => !m.isCompleted) || modules[0];

  const isEvening = new Date().getHours() >= 18;
  const hoursUntilMidnight = 24 - new Date().getHours();

  const displayName =
    user?.displayName || user?.firstName || user?.email?.split("@")[0] || "Athlete";

  const chartData = certaintyRatings
    .slice(-30)
    .map((r: any) => ({
      date: new Date(r.ratingDate || r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rating: r.rating,
    }));

  const quickAccessItems = [
    {
      label: "Neural Lab",
      icon: Brain,
      href: "/neural-lab",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Springer Protocol",
      icon: Zap,
      href: "/springer-protocol",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      label: "Leaderboard",
      icon: Trophy,
      href: "/leaderboard",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      label: "Templates",
      icon: FileText,
      href: "/templates",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Community",
      icon: MessageSquare,
      href: "/community",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-100 dark:bg-teal-900/30",
    },
    {
      label: "Resources",
      icon: Headphones,
      href: "/resources",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  return (
    <AppLayout title="" hideHeader>
      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-xl font-bold" data-testid="text-welcome">{displayName}</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400" data-testid="text-streak">
              {streak}
            </span>
          </div>
        </div>

        <Card className={cn(
          "overflow-hidden",
          todayDone
            ? "border-green-300 dark:border-green-700"
            : "border-primary/30"
        )}>
          <CardContent className="p-5">
            {todayDone ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-green-700 dark:text-green-400" data-testid="text-practice-done">
                    Practice Complete
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    See you tomorrow. Keep the streak alive.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Today's Mission
                  </p>
                  <h2 className="text-lg font-bold mt-1">
                    15-Minute Daily Practice
                  </h2>
                </div>

                {isEvening && !todayDone && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {hoursUntilMidnight}h until streak breaks! Complete your practice now.
                    </span>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/practice")}
                  data-testid="button-start-practice"
                >
                  <Play className="w-4 h-4 mr-2" /> START PRACTICE
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Your Progress
            </p>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold" data-testid="text-level">{currentLevel}</span>
                  {nextLevel && (
                    <span className="text-xs text-muted-foreground">
                      → {nextLevel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={xpProgress} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid="text-xp">
                    {currentXp} XP
                  </span>
                </div>
                {xpToNext > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {xpToNext} XP to {nextLevel}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {earnedBadges.length > 0 && (
          <Card data-testid="card-badges">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Badges Earned
                </p>
                <span className="text-xs text-muted-foreground">{earnedBadges.length}/{badgeList.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.slice(0, 8).map(b => (
                  <div
                    key={b.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs"
                    title={b.name}
                    data-testid={`badge-earned-${b.id}`}
                  >
                    <span>{b.iconEmoji}</span>
                    <span className="font-medium">{b.name}</span>
                  </div>
                ))}
                {earnedBadges.length > 8 && (
                  <span className="text-xs text-muted-foreground self-center">+{earnedBadges.length - 8} more</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {chartData.length > 1 && (
          <Card data-testid="card-certainty-chart">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Your Mental Performance Trend
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                      name="Certainty"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {currentModule && (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/module/${currentModule.id}`)}
            data-testid="card-continue-learning"
          >
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Continue Learning
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {currentModule.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{currentModule.estimatedMinutes} min</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Quick Access
          </p>
          <div className="grid grid-cols-5 gap-2">
            {quickAccessItems.map((item) => (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors",
                  item.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:border-primary/30"
                )}
                data-testid={`link-quick-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    item.bg
                  )}
                >
                  <item.icon className={cn("w-5 h-5", item.color)} />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {!user?.onboardingCompleted && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Start Day 0 Fast Track</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Install your mental performance system in 30 minutes. 3 quick
                lessons to get you started.
              </p>
              <Button
                onClick={() => navigate("/fast-track")}
                size="sm"
                data-testid="button-start-fast-track"
              >
                Begin Fast Track
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
