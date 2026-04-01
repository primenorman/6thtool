import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppLayout } from "@/components/app-layout";
import { 
  Flame, 
  BookOpen, 
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Award,
  Target,
  Zap,
  Plus,
  BarChart3,
  Shield,
  Minus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ModuleWithProgress {
  id: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface TransformationSummary {
  practiceConsistency: { currentStreak: number; longestStreak: number; totalPracticeDays: number; last30DaysRate: number };
  capabilityDevelopment: { modulesCompleted: number; totalModules: number; capabilitiesVerified: string[]; templateSubmissions: number };
  certaintyTrend: { current: number | null; avg7Day: number | null; avg30Day: number | null; trend: string };
  transformationScore: { rawScore: number; level: string };
  milestones: { id: string; title: string; description: string; earned: boolean; earnedAt?: string }[];
  outcomes: PerformanceOutcome[];
}

interface PerformanceOutcome {
  id: string;
  outcomeType: string;
  metricName: string;
  baselineValue: number | null;
  currentValue: number | null;
  improvementPercentage: number | null;
  notes: string | null;
  seasonContext: string | null;
  reportedAt: string;
}

interface CertaintyRating {
  id: string;
  ratingDate: string;
  rating: number;
}

interface DailyPracticeLog {
  id: string;
  practiceDate: string;
  isFullyCompleted: boolean;
}

const OUTCOME_TYPES = [
  { value: 'statistical', label: 'Statistical' },
  { value: 'psychological', label: 'Psychological' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'competitive', label: 'Competitive' },
];

const STAT_METRICS = [
  'Batting Average', 'On-Base Percentage', 'Slugging Percentage', 'Home Runs',
  'Strikeout Rate', 'Walk Rate', 'RBI', 'Stolen Bases',
];

const PSYCH_METRICS = [
  'Pressure Performance', 'Pre-Game Anxiety Level', 'Focus Duration',
  'Recovery Speed', 'Confidence Level', 'Mental Toughness Score',
];

function OutcomeForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [outcomeType, setOutcomeType] = useState('statistical');
  const [metricName, setMetricName] = useState('');
  const [customMetric, setCustomMetric] = useState('');
  const [baselineValue, setBaselineValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [seasonContext, setSeasonContext] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/outcomes', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transformation/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/outcomes'] });
      toast({ title: "Outcome recorded", description: "Your performance outcome has been saved." });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save outcome.", variant: "destructive" });
    }
  });

  const metrics = outcomeType === 'statistical' ? STAT_METRICS : PSYCH_METRICS;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Outcome Type</label>
        <Select value={outcomeType} onValueChange={setOutcomeType}>
          <SelectTrigger data-testid="select-outcome-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OUTCOME_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Metric</label>
        {(outcomeType === 'statistical' || outcomeType === 'psychological') ? (
          <Select value={metricName} onValueChange={setMetricName}>
            <SelectTrigger data-testid="select-metric">
              <SelectValue placeholder="Select metric..." />
            </SelectTrigger>
            <SelectContent>
              {metrics.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
              <SelectItem value="custom">Other (custom)</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={customMetric}
            onChange={(e) => setCustomMetric(e.target.value)}
            placeholder="Describe the improvement..."
            data-testid="input-custom-metric"
          />
        )}
        {metricName === 'custom' && (
          <Input
            value={customMetric}
            onChange={(e) => setCustomMetric(e.target.value)}
            placeholder="Enter custom metric name..."
            className="mt-2"
            data-testid="input-custom-metric-name"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Baseline Value</label>
          <Input
            type="number"
            step="0.001"
            value={baselineValue}
            onChange={(e) => setBaselineValue(e.target.value)}
            placeholder="Before 6th Tool"
            data-testid="input-baseline"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Value</label>
          <Input
            type="number"
            step="0.001"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="Current"
            data-testid="input-current"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Season / Context</label>
        <Input
          value={seasonContext}
          onChange={(e) => setSeasonContext(e.target.value)}
          placeholder="e.g., Spring 2026, Summer showcase"
          data-testid="input-season"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What changed? What technique do you attribute this to?"
          data-testid="input-outcome-notes"
        />
      </div>

      <Button
        className="w-full"
        data-testid="button-save-outcome"
        disabled={createMutation.isPending}
        onClick={() => {
          const finalMetric = metricName === 'custom' ? customMetric : (metricName || customMetric);
          if (!finalMetric) {
            toast({ title: "Required", description: "Please select or enter a metric.", variant: "destructive" });
            return;
          }
          createMutation.mutate({
            outcomeType,
            metricName: finalMetric,
            baselineValue: baselineValue ? parseFloat(baselineValue) : null,
            currentValue: currentValue ? parseFloat(currentValue) : null,
            notes: notes || null,
            seasonContext: seasonContext || null,
          });
        }}
      >
        {createMutation.isPending ? "Saving..." : "Save Outcome"}
      </Button>
    </div>
  );
}

function TestimonialForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [improvement, setImprovement] = useState('');
  const [result, setResult] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/testimonials', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({ title: "Testimonial submitted", description: "Your story has been submitted for review." });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit testimonial.", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Your Story</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How has The 6th Tool changed your game? Share your experience..."
          className="min-h-[120px]"
          data-testid="input-testimonial-text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Specific Improvement</label>
        <Input
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          placeholder="e.g., Eliminated anxiety in pressure situations"
          data-testid="input-testimonial-improvement"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Quantifiable Result (optional)</label>
        <Input
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="e.g., Batting average improved from .250 to .320"
          data-testid="input-testimonial-result"
        />
      </div>
      <Button
        className="w-full"
        disabled={createMutation.isPending || text.length < 20}
        data-testid="button-submit-testimonial"
        onClick={() => {
          createMutation.mutate({
            testimonialText: text,
            specificImprovement: improvement || null,
            quantifiableResult: result || null,
          });
        }}
      >
        {createMutation.isPending ? "Submitting..." : "Submit Your Story"}
      </Button>
    </div>
  );
}

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);

  const { data: modules = [], isLoading: modulesLoading, isError: modulesError } = useQuery<ModuleWithProgress[]>({
    queryKey: ['/api/modules'],
  });

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery<TransformationSummary>({
    queryKey: ['/api/transformation/summary'],
  });

  const { data: certaintyRatings = [] } = useQuery<CertaintyRating[]>({
    queryKey: ['/api/certainty-ratings'],
  });

  const { data: practiceLogs = [] } = useQuery<DailyPracticeLog[]>({
    queryKey: ['/api/daily-practice'],
  });

  const hasError = modulesError || summaryError;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/outcomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transformation/summary'] });
      toast({ title: "Deleted", description: "Outcome removed." });
    }
  });

  const chartData = certaintyRatings
    .slice()
    .reverse()
    .map(r => ({
      date: format(parseISO(r.ratingDate), 'MMM dd'),
      rating: r.rating,
    }));

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const calendarData = daysInMonth.map(day => {
    const practiced = practiceLogs.some(log => 
      isSameDay(parseISO(log.practiceDate), day) && log.isFullyCompleted
    );
    return { date: day, practiced };
  });

  const isLoading = modulesLoading || summaryLoading;

  const trendValue = summary?.certaintyTrend?.trend;
  const trendIcon = trendValue === 'improving' 
    ? <TrendingUp className="w-4 h-4 text-green-500" />
    : trendValue === 'declining'
      ? <TrendingDown className="w-4 h-4 text-red-500" />
      : <Minus className="w-4 h-4 text-muted-foreground" />;

  const levelColors: Record<string, string> = {
    'Beginner': 'bg-muted text-muted-foreground',
    'Practitioner': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'Advanced': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'Master': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <AppLayout
      title="Transformation Dashboard"
      subtitle="Track your real development, not just engagement"
    >
      <div className="p-4 md:p-6 space-y-6">
        {hasError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-sm">Something went wrong loading your data.</p>
                <p className="text-xs text-muted-foreground">Try refreshing the page. If the issue persists, please contact support.</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-10 w-20" /> : (
                    <p className="text-3xl font-bold" data-testid="text-transformation-score">{summary?.transformationScore.rawScore ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Transformation Score</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isLoading ? <Skeleton className="h-6 w-24" /> : (
                  <Badge className={levelColors[summary?.transformationScore.level || 'Beginner']} data-testid="text-level">
                    {summary?.transformationScore.level}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 twohanded:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold" data-testid="text-streak">{summary?.practiceConsistency.currentStreak ?? 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {trendIcon}
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold" data-testid="text-certainty">{summary?.certaintyTrend.avg7Day ?? '-'}</p>
                  )}
                  <p className="text-xs text-muted-foreground">7-Day Certainty</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold" data-testid="text-capabilities">{summary?.capabilityDevelopment.capabilitiesVerified.length ?? 0}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Capabilities Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold" data-testid="text-modules-completed">
                      {summary?.capabilityDevelopment.modulesCompleted ?? 0}/{summary?.capabilityDevelopment.totalModules ?? 7}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Modules Mastered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList data-testid="tabs-progress">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="outcomes" data-testid="tab-outcomes">Outcomes</TabsTrigger>
            <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
            <TabsTrigger value="testimonial" data-testid="tab-testimonial">Share Story</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid tablet:grid-cols-3 gap-6">
              <Card className="tablet:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle>Certainty Rating Trend</CardTitle>
                      <CardDescription>
                        {trendValue === 'improving' && 'Your certainty is trending upward'}
                        {trendValue === 'declining' && 'Your certainty has been declining — review your blockers'}
                        {(!trendValue || trendValue === 'stable') && 'Your certainty is holding steady'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {summary?.certaintyTrend?.avg30Day != null && (
                        <Badge variant="secondary" data-testid="text-30day-avg">
                          30d avg: {summary?.certaintyTrend.avg30Day}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : chartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No certainty ratings yet. Start by logging your first daily practice.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="certaintyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#certaintyGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Practice Calendar</CardTitle>
                  <CardDescription>
                    {format(today, 'MMMM yyyy')} — {summary?.practiceConsistency.last30DaysRate ?? 0}% consistency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-xs text-muted-foreground font-medium py-2">{day}</div>
                    ))}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {calendarData.map((day, i) => {
                      const isToday = isSameDay(day.date, today);
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${
                            day.practiced 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-muted text-muted-foreground'
                          } ${isToday ? 'ring-2 ring-primary' : ''}`}
                        >
                          {format(day.date, 'd')}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded bg-green-500/20" />
                      <span className="text-muted-foreground">Practiced</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded bg-muted" />
                      <span className="text-muted-foreground">Missed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid twohanded:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Practice Days</p>
                      <p className="text-2xl font-bold" data-testid="text-total-days">{summary?.practiceConsistency.totalPracticeDays ?? 0}</p>
                    </div>
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Longest Streak</p>
                      <p className="text-2xl font-bold" data-testid="text-longest-streak">{summary?.practiceConsistency.longestStreak ?? 0} days</p>
                    </div>
                    <Flame className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Templates Submitted</p>
                      <p className="text-2xl font-bold" data-testid="text-templates">{summary?.capabilityDevelopment.templateSubmissions ?? 0}</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {(summary?.capabilityDevelopment.capabilitiesVerified.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Verified Capabilities</CardTitle>
                  <CardDescription>Techniques you've demonstrated mastery of</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary?.capabilityDevelopment.capabilitiesVerified.map((cap, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Module Progress</CardTitle>
                <CardDescription>Your journey through the 7 training modules</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          module.isCompleted 
                            ? 'bg-green-500 text-white' 
                            : module.isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {module.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-semibold">{module.id}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium truncate">{module.title}</h4>
                            <Badge variant={module.isCompleted ? "default" : module.isUnlocked ? "secondary" : "outline"}>
                              {module.isCompleted ? "Mastered" : module.isUnlocked ? "In Progress" : "Locked"}
                            </Badge>
                          </div>
                          <Progress value={module.isCompleted ? 100 : 0} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outcomes" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold">Performance Outcomes</h3>
                <p className="text-sm text-muted-foreground">Track your real-world results and improvements</p>
              </div>
              <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-outcome">
                    <Plus className="w-4 h-4 mr-2" />
                    Report Outcome
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Performance Outcome</DialogTitle>
                  </DialogHeader>
                  <OutcomeForm onClose={() => setOutcomeDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {(summary?.outcomes.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No outcomes recorded yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track your batting average, psychological shifts, behavioral changes, and competitive results.
                  </p>
                  <Button variant="outline" onClick={() => setOutcomeDialogOpen(true)} data-testid="button-first-outcome">
                    <Plus className="w-4 h-4 mr-2" /> Report Your First Outcome
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid twohanded:grid-cols-2 gap-4">
                {summary?.outcomes.map((outcome) => (
                  <Card key={outcome.id} data-testid={`card-outcome-${outcome.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline">{outcome.outcomeType}</Badge>
                            <span className="font-medium">{outcome.metricName}</span>
                          </div>
                          {outcome.baselineValue !== null && outcome.currentValue !== null && (
                            <div className="flex items-center gap-3 text-sm mb-2">
                              <span className="text-muted-foreground">{outcome.baselineValue}</span>
                              <span className="text-muted-foreground">&rarr;</span>
                              <span className="font-medium">{outcome.currentValue}</span>
                              {outcome.improvementPercentage !== null && (
                                <Badge className={outcome.improvementPercentage >= 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}>
                                  {outcome.improvementPercentage >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                  {Math.abs(Math.round(outcome.improvementPercentage * 10) / 10)}%
                                </Badge>
                              )}
                            </div>
                          )}
                          {outcome.seasonContext && (
                            <p className="text-xs text-muted-foreground">{outcome.seasonContext}</p>
                          )}
                          {outcome.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{outcome.notes}</p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(outcome.id)}
                          data-testid={`button-delete-outcome-${outcome.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Milestones & Achievements</h3>
              <p className="text-sm text-muted-foreground">Recognition of your transformation journey</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 twohanded:grid-cols-3 tablet:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 twohanded:grid-cols-3 tablet:grid-cols-5 gap-4">
                {summary?.milestones.map((milestone) => (
                  <Card
                    key={milestone.id}
                    className={milestone.earned ? 'bg-primary/5 border-primary/20' : 'opacity-50'}
                    data-testid={`card-milestone-${milestone.id}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                        milestone.earned ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Award className={`w-6 h-6 ${milestone.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{milestone.title}</h4>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      {milestone.earned && (
                        <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Earned
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="testimonial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Your Transformation Story</CardTitle>
                <CardDescription>
                  Help inspire other athletes by sharing how The 6th Tool has impacted your game. 
                  Your story will be reviewed before being featured.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestimonialForm onClose={() => {}} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
