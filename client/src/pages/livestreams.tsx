import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Play, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Livestream } from "@shared/schema";

function formatTimeAgo(date: string | Date | null): string {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
}

function formatScheduledDate(date: string | Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LivestreamsPage() {
  const { data: streams, isLoading } = useQuery<Livestream[]>({
    queryKey: ["/api/livestreams"],
  });

  const currentLive = streams?.find((s) => s.status === "live");
  const scheduled = streams?.filter((s) => s.status === "scheduled") || [];
  const recordings = streams?.filter((s) => s.status === "ended" && s.recordingUrl) || [];
  const pastNoRecording = streams?.filter((s) => s.status === "ended" && !s.recordingUrl) || [];

  return (
    <AppLayout title="Live Workshops" subtitle="Join live coaching sessions and watch past recordings">
      <div className="p-4 md:p-6 space-y-8">
        {isLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            {currentLive ? (
              <Card className="border-2 border-primary" data-testid="card-live-stream">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="animate-pulse" data-testid="badge-live-indicator">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE NOW
                    </Badge>
                  </div>
                  <h2 className="text-xl font-semibold" data-testid="text-live-title">{currentLive.title}</h2>
                  {currentLive.description && (
                    <p className="text-muted-foreground">{currentLive.description}</p>
                  )}
                  {currentLive.embedUrl && (
                    <div className="aspect-video rounded-md overflow-hidden bg-black">
                      <iframe
                        src={currentLive.embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        data-testid="iframe-live-video"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="card-offline-status">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Radio className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold" data-testid="text-offline-heading">Coach is offline</h2>
                    <p className="text-muted-foreground mt-1">
                      No live session right now. Check back during scheduled workshops or watch past recordings below.
                    </p>
                  </div>
                  {scheduled.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium text-primary">
                        Next session: {formatScheduledDate(scheduled[0].scheduledAt)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {scheduled.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Sessions
                </h3>
                {scheduled.map((stream) => (
                  <Card key={stream.id} className="hover-elevate" data-testid={`card-scheduled-${stream.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{stream.title}</p>
                        {stream.scheduledAt && (
                          <p className="text-sm text-muted-foreground">
                            {formatScheduledDate(stream.scheduledAt)}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Upcoming
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {recordings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Past Recordings</h3>
                {recordings.map((stream) => (
                  <Card key={stream.id} className="hover-elevate" data-testid={`card-recording-${stream.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-20 h-14 rounded-md bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
                        {stream.thumbnailUrl ? (
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Play className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{stream.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(stream.endedAt)}
                        </p>
                      </div>
                      <Link href={`/livestreams/${stream.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-watch-${stream.id}`}>
                          <Play className="w-3 h-3 mr-1" />
                          Watch
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pastNoRecording.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-muted-foreground">Past Sessions</h3>
                {pastNoRecording.map((stream) => (
                  <Card key={stream.id} className="opacity-60" data-testid={`card-past-${stream.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-20 h-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Radio className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{stream.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(stream.endedAt)} — No recording available
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!streams || streams.length === 0) && (
              <Card data-testid="card-no-streams">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No workshops scheduled yet. Check back soon for live coaching sessions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
