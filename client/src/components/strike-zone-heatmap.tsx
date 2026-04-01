import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ZoneData {
  zone: number;
  swingCount: number;
  takeCount: number;
  hitCount: number;
}

interface StrikeZoneHeatmapProps {
  data?: ZoneData[];
  title?: string;
  description?: string;
  className?: string;
}

const ZONE_POSITIONS = [
  { zone: 1, label: "High Inside", row: 0, col: 0 },
  { zone: 2, label: "High Middle", row: 0, col: 1 },
  { zone: 3, label: "High Outside", row: 0, col: 2 },
  { zone: 4, label: "Middle Inside", row: 1, col: 0 },
  { zone: 5, label: "Heart", row: 1, col: 1 },
  { zone: 6, label: "Middle Outside", row: 1, col: 2 },
  { zone: 7, label: "Low Inside", row: 2, col: 0 },
  { zone: 8, label: "Low Middle", row: 2, col: 1 },
  { zone: 9, label: "Low Outside", row: 2, col: 2 },
];

function getHeatColor(intensity: number): string {
  if (intensity === 0) return "bg-slate-800/50";
  if (intensity < 0.2) return "bg-blue-900/70";
  if (intensity < 0.4) return "bg-cyan-700/70";
  if (intensity < 0.6) return "bg-yellow-600/70";
  if (intensity < 0.8) return "bg-orange-500/70";
  return "bg-red-500/80";
}

function getTextColor(intensity: number): string {
  if (intensity < 0.4) return "text-slate-300";
  return "text-white";
}

export function StrikeZoneHeatmap({ 
  data = [], 
  title = "Strike Zone Activity",
  description = "Swing density and decision frequency by zone",
  className 
}: StrikeZoneHeatmapProps) {
  const processedData = useMemo(() => {
    const zoneMap = new Map<number, ZoneData>();
    data.forEach(d => zoneMap.set(d.zone, d));
    
    const maxActivity = Math.max(
      ...data.map(d => d.swingCount + d.takeCount),
      1
    );

    return ZONE_POSITIONS.map(pos => {
      const zoneData = zoneMap.get(pos.zone) || { 
        zone: pos.zone, 
        swingCount: 0, 
        takeCount: 0, 
        hitCount: 0 
      };
      const totalActivity = zoneData.swingCount + zoneData.takeCount;
      const intensity = totalActivity / maxActivity;
      const swingRate = totalActivity > 0 
        ? Math.round((zoneData.swingCount / totalActivity) * 100) 
        : 0;

      return {
        ...pos,
        ...zoneData,
        intensity,
        swingRate,
        totalActivity,
      };
    });
  }, [data]);

  const hasData = data.length > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="aspect-square max-w-[280px] mx-auto">
            <div className="grid grid-cols-3 gap-1 h-full">
              {processedData.map((zone) => (
                <div
                  key={zone.zone}
                  className={cn(
                    "relative rounded-lg transition-all duration-300 flex flex-col items-center justify-center p-2 cursor-pointer hover:scale-105",
                    getHeatColor(zone.intensity),
                    getTextColor(zone.intensity)
                  )}
                  data-testid={`zone-${zone.zone}`}
                >
                  {hasData ? (
                    <>
                      <span className="text-2xl font-bold">{zone.swingRate}%</span>
                      <span className="text-xs opacity-80">swing rate</span>
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] opacity-60">
                        {zone.totalActivity} pitches
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold opacity-50">{zone.zone}</span>
                      <span className="text-[10px] opacity-40">{zone.label}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-900/70" />
              <span className="text-xs text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-600/70" />
              <span className="text-xs text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/80" />
              <span className="text-xs text-muted-foreground">High</span>
            </div>
          </div>

          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
              <p className="text-muted-foreground text-sm">Complete drills to see your heatmap</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
