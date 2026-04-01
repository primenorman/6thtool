import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { getPreference, setPreference } from "@/lib/offline-db";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
});

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
}

export function InstallPrompt({ afterFirstPractice }: { afterFirstPractice: boolean }) {
  const [show, setShow] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!afterFirstPractice || isStandalone()) return;

    getPreference("install_prompt_dismissed").then((dismissed) => {
      if (!dismissed) {
        setShow(true);
      }
    });
  }, [afterFirstPractice]);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      deferredPrompt = null;
    }
  };

  const handleDismiss = async () => {
    await setPreference("install_prompt_dismissed", true);
    setShow(false);
    setShowIOSGuide(false);
  };

  if (!show) return null;

  if (showIOSGuide) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 z-50 border-primary/30 bg-background/95 backdrop-blur shadow-lg" data-testid="ios-install-guide">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm mb-2">Add to Home Screen</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Tap the <Share className="inline w-3 h-3" /> Share button in Safari</p>
                <p>2. Scroll down and tap "Add to Home Screen"</p>
                <p>3. Tap "Add" to confirm</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0" data-testid="dismiss-ios-guide">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 border-primary/30 bg-background/95 backdrop-blur shadow-lg" data-testid="install-prompt">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install The 6th Tool</p>
            <p className="text-xs text-muted-foreground">Practice offline, get push reminders</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleDismiss} data-testid="dismiss-install">
              Later
            </Button>
            <Button size="sm" onClick={handleInstall} data-testid="btn-install">
              Install
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
