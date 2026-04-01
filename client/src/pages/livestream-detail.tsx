import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Radio, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Livestream } from "@shared/schema";

export default function LivestreamDetailPage() {
  const [, params] = useRoute("/livestreams/:id");
  const id = params?.id;

  const { data: stream, isLoading } = useQuery<Livestream>({
    queryKey: ["/api/livestreams", id],
    enabled: !!id,
  });

  const videoUrl = stream ? (stream.status === "live" ? stream.embedUrl : stream.recordingUrl) : null;

  return (
    <AppLayout title={stream?.title || "Workshop"} subtitle="Live session recording">
      <div className="p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : !stream ? (
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground">Livestream not found</p>
            <Link href="/livestreams">
              <Button variant="outline" className="mt-4" data-testid="button-back-streams">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workshops
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/livestreams">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold flex-1" data-testid="text-stream-title">{stream.title}</h1>
              {stream.status === "live" && (
                <Badge variant="destructive" className="animate-pulse" data-testid="badge-live">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              )}
              {stream.status === "ended" && (
                <Badge variant="secondary" data-testid="badge-recording">Recording</Badge>
              )}
            </div>

            {videoUrl ? (
              <div className="aspect-video rounded-md overflow-hidden bg-black">
                <iframe
                  src={videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="iframe-video"
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No video available for this session.</p>
                </CardContent>
              </Card>
            )}

            {stream.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">About this session</h3>
                  <p className="text-sm text-muted-foreground">{stream.description}</p>
                </CardContent>
              </Card>
            )}

            {stream.endedAt && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Recorded on {new Date(stream.endedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
