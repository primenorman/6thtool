import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Flame,
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransformationAnalytics {
  cohortMetrics: {
    avgStreak: number;
    avgCertainty: number | null;
    masteryCompletionRate: number;
    activeUsers30Days: number;
    totalPracticeDays: number;
  };
  streakDistribution: { range: string; count: number }[];
  masteryBottlenecks: { requirementId: string; title: string; moduleId: number; pendingCount: number; avgReviewDays: number }[];
  templateUsage: { templateName: string; submissions: number; verified: number }[];
  riskIndicators: { userId: string; userName: string; issue: string; detail: string }[];
  outcomesSummary: { totalOutcomes: number; avgImprovement: number | null; topMetric: string | null };
}

interface Testimonial {
  id: string;
  userId: string;
  userName?: string;
  testimonialText: string;
  specificImprovement: string | null;
  quantifiableResult: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  submittedAt: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminTransformation() {
  const { toast } = useToast();

  const { data: analytics, isLoading } = useQuery<TransformationAnalytics>({
    queryKey: ['/api/admin/transformation-analytics'],
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/admin/testimonials'],
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, verified, featured }: { id: string; verified: boolean; featured: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/testimonials/${id}`, { verified, featured });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/testimonials'] });
      toast({ title: "Updated", description: "Testimonial status updated." });
    },
  });

  const streakChartData = analytics?.streakDistribution || [];
  const templateChartData = analytics?.templateUsage?.slice(0, 8) || [];

  const pendingTestimonials = testimonialsLoading ? [] : testimonials.filter(t => !t.isVerified);
  const verifiedTestimonials = testimonialsLoading ? [] : testimonials.filter(t => t.isVerified);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 twohanded:grid-cols-2 tablet:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card>
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
          <h2 className="text-2xl font-bold" data-testid="text-transformation-title">Transformation Analytics</h2>
          <p className="text-muted-foreground">Behavioral change and capability development across all users</p>
        </div>

        {/* Cohort Metrics */}
        <div className="grid grid-cols-1 twohanded:grid-cols-2 tablet:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Avg Streak</CardTitle>
              <Flame className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-avg-streak">{analytics?.cohortMetrics.avgStreak ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">days across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Avg Certainty</CardTitle>
              <Target className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-avg-certainty">
                {analytics?.cohortMetrics.avgCertainty?.toFixed(1) ?? 'N/A'}
                {analytics?.cohortMetrics.avgCertainty && <span className="text-lg text-muted-foreground">/10</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">platform-wide average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Mastery Rate</CardTitle>
              <Shield className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-mastery-rate">{analytics?.cohortMetrics.masteryCompletionRate ?? 0}%</div>
              <Progress value={analytics?.cohortMetrics.masteryCompletionRate ?? 0} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Active (30d)</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-active-users">{analytics?.cohortMetrics.activeUsers30Days ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">practiced in last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Practice</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-practice">{analytics?.cohortMetrics.totalPracticeDays ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">completed sessions</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList data-testid="tabs-admin-transformation">
            <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
            <TabsTrigger value="risk" data-testid="tab-risk">
              Risk Indicators
              {(analytics?.riskIndicators.length ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-2">{analytics?.riskIndicators.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="testimonials" data-testid="tab-testimonials">
              Testimonials
              {pendingTestimonials.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingTestimonials.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid tablet:grid-cols-2 gap-6">
              {/* Streak Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Flame className="w-4 h-4" /> Streak Distribution</CardTitle>
                  <CardDescription>Practice consistency across user base</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  {streakChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No streak data</div>
                  ) : (
                    <ChartContainer config={{ count: { label: "Users", color: "hsl(var(--primary))" } }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={streakChartData}>
                          <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Template Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4" /> Template Usage</CardTitle>
                  <CardDescription>Most utilized templates across platform</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  {templateChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No template data</div>
                  ) : (
                    <ChartContainer config={{
                      submissions: { label: "Submissions", color: "hsl(var(--chart-2))" },
                      verified: { label: "Verified", color: "hsl(var(--primary))" },
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={templateChartData} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="templateName" tick={{ fontSize: 10 }} width={120} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="submissions" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mastery Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Mastery Bottlenecks</CardTitle>
                <CardDescription>Requirements with longest review queues</CardDescription>
              </CardHeader>
              <CardContent>
                {(analytics?.masteryBottlenecks.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending mastery submissions</p>
                ) : (
                  <div className="space-y-3">
                    {analytics?.masteryBottlenecks.map((b) => (
                      <div key={b.requirementId} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{b.title}</p>
                          <p className="text-xs text-muted-foreground">Module {b.moduleId}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{b.pendingCount} pending</Badge>
                          <Badge variant="outline">{b.avgReviewDays}d avg wait</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outcomes Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Outcomes Summary</CardTitle>
                <CardDescription>User-reported performance improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid twohanded:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Outcomes Reported</p>
                    <p className="text-2xl font-bold" data-testid="text-total-outcomes">{analytics?.outcomesSummary.totalOutcomes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Improvement</p>
                    <p className="text-2xl font-bold" data-testid="text-avg-improvement">
                      {analytics?.outcomesSummary.avgImprovement !== null ? `${analytics?.outcomesSummary.avgImprovement}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Tracked Metric</p>
                    <p className="text-2xl font-bold" data-testid="text-top-metric">
                      {analytics?.outcomesSummary.topMetric ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Users Needing Intervention
                </CardTitle>
                <CardDescription>Users with declining certainty, broken streaks, or other risk patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {(analytics?.riskIndicators.length ?? 0) === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium">No risk indicators detected</p>
                    <p className="text-sm text-muted-foreground">All users appear to be on track</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics?.riskIndicators.map((risk, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg border" data-testid={`card-risk-${i}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            risk.issue === 'Low certainty' ? 'bg-red-500/10' : 'bg-amber-500/10'
                          }`}>
                            <AlertTriangle className={`w-4 h-4 ${
                              risk.issue === 'Low certainty' ? 'text-red-500' : 'text-amber-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{risk.userName}</p>
                            <p className="text-xs text-muted-foreground">{risk.detail}</p>
                          </div>
                        </div>
                        <Badge variant={risk.issue === 'Low certainty' ? 'destructive' : 'secondary'}>
                          {risk.issue}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6">
            {/* Pending Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Pending Review ({pendingTestimonials.length})
                </CardTitle>
                <CardDescription>User stories awaiting verification</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTestimonials.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No testimonials pending review</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTestimonials.map((t) => (
                      <div key={t.id} className="p-4 rounded-lg border space-y-3" data-testid={`card-testimonial-${t.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{t.userName}</p>
                            <p className="text-sm mt-1">{t.testimonialText}</p>
                            {t.specificImprovement && (
                              <p className="text-xs text-muted-foreground mt-2">Improvement: {t.specificImprovement}</p>
                            )}
                            {t.quantifiableResult && (
                              <p className="text-xs text-muted-foreground">Result: {t.quantifiableResult}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => updateTestimonialMutation.mutate({ id: t.id, verified: true, featured: false })}
                            data-testid={`button-approve-${t.id}`}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTestimonialMutation.mutate({ id: t.id, verified: true, featured: true })}
                            data-testid={`button-feature-${t.id}`}
                          >
                            <Star className="w-3 h-3 mr-1" /> Approve & Feature
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateTestimonialMutation.mutate({ id: t.id, verified: false, featured: false })}
                            data-testid={`button-reject-${t.id}`}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verified Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Verified Stories ({verifiedTestimonials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verifiedTestimonials.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No verified testimonials yet</p>
                ) : (
                  <div className="space-y-4">
                    {verifiedTestimonials.map((t) => (
                      <div key={t.id} className="p-4 rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium text-sm">{t.userName}</p>
                          <div className="flex items-center gap-2">
                            {t.isFeatured && <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400"><Star className="w-3 h-3 mr-1" /> Featured</Badge>}
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">Verified</Badge>
                          </div>
                        </div>
                        <p className="text-sm">{t.testimonialText}</p>
                        {t.specificImprovement && (
                          <p className="text-xs text-muted-foreground">Improvement: {t.specificImprovement}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={t.isFeatured ? "ghost" : "outline"}
                            onClick={() => updateTestimonialMutation.mutate({ id: t.id, verified: true, featured: !t.isFeatured })}
                            data-testid={`button-toggle-feature-${t.id}`}
                          >
                            <Star className="w-3 h-3 mr-1" /> {t.isFeatured ? 'Unfeature' : 'Feature'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
