import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "./backend";
import { demoSignedIn, onDemoChange } from "./demo";

type AuthState = { signedIn: boolean; ready: boolean };

const AuthContext = createContext<AuthState>({ signedIn: false, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ signedIn: false, ready: false });

  useEffect(() => {
    if (DEMO_MODE) {
      setState({ signedIn: demoSignedIn(), ready: true });
      return onDemoChange(() => setState({ signedIn: demoSignedIn(), ready: true }));
    }

    supabase.auth
      .getSession()
      .then(({ data }) => setState({ signedIn: Boolean(data.session), ready: true }))
      .catch(() => setState({ signedIn: false, ready: true }));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ signedIn: Boolean(session), ready: true });
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
