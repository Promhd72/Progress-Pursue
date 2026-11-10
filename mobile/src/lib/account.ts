import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "./backend";
import * as demo from "./demo";
import { deleteAccount as realDelete } from "./rapid-math.functions";

/** Account actions that work in both real (Supabase) and demo mode. */

export async function signOut() {
  if (DEMO_MODE) demo.demoSignOut();
  else await supabase.auth.signOut();
}

export async function updateProfile(id: string, patch: { name?: string; onboarding_completed?: boolean }) {
  if (DEMO_MODE) {
    demo.demoUpdateProfile(patch);
    return;
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAccount() {
  if (DEMO_MODE) {
    demo.demoDeleteAccount();
    return;
  }
  await realDelete();
  await supabase.auth.signOut();
}
