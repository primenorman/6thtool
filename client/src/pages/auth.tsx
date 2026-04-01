import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Mail, Lock, Loader2, ArrowRight, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";

type AuthMode = "login" | "signup" | "magic-link";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const quizResults = sessionStorage.getItem("diagnostic_results");

  const saveProfileToBackend = async (parsedQuiz?: Record<string, unknown>) => {
    const profileData: Record<string, unknown> = {
      displayName,
    };
    if (parsedQuiz) {
      profileData.quizResults = parsedQuiz;
      profileData.position = parsedQuiz.position;
      profileData.levelOfPlay = parsedQuiz.levelOfPlay;
      profileData.onboardingCompleted = false;
    }
    await apiRequest("POST", "/api/auth/update-profile", profileData);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (authError) throw authError;

      if (data.user) {
        const parsed = quizResults ? JSON.parse(quizResults) : null;
        await saveProfileToBackend(parsed || undefined);
        sessionStorage.removeItem("diagnostic_results");
        navigate("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
      setMagicLinkSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Target className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">The 6th Tool</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signup"
              ? "Install your mental performance system"
              : "Welcome back, athlete"}
          </p>
        </div>

        {quizResults && mode === "signup" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span>Your Bio-Computer Profile is ready. Create an account to save it.</span>
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {magicLinkSent ? (
              <div className="text-center space-y-3">
                <Mail className="w-10 h-10 text-primary mx-auto" />
                <h3 className="font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a login link to <strong>{email}</strong>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMagicLinkSent(false)}
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <form
                onSubmit={
                  mode === "signup"
                    ? handleSignup
                    : mode === "magic-link"
                    ? handleMagicLink
                    : handleLogin
                }
                className="space-y-4"
              >
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name or username"
                      required
                      data-testid="input-display-name"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="player@baseball.com"
                    required
                    data-testid="input-email"
                  />
                </div>

                {mode !== "magic-link" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      data-testid="input-password"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive" data-testid="text-auth-error">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading} data-testid="button-auth-submit">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : mode === "magic-link" ? (
                    <Mail className="w-4 h-4 mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {mode === "signup"
                    ? "Create Account & Start Training"
                    : mode === "magic-link"
                    ? "Send Login Link"
                    : "Log In"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2 text-center text-sm">
          {mode === "login" && (
            <>
              <button
                onClick={() => { setMode("magic-link"); setError(""); }}
                className="text-primary hover:underline block mx-auto"
                data-testid="link-magic-link"
              >
                Login with email link instead
              </button>
              <p className="text-muted-foreground">
                New here?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(""); }}
                  className="text-primary hover:underline"
                  data-testid="link-signup"
                >
                  Start your training
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-muted-foreground">
              Already training?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-primary hover:underline"
                data-testid="link-login"
              >
                Log in
              </button>
            </p>
          )}
          {mode === "magic-link" && (
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className="text-primary hover:underline"
              data-testid="link-back-login"
            >
              Back to password login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
