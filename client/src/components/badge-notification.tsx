import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  xpRequired: number;
}

interface BadgeNotificationContextType {
  showBadge: (badge: BadgeData, xpAmount?: number) => void;
  showBadges: (badges: BadgeData[], xpAmount?: number) => void;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType>({
  showBadge: () => {},
  showBadges: () => {},
});

export function useBadgeNotification() {
  return useContext(BadgeNotificationContext);
}

export function BadgeNotificationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Array<{ badge: BadgeData; xpAmount: number }>>([]);
  const [current, setCurrent] = useState<{ badge: BadgeData; xpAmount: number } | null>(null);
  const [visible, setVisible] = useState(false);

  const showBadge = useCallback((badge: BadgeData, xpAmount = 0) => {
    setQueue(prev => [...prev, { badge, xpAmount }]);
  }, []);

  const showBadges = useCallback((badges: BadgeData[], xpAmount = 0) => {
    const items = badges.map(badge => ({ badge, xpAmount }));
    setQueue(prev => [...prev, ...items]);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
      requestAnimationFrame(() => setVisible(true));
    }
  }, [current, queue]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setCurrent(null), 300);
  };

  return (
    <BadgeNotificationContext.Provider value={{ showBadge, showBadges }}>
      {children}
      {current && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          onClick={dismiss}
          data-testid="badge-notification-overlay"
        >
          <div
            className={`relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-b from-primary/20 to-background border border-primary/30 shadow-2xl max-w-sm mx-4 transition-transform duration-500 ${visible ? "scale-100" : "scale-50"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 rounded-2xl animate-pulse bg-primary/5 pointer-events-none" />
            <div className="text-7xl animate-bounce" data-testid="badge-emoji">
              {current.badge.iconEmoji}
            </div>
            <h2 className="text-2xl font-bold text-center" data-testid="badge-name">
              {current.badge.name}
            </h2>
            {current.xpAmount > 0 && (
              <p className="text-lg font-semibold text-primary" data-testid="badge-xp">
                +{current.xpAmount} XP
              </p>
            )}
            <p className="text-muted-foreground text-center text-sm" data-testid="badge-description">
              {current.badge.description}
            </p>
            <Button
              onClick={dismiss}
              className="mt-2 px-8 text-lg font-bold"
              size="lg"
              data-testid="button-badge-dismiss"
            >
              AWESOME!
            </Button>
          </div>
        </div>
      )}
    </BadgeNotificationContext.Provider>
  );
}
