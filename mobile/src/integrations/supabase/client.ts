import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// expo-sqlite provides a persistent localStorage, which keeps users signed in
// across launches (per the Expo + Supabase guide).
export const supabase = createClient<Database>(
  SUPABASE_URL ?? "https://not-configured.supabase.co",
  SUPABASE_KEY ?? "not-configured",
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
