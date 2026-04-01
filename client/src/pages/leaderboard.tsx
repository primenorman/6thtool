import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Target, Medal, Crown, Star } from "lucide-react";

const LEVELS = ["All", "Rookie", "Prospect", "Draft Pick", "Pro", "All-Star", "Hall of Fame"];

interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  currentLevel: string | null;
  xpEarnedThisWeek: number;
  streakThisWeek: number;
  practicesThisWeek: number;
  rank: number;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  totalParticipants: number;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
}

export default function LeaderboardPage() {
  const [selectedLevel, setSelectedLevel] = useState("All");

  const url = selectedLevel !== "All"
    ? `/api/leaderboard?level=${encodeURIComponent(selectedLevel)}`
    : "/api/leaderboard";

  const { data, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: [url],
  });

  return (
    <AppLayout title="Weekly Leaderboard" subtitle="Top performers this week">
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="leaderboard-level-filter">
          {LEVELS.map(level => (
            <Button
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(level)}
              className="whitespace-nowrap"
              data-testid={`button-level-${level.toLowerCase().replace(/\s/g, '-')}`}
            >
              {level}
            </Button>
          ))}
        </div>

        {data?.userEntry && (
          <Card className="border-primary/50 bg-primary/5" data-testid="leaderboard-user-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Your Rank</p>
                    <p className="text-sm text-muted-foreground">
                      #{data.userEntry.rank} of {data.totalParticipants} players
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{data.userEntry.xpEarnedThisWeek} XP</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame className="w-3 h-3" /> {data.userEntry.streakThisWeek}
                    <Target className="w-3 h-3 ml-1" /> {data.userEntry.practicesThisWeek}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="leaderboard-table">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              This Week's Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : data?.entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No activity this week yet. Be the first to practice!
              </p>
            ) : (
              <div className="space-y-2">
                {data?.entries.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.rank <= 3 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                    }`}
                    data-testid={`leaderboard-row-${entry.rank}`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(entry.rank)}
                      <div>
                        <p className="font-medium text-sm">
                          {entry.displayName || "Anonymous Player"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.currentLevel || "Rookie"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{entry.xpEarnedThisWeek} XP</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Flame className="w-3 h-3" /> {entry.streakThisWeek}
                        <Target className="w-3 h-3 ml-1" /> {entry.practicesThisWeek}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
