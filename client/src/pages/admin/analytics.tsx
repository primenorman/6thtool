import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import {
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  Minus,
} from "lucide-react";

interface Analytics {
  totalUsers: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  moduleDropoff: { moduleId: number; title: string; completions: number; dropoffRate: number }[];
  averageCertaintyRating: number | null;
  topExercises: { exerciseId: number; title: string; completions: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['/api/admin/analytics'],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 twohanded:grid-cols-2 tablet:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-muted rounded w-16 mb-2" />
                  <div className="h-4 bg-muted rounded w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const moduleChartData = analytics?.moduleDropoff?.map((mod, index) => ({
    name: `M${mod.moduleId}`,
    fullName: mod.title,
    completions: mod.completions,
    dropoff: mod.dropoffRate,
  })) || [];

  const exerciseChartData = analytics?.topExercises?.slice(0, 5).map((ex) => ({
    name: ex.title.length > 15 ? ex.title.substring(0, 15) + '...' : ex.title,
    fullName: ex.title,
    completions: ex.completions,
  })) || [];

  const completionPieData = [
    { name: 'Completed', value: analytics?.averageCompletionRate || 0 },
    { name: 'Incomplete', value: 100 - (analytics?.averageCompletionRate || 0) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Platform performance metrics and insights</p>
        </div>

        <div className="grid grid-cols-1 twohanded:grid-cols-2 tablet:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered athletes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Module Enrollments</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.totalEnrollments || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total module starts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              {(analytics?.averageCompletionRate || 0) >= 50 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (analytics?.averageCompletionRate || 0) > 0 ? (
                <TrendingDown className="w-4 h-4 text-amber-500" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.averageCompletionRate || 0}%</div>
              <Progress value={analytics?.averageCompletionRate || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Avg Certainty</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics?.averageCertaintyRating?.toFixed(1) || 'N/A'}
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
              {analytics?.averageCertaintyRating && (
                <Progress value={(analytics.averageCertaintyRating / 10) * 100} className="mt-2 h-2" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Module Completion & Dropoff
              </CardTitle>
              <CardDescription>Track where users complete or leave</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {moduleChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No module data available
                </div>
              ) : (
                <ChartContainer
                  config={{
                    completions: { label: "Completions", color: "hsl(var(--primary))" },
                    dropoff: { label: "Dropoff %", color: "hsl(var(--destructive))" },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Completion Overview
              </CardTitle>
              <CardDescription>Overall course completion rate</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ChartContainer
                config={{
                  completed: { label: "Completed", color: "hsl(var(--primary))" },
                  incomplete: { label: "Incomplete", color: "hsl(var(--muted))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm">Completed ({analytics?.averageCompletionRate || 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-sm">Incomplete ({100 - (analytics?.averageCompletionRate || 0)}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Top Exercises by Completion
            </CardTitle>
            <CardDescription>Most engaged-with exercises across all users</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {exerciseChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No exercise data available
              </div>
            ) : (
              <ChartContainer
                config={{
                  completions: { label: "Completions", color: "hsl(var(--chart-2))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exerciseChartData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completions" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Dropoff Analysis</CardTitle>
              <CardDescription>Detailed breakdown of where users stop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.moduleDropoff?.length === 0 && (
                  <p className="text-muted-foreground text-sm">No data available</p>
                )}
                {analytics?.moduleDropoff?.map((mod) => (
                  <div key={mod.moduleId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{mod.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{mod.completions} completed</Badge>
                        <Badge variant={mod.dropoffRate > 50 ? "destructive" : mod.dropoffRate > 25 ? "secondary" : "default"}>
                          {mod.dropoffRate}% dropoff
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${100 - mod.dropoffRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>Automated observations from the data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics && (
                  <>
                    {analytics.averageCompletionRate >= 70 && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Great completion rate!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your course has a {analytics.averageCompletionRate}% completion rate, which is excellent.
                        </p>
                      </div>
                    )}
                    {analytics.averageCompletionRate < 50 && analytics.averageCompletionRate > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          Completion rate could improve
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider reviewing module content or adding engagement features.
                        </p>
                      </div>
                    )}
                    {analytics.moduleDropoff?.some(m => m.dropoffRate > 60) && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          High dropoff detected
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Some modules have over 60% dropoff. Review content difficulty.
                        </p>
                      </div>
                    )}
                    {analytics.averageCertaintyRating && analytics.averageCertaintyRating < 6 && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Certainty ratings are low
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Users may need more confidence-building exercises.
                        </p>
                      </div>
                    )}
                    {analytics.totalUsers === 0 && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm font-medium">No users yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Insights will appear as users start using the platform.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
