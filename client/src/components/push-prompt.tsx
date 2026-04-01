import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { getPreference, setPreference } from "@/lib/offline-db";
import { apiRequest } from "@/lib/queryClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    if (!VAPID_PUBLIC_KEY) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await apiRequest("POST", "/api/push/subscribe", {
      subscription: subscription.toJSON(),
    });

    return true;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

export function PushPrompt({ afterFirstPractice }: { afterFirstPractice: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!afterFirstPractice) return;
    if (!("Notification" in window) || Notification.permission === "granted" || Notification.permission === "denied") return;

    getPreference("push_prompt_dismissed").then((dismissed) => {
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(timer);
      }
    });
  }, [afterFirstPractice]);

  const handleAccept = async () => {
    const success = await subscribeToPush();
    if (success) {
      await setPreference("push_subscribed", true);
    }
    setShow(false);
  };

  const handleDismiss = async () => {
    await setPreference("push_prompt_dismissed", true);
    setShow(false);
  };

  if (!show) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 border-orange-500/30 bg-background/95 backdrop-blur shadow-lg" data-testid="push-prompt">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Protect your streak</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get a daily reminder to keep your practice streak alive.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAccept} data-testid="btn-accept-push">
                Yes, remind me
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss} data-testid="btn-dismiss-push">
                Not now
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-1" onClick={handleDismiss} data-testid="btn-close-push">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
