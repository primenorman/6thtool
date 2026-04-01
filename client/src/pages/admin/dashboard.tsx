import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  TrendingUp,
  Target,
  BarChart3,
  Activity,
} from "lucide-react";

interface Analytics {
  totalUsers: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  moduleDropoff: { moduleId: number; title: string; completions: number; dropoffRate: number }[];
  averageCertaintyRating: number | null;
  topExercises: { exerciseId: number; title: string; completions: number }[];
}

export default function AdminDashboard() {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h2>
          <p className="text-muted-foreground">Overview of The 6th Tool platform</p>
        </div>

        <div className="grid grid-cols-1 twohanded:grid-cols-2 tablet:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {analytics?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Registered athletes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-enrollments">
                {analytics?.totalEnrollments || 0}
              </div>
              <p className="text-xs text-muted-foreground">Module starts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completion-rate">
                {analytics?.averageCompletionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Module completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Avg Certainty</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-certainty">
                {analytics?.averageCertaintyRating?.toFixed(1) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Out of 10</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Module Performance
              </CardTitle>
              <CardDescription>Completion and dropoff by module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.moduleDropoff?.length === 0 && (
                  <p className="text-muted-foreground text-sm">No module data available</p>
                )}
                {analytics?.moduleDropoff?.map((mod) => (
                  <div key={mod.moduleId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{mod.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{mod.completions} completed</Badge>
                        <Badge variant={mod.dropoffRate > 50 ? "destructive" : "outline"}>
                          {mod.dropoffRate}% dropoff
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
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
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Top Exercises
              </CardTitle>
              <CardDescription>Most completed exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topExercises?.length === 0 && (
                  <p className="text-muted-foreground text-sm">No exercise data available</p>
                )}
                {analytics?.topExercises?.slice(0, 5).map((ex, index) => (
                  <div key={ex.exerciseId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="text-sm font-medium">{ex.title}</span>
                    </div>
                    <Badge>{ex.completions} completions</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
