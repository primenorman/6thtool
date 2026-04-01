import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Target, 
  Brain, 
  Flame, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  TrendingUp,
  Shield,
  LogIn,
  KeyRound,
  Loader2,
} from "lucide-react";

export default function Landing() {
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.message || "Invalid password");
        return;
      }
      window.location.href = "/";
    } catch {
      setLoginError("Connection error. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">The 6th Tool</span>
            </div>
            <div className="hidden tablet:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Results</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                data-testid="button-password-login-toggle"
              >
                <KeyRound className="w-4 h-4" />
              </Button>
              <a href="/auth">
                <Button data-testid="button-login">
                  <LogIn className="w-4 h-4 mr-1" />
                  Log In
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {showPasswordLogin && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <Card className="w-72 shadow-lg">
            <CardContent className="p-4">
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <p className="text-sm font-medium">Admin Access</p>
                <Input
                  type="email"
                  placeholder="Email"
                  value={adminEmail}
                  onChange={(e) => { setAdminEmail(e.target.value); setLoginError(""); }}
                  data-testid="input-admin-email"
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  data-testid="input-admin-password"
                />
                {loginError && (
                  <p className="text-xs text-destructive">{loginError}</p>
                )}
                <Button type="submit" className="w-full" size="sm" disabled={loginLoading || !adminEmail || !password} data-testid="button-admin-login">
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <KeyRound className="w-4 h-4 mr-1" />}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid tablet:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-2">
                <Badge variant="secondary" className="mb-4">
                  Mental Performance System
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
                  The 6th Tool: Elite{" "}
                  <span className="text-primary">Mental Performance Training</span>{" "}
                  for Baseball
                </h1>
                <p className="text-xl text-muted-foreground mt-6 leading-relaxed">
                  The 6th Tool is a systematic baseball mental training program that transforms your 
                  mental approach at the plate. 7 modules. 15 minutes daily. Elite performance — using the RNBR protocol.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <a href="/diagnostic">
                  <Button size="lg" data-testid="button-hero-cta">
                    Take the Free Diagnostic
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Free to start</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t">
                <div>
                  <div className="text-3xl font-bold text-primary">7</div>
                  <div className="text-sm text-muted-foreground">Training Modules</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">15</div>
                  <div className="text-sm text-muted-foreground">Minutes Daily</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Mental Edge</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl flex items-center justify-center">
                <div className="w-3/4 h-3/4 bg-card rounded-2xl shadow-xl border flex flex-col items-center justify-center p-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Cybernetic Training</h3>
                    <p className="text-sm text-muted-foreground">
                      Reprogram your mental approach using proven neuroscience principles
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-muted-foreground">Active Training</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Train Your Mind Like You Train Your Body
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete mental performance system designed for athletes who want to dominate
            </p>
          </div>

          <div className="grid twohanded:grid-cols-2 tablet:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Daily Practice Routine</h3>
                <p className="text-muted-foreground text-sm">
                  15-minute structured practice including breathing, visualization, and 
                  concentration grid training.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Progress Tracking</h3>
                <p className="text-muted-foreground text-sm">
                  Track your daily certainty ratings, practice streaks, and module completion 
                  with visual dashboards.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Metastory Creation</h3>
                <p className="text-muted-foreground text-sm">
                  Build powerful mental blueprints from edited memories that program 
                  your unconscious for success.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Inner Anchor Point</h3>
                <p className="text-muted-foreground text-sm">
                  Discover and activate your physical trigger for instant peak state 
                  access during performance.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Blocker Resolution</h3>
                <p className="text-muted-foreground text-sm">
                  Identify and dissolve unconscious resistance patterns that limit 
                  your performance potential.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Streak Motivation</h3>
                <p className="text-muted-foreground text-sm">
                  Build unstoppable momentum with consecutive day tracking and 
                  achievement milestones.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              7 Modules to Elite Performance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A systematic progression from fundamentals to advanced mental engineering
            </p>
          </div>

          <div className="grid gap-4 max-w-3xl mx-auto">
            {[
              { num: 1, title: "Foundation", desc: "Understanding cybernetic principles and setting SA Objectives" },
              { num: 2, title: "Inner Anchor Point", desc: "Discovering and calibrating your peak state trigger" },
              { num: 3, title: "Metastory Creation", desc: "Building success blueprints from edited experiences" },
              { num: 4, title: "EPSI Development", desc: "Creating holographic endpoint success images" },
              { num: 5, title: "Blocker Resolution", desc: "Identifying and dissolving performance blockers (BBFs)" },
              { num: 6, title: "RNBR Protocol", desc: "Root Normal Base Reframing for deep pattern change" },
              { num: 7, title: "Integration", desc: "Combining all tools into automatic performance habits" },
            ].map((module) => (
              <div 
                key={module.num}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  {module.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold">
            Ready to Unlock Your Mental Edge?
          </h2>
          <p className="text-xl opacity-90">
            Join elite athletes who have transformed their mental game with The 6th Tool system.
          </p>
          <a href="/diagnostic">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-primary"
              data-testid="button-cta-bottom"
            >
              Take the Free Diagnostic
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                </div>
                <span className="font-semibold">The 6th Tool</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Baseball mental training &amp; performance coaching using cybernetic principles and the RNBR protocol.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Program</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/diagnostic" className="hover:text-foreground transition-colors">Free Bio-Computer Diagnostic</a></li>
                <li><a href="/modules" className="hover:text-foreground transition-colors">7-Module Course</a></li>
                <li><a href="/practice" className="hover:text-foreground transition-colors">Daily Practice Routine</a></li>
                <li><a href="/neural-lab" className="hover:text-foreground transition-colors">Neural Lab Training</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Training Topics</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Baseball Visualization Techniques</li>
                <li>Handling Strikeout Anxiety</li>
                <li>RNBR Protocol for Hitters</li>
                <li>Inner Anchor Point Activation</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} The 6th Tool · Cybernetic Baseball Performance Training · hithacking.com
            </p>
            <p className="text-xs text-muted-foreground">
              The mental performance system for elite hitters
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
