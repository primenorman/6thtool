import { Link, useLocation } from "wouter";
import { Lock, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, LayoutDashboard, Calendar, TrendingUp, BookOpen, LogOut, Brain, Trophy, Activity, Radio, Settings, Users, BarChart3, Layers, FileText, PenLine, Zap } from "lucide-react";
import type { User } from "@shared/models/auth";
import { useAdmin } from "@/hooks/use-admin";

interface ModuleSidebarProps {
  user: User | null;
  modules?: Array<{
    id: number;
    title: string;
    isUnlocked: boolean;
    isCompleted: boolean;
  }>;
  currentModuleId?: number;
  overallProgress?: number;
}

export function ModuleSidebar({ 
  user, 
  modules = [], 
  currentModuleId,
  overallProgress = 0 
}: ModuleSidebarProps) {
  const [location] = useLocation();
  const { isAdmin } = useAdmin();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/practice", label: "Daily Practice", icon: Calendar },
    { href: "/neural-lab", label: "Neural Lab", icon: Brain },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/coach", label: "Coach Analysis", icon: Activity },
    { href: "/livestreams", label: "Live Workshops", icon: Radio },
    { href: "/journal", label: "Protocol", icon: PenLine },
    { href: "/templates", label: "Templates", icon: FileText },
    { href: "/progress", label: "Progress", icon: TrendingUp },
    { href: "/resources", label: "Resources", icon: BookOpen },
    { href: "/springer-protocol", label: "Springer Protocol", icon: Zap },
  ];

  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 hover-elevate rounded-md p-2 -m-2 cursor-pointer">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm truncate">The 6th Tool</h1>
              <p className="text-xs text-muted-foreground truncate">Mental Training</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Course Progress */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Course Progress</span>
            <span className="text-xs text-muted-foreground">{overallProgress}%</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <Progress value={overallProgress} className="h-2" />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modules */}
        <SidebarGroup>
          <SidebarGroupLabel>Training Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((module) => (
                <SidebarMenuItem key={module.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentModuleId === module.id}
                    disabled={!module.isUnlocked}
                    className={cn(
                      !module.isUnlocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {module.isUnlocked ? (
                      <Link href={`/module/${module.id}`}>
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                            module.isCompleted 
                              ? "bg-green-500/10 text-green-500" 
                              : currentModuleId === module.id
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {module.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              module.id
                            )}
                          </div>
                          <span className="truncate flex-1">{module.title}</span>
                          {currentModuleId === module.id && (
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="truncate flex-1 text-muted-foreground">{module.title}</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { href: "/admin", label: "Overview", icon: Settings },
                  { href: "/admin/modules", label: "Modules", icon: Layers },
                  { href: "/admin/livestreams", label: "Livestreams", icon: Radio },
                  { href: "/admin/users", label: "Users", icon: Users },
                  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
                ].map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Athlete'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            data-testid="button-logout"
            onClick={() => {
              import("@/lib/supabase").then(({ supabase }) => {
                supabase.auth.signOut().then(() => { window.location.href = "/"; });
              });
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
