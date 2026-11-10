import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; ready: boolean };

const AuthContext = createContext<AuthState>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false });

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session, ready: true }))
      .catch(() => setState({ session: null, ready: true }));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, ready: true });
    });

    // Only refresh tokens while the app is in the foreground (Supabase guidance for RN).
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      sub.subscription.unsubscribe();
      appState.remove();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
