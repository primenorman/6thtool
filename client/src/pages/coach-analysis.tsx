import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/app-layout";
import { StrikeZoneHeatmap } from "@/components/strike-zone-heatmap";
import { 
  Brain,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Flame,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface PerformanceInsight {
  type: "strength" | "improvement" | "alert";
  title: string;
  description: string;
  metric?: string;
}

function generateInsights(data: any): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  if (data?.neuralLabStats) {
    const stats = data.neuralLabStats;
    const avgReaction = stats.averageReactionMs ?? 0;
    const accuracy = stats.accuracy ?? 0;
    
    if (avgReaction > 0 && avgReaction < 400) {
      insights.push({
        type: "strength",
        title: "Elite Reaction Speed",
        description: "Your average reaction time is in the elite category. Keep training to maintain this edge.",
        metric: `${avgReaction}ms avg`
      });
    } else if (avgReaction > 600) {
      insights.push({
        type: "improvement",
        title: "Reaction Time Training Needed",
        description: "Focus on the Neural Lab drills to improve pitch recognition speed.",
        metric: `${avgReaction}ms avg`
      });
    }
    
    if (accuracy >= 90) {
      insights.push({
        type: "strength",
        title: "High Pitch Recognition Accuracy",
        description: "Excellent pitch identification skills. Your visual processing is sharp.",
        metric: `${accuracy.toFixed(0)}% accuracy`
      });
    }
  }
  
  if (data?.certaintyTrend === "declining") {
    insights.push({
      type: "alert",
      title: "Certainty Rating Declining",
      description: "Your mental certainty has been trending down. Review your EPSI and metastory practice.",
    });
  } else if (data?.certaintyTrend === "improving") {
    insights.push({
      type: "strength",
      title: "Growing Mental Certainty",
      description: "Your certainty ratings are trending upward. The cybernetic system is working.",
    });
  }
  
  if (data?.streak >= 7) {
    insights.push({
      type: "strength",
      title: "Strong Practice Streak",
      description: "Your consistency is building powerful neural pathways.",
      metric: `${data.streak} day streak`
    });
  } else if (data?.streak === 0) {
    insights.push({
      type: "alert",
      title: "Practice Streak Broken",
      description: "Get back on track with today's daily practice to rebuild momentum.",
    });
  }
  
  if (insights.length === 0) {
    insights.push({
      type: "improvement",
      title: "Build Your Performance Profile",
      description: "Complete more training activities to generate personalized insights.",
    });
  }
  
  return insights;
}

function InsightCard({ insight }: { insight: PerformanceInsight }) {
  const iconMap = {
    strength: CheckCircle2,
    improvement: Lightbulb,
    alert: AlertTriangle,
  };
  const colorMap = {
    strength: "text-green-500 bg-green-500/10 border-green-500/20",
    improvement: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    alert: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };
  
  const Icon = iconMap[insight.type];
  
  return (
    <div className={cn("p-4 rounded-lg border", colorMap[insight.type])}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{insight.title}</p>
            {insight.metric && (
              <Badge variant="secondary" className="text-xs">{insight.metric}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function CoachAnalysisPage() {
  const { data: analysisData, isLoading } = useQuery<any>({
    queryKey: ['/api/coach/analysis'],
  });

  const { data: strikeZoneData } = useQuery<any[]>({
    queryKey: ['/api/strike-zone/data'],
  });

  const insights = generateInsights(analysisData);

  const reactionTrendData = analysisData?.reactionTrend || [];
  const certaintyTrendData = analysisData?.certaintyHistory || [];

  return (
    <AppLayout title="Cybernetic Coach" subtitle="AI-powered performance analysis">
      <div className="p-4 md:p-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Performance Analysis</h2>
                  <p className="text-white/80">AI-powered insights from your training data</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-20 bg-white/10" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 twohanded:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <Flame className="w-5 h-5 mb-2" />
                    <p className="text-3xl font-bold">{analysisData?.streak || 0}</p>
                    <p className="text-sm text-white/70">Day Streak</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Zap className="w-5 h-5 mb-2" />
                    <p className="text-3xl font-bold">
                      {analysisData?.neuralLabStats?.averageReactionMs || "-"}
                      <span className="text-lg">ms</span>
                    </p>
                    <p className="text-sm text-white/70">Avg Reaction</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Target className="w-5 h-5 mb-2" />
                    <p className="text-3xl font-bold">
                      {analysisData?.neuralLabStats?.accuracy?.toFixed(0) || "-"}%
                    </p>
                    <p className="text-sm text-white/70">Accuracy</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Trophy className="w-5 h-5 mb-2" />
                    <p className="text-3xl font-bold">{analysisData?.rank || "-"}</p>
                    <p className="text-sm text-white/70">Global Rank</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid twohanded:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  AI Insights
                </CardTitle>
                <CardDescription>Personalized recommendations based on your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </CardContent>
            </Card>

            <StrikeZoneHeatmap 
              data={strikeZoneData}
              title="Strike Zone Activity"
              description="Your swing patterns and decision making"
            />
          </div>

          <div className="grid twohanded:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Reaction Time Trend
                </CardTitle>
                <CardDescription>Your Neural Lab performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {reactionTrendData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reactionTrendData}>
                        <defs>
                          <linearGradient id="reactionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={['auto', 'auto']} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="avgMs" 
                          stroke="hsl(var(--primary))" 
                          fill="url(#reactionGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Complete Neural Lab drills to see trends</p>
                      <Link href="/neural-lab">
                        <Button variant="ghost" size="sm" className="mt-2">
                          Go to Neural Lab
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Certainty Rating Trend
                </CardTitle>
                <CardDescription>Your mental certainty over time</CardDescription>
              </CardHeader>
              <CardContent>
                {certaintyTrendData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={certaintyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={[0, 10]} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rating" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Complete daily practices to see trends</p>
                      <Link href="/practice">
                        <Button variant="ghost" size="sm" className="mt-2">
                          Go to Practice
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col twohanded:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Ready to train?</h3>
                  <p className="text-sm text-muted-foreground">
                    Improve your stats with focused practice sessions
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/neural-lab">
                    <Button data-testid="button-goto-neural-lab">
                      <Brain className="w-4 h-4 mr-2" />
                      Neural Lab
                    </Button>
                  </Link>
                  <Link href="/practice">
                    <Button variant="outline" data-testid="button-goto-practice">
                      <Target className="w-4 h-4 mr-2" />
                      Daily Practice
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
