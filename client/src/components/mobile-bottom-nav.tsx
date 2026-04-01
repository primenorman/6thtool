import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  MoreHorizontal,
  TrendingUp,
  Brain,
  Trophy,
  Activity,
  Radio,
  Target,
  Settings,
  Users,
  BarChart3,
  Layers,
  PenLine,
  X,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useIsMobileContext } from "@/hooks/use-viewport-context";

const primaryTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/practice", label: "Practice", icon: Calendar },
  { href: "/modules", label: "Modules", icon: BookOpen, matchPrefix: true },
  { href: "/templates", label: "Templates", icon: FileText },
];

const moreItems = [
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/journal", label: "Protocol", icon: PenLine },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/neural-lab", label: "Neural Lab", icon: Brain },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/coach", label: "Coach", icon: Activity },
  { href: "/livestreams", label: "Live Workshops", icon: Radio },
  { href: "/resources", label: "Resources", icon: BookOpen },
];

const adminItems = [
  { href: "/admin", label: "Admin Overview", icon: Settings },
  { href: "/admin/modules", label: "Admin Modules", icon: Layers },
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/analytics", label: "Admin Analytics", icon: BarChart3 },
  { href: "/admin/livestreams", label: "Admin Streams", icon: Radio },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobileContext();

  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  if (!isMobile) return null;

  const isActive = (href: string, matchPrefix?: boolean) => {
    if (href === "/modules") return location === "/modules" || location.startsWith("/module/");
    if (matchPrefix) return location.startsWith(href);
    if (href === "/dashboard") return location === "/" || location === "/dashboard";
    return location === href;
  };

  const isMoreActive = [...moreItems, ...adminItems].some(item => location === item.href || location.startsWith(item.href));

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMoreOpen(false)}
          data-testid="overlay-more-menu"
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 px-3 pb-2">
          <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover-elevate"
                data-testid="button-close-more"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-2">
              {moreItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-md min-h-[4rem]",
                      isActive(item.href) ? "bg-primary/10 text-primary" : "hover-elevate"
                    )}
                    data-testid={`nav-more-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[11px] text-center leading-tight">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
            {isAdmin && (
              <>
                <div className="border-t mx-2" />
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Admin</span>
                </div>
                <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                  {adminItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-md min-h-[4rem]",
                          isActive(item.href) ? "bg-primary/10 text-primary" : "hover-elevate"
                        )}
                        data-testid={`nav-admin-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[11px] text-center leading-tight">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            <div className="border-t">
              <button
                onClick={() => {
                  import("@/lib/supabase").then(({ supabase }) => {
                    supabase.auth.signOut().then(() => { window.location.href = "/"; });
                  });
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover-elevate w-full"
                data-testid="button-mobile-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        data-testid="nav-mobile-bottom"
      >
        <div className="flex items-center justify-around h-16">
          {primaryTabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-md transition-colors",
                  isActive(tab.href, tab.matchPrefix)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                data-testid={`nav-tab-${tab.label.toLowerCase()}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-md transition-colors",
              moreOpen || isMoreActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
            data-testid="nav-tab-more"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
