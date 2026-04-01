import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ModuleSidebar } from "@/components/module-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsMobileContext, useIsTabletOrAbove } from "@/hooks/use-viewport-context";

interface ModuleWithProgress {
  id: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  currentModuleId?: number;
  hideHeader?: boolean;
  hideMobileNav?: boolean;
}

export function AppLayout({
  children,
  title,
  subtitle,
  headerRight,
  currentModuleId,
  hideHeader,
  hideMobileNav,
}: AppLayoutProps) {
  const { user } = useAuth() as any;
  const isMobile = useIsMobileContext();
  const isTabletOrAbove = useIsTabletOrAbove();

  const { data: modules = [] } = useQuery<ModuleWithProgress[]>({
    queryKey: ["/api/modules"],
  });

  const sidebarModules = modules.map((m) => ({
    id: m.id,
    title: m.title,
    isUnlocked: m.isUnlocked,
    isCompleted: m.isCompleted,
  }));

  const overallProgress =
    modules.length > 0
      ? Math.round(
          (modules.filter((m) => m.isCompleted).length / modules.length) * 100
        )
      : 0;

  const resolvedModuleId =
    currentModuleId ??
    modules.find((m) => m.isUnlocked && !m.isCompleted)?.id ??
    modules[0]?.id;

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {isTabletOrAbove && (
          <ModuleSidebar
            user={user}
            modules={sidebarModules}
            currentModuleId={resolvedModuleId}
            overallProgress={overallProgress}
          />
        )}

        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {!hideHeader && (
            <header className="flex items-center justify-between gap-4 px-4 py-3 md:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
              <div className="flex items-center gap-3 min-w-0">
                {isTabletOrAbove && (
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                )}
                {isMobile && (
                  <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-base md:text-lg font-semibold truncate" data-testid="text-page-title">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
                <ThemeToggle />
              </div>
            </header>
          )}

          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isMobile ? 'pb-20' : 'pb-0'}`}>
            {children}
          </main>
        </SidebarInset>

        {!hideMobileNav && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
