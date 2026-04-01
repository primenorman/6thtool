import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  position: string | null;
  levelOfPlay: string | null;
  currentXp: number;
  currentLevel: string;
  currentStreak: number;
  lastPracticeDate: string | null;
  onboardingCompleted: boolean;
  quizResults: Record<string, unknown> | null;
  createdAt: string;
}

interface AuthState {
  supabaseUser: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}

async function fetchProfile(token: string): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/auth/user", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    profile: null,
    session: null,
    isLoading: true,
  });

  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({ supabaseUser: null, profile: null, session: null, isLoading: false });
      return;
    }
    const profile = await fetchProfile(session.access_token);
    setState({
      supabaseUser: session.user,
      profile,
      session,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setState({ supabaseUser: null, profile: null, session: null, isLoading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.session) {
      const profile = await fetchProfile(state.session.access_token);
      setState((prev) => ({ ...prev, profile }));
    }
  }, [state.session]);

  return {
    user: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: !!state.supabaseUser,
    isAdmin: state.profile?.isAdmin ?? false,
    session: state.session,
    logout,
    refreshProfile,
    isLoggingOut: false,
  };
}
