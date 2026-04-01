import {
  getPendingPractices,
  getPendingXpAwards,
  clearPendingPractice,
  clearPendingXpAward,
} from "./offline-db";
import { apiRequest, queryClient } from "./queryClient";

let isSyncing = false;

export async function syncPendingData(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const practices = await getPendingPractices();
    for (const p of practices) {
      try {
        await apiRequest("POST", "/api/daily-practice", p.data);
        await clearPendingPractice(p.id!);
        synced++;
      } catch {
        failed++;
      }
    }

    const xpAwards = await getPendingXpAwards();
    for (const x of xpAwards) {
      try {
        await apiRequest("POST", "/api/xp/award", {
          eventType: x.eventType,
          description: x.description,
        });
        await clearPendingXpAward(x.id!);
        synced++;
      } catch {
        failed++;
      }
    }

    if (synced > 0) {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-practice/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/xp/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-calendar"] });
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export function startOnlineSync() {
  window.addEventListener("online", async () => {
    const result = await syncPendingData();
    if (result.synced > 0) {
      console.log(`[Sync] Synced ${result.synced} pending items`);
    }
  });
}

export function isOnline(): boolean {
  return navigator.onLine;
}
