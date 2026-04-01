import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import { CyberneticBootScreen } from "@/components/cybernetic-boot-screen";
import { BadgeNotificationProvider } from "@/components/badge-notification";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import DiagnosticPage from "@/pages/diagnostic";
import FastTrackPage from "@/pages/fast-track";
import Dashboard from "@/pages/dashboard";
import Practice from "@/pages/practice";
import ProgressPage from "@/pages/progress";
import ResourcesPage from "@/pages/resources";
import ModulePage from "@/pages/module";
import LessonPage from "@/pages/lesson";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminModules from "@/pages/admin/modules";
import AdminExercises from "@/pages/admin/exercises";
import AdminUsers from "@/pages/admin/users";
import AdminAnalytics from "@/pages/admin/analytics";
import NeuralLabPage from "@/pages/neural-lab";
import LeaderboardPage from "@/pages/leaderboard";
import CoachAnalysisPage from "@/pages/coach-analysis";
import LivestreamsPage from "@/pages/livestreams";
import LivestreamDetailPage from "@/pages/livestream-detail";
import AdminLivestreams from "@/pages/admin/livestreams";
import AdminMastery from "@/pages/admin/mastery";
import AdminTransformation from "@/pages/admin/transformation";
import AdminInteractions from "@/pages/admin/interactions";
import TemplatesPage from "@/pages/templates";
import TemplateFormPage from "@/pages/template-form";
import ModulesPage from "@/pages/modules";
import JournalPage from "@/pages/journal";
import SpringerProtocolPage from "@/pages/springer-protocol";
import CommunityPage from "@/pages/community";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/fast-track" component={FastTrackPage} />
      <Route path="/practice" component={Practice} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/modules" component={ModulesPage} />
      <Route path="/module/:id" component={ModulePage} />
      <Route path="/module/:moduleId/lesson/:lessonId" component={LessonPage} />
      <Route path="/neural-lab" component={NeuralLabPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/coach" component={CoachAnalysisPage} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/templates/:slug">{(params) => <TemplateFormPage params={params} />}</Route>
      <Route path="/springer-protocol" component={SpringerProtocolPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/livestreams" component={LivestreamsPage} />
      <Route path="/livestreams/:id" component={LivestreamDetailPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/modules" component={AdminModules} />
      <Route path="/admin/exercises" component={AdminExercises} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/livestreams" component={AdminLivestreams} />
      <Route path="/admin/mastery" component={AdminMastery} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/transformation" component={AdminTransformation} />
      <Route path="/admin/lessons/:lessonId/interactions" component={AdminInteractions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/diagnostic" component={DiagnosticPage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return <AuthenticatedRoutes />;
}

function App() {
  const [showBootScreen, setShowBootScreen] = useState(() => {
    const hasSeenBoot = sessionStorage.getItem("hasSeenBootScreen");
    return !hasSeenBoot;
  });

  const handleBootComplete = () => {
    sessionStorage.setItem("hasSeenBootScreen", "true");
    setShowBootScreen(false);
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="the-6th-tool-theme">
          <TooltipProvider>
            <BadgeNotificationProvider>
              {showBootScreen && (
                <CyberneticBootScreen onComplete={handleBootComplete} duration={3000} />
              )}
              <Router />
              <Toaster />
            </BadgeNotificationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
