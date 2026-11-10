import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubmitSchema = z.object({
  type: z.enum(["addition", "subtraction", "multiplication", "division", "percentage", "mixed"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  totalQuestions: z.number().int().min(1).max(500),
  correct: z.number().int().min(0).max(500),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000),
});

export const redeemCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const normalized = data.code.trim().toLowerCase().replace(/\s+/g, "");
    // Coupons are admin-managed (not readable under user RLS), so validate with
    // the service client after the caller has been authenticated.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("id, active, expires_at, max_redemptions, grants_pro")
      .eq("code", normalized)
      .maybeSingle();

    if (!coupon || !coupon.active) {
      return { ok: false as const, message: "Invalid coupon code." };
    }
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return { ok: false as const, message: "This coupon has expired." };
    }

    const { data: existing } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      return { ok: false as const, message: "You've already used this code." };
    }

    if (coupon.max_redemptions != null) {
      const { count } = await supabaseAdmin
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);
      if ((count ?? 0) >= coupon.max_redemptions) {
        return { ok: false as const, message: "This coupon has reached its limit." };
      }
    }

    const { error: rErr } = await supabaseAdmin
      .from("coupon_redemptions")
      .insert({ coupon_id: coupon.id, user_id: userId });
    if (rErr) throw new Error(rErr.message);

    if (coupon.grants_pro) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: true, pro_source: "coupon" })
        .eq("id", userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const, message: "Pro unlocked. Enjoy unlimited drills!" };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      // trigger sometimes lags; insert a minimal profile
      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert({ id: userId, name: "", email: "" })
        .select("*")
        .single();
      if (insErr) throw new Error(insErr.message);
      return created;
    }
    return data;
  });

export const getRecentSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number }) => ({ limit: Math.min(d?.limit ?? 5, 100) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("drill_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getAllSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("drill_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

function diffMultiplier(d: "easy" | "medium" | "hard") {
  return d === "easy" ? 1 : d === "medium" ? 2 : 3;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

export const submitSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const xpEarned = data.correct * diffMultiplier(data.difficulty);
    const avg = Math.round(data.durationMs / Math.max(1, data.totalQuestions));

    const { error: sErr } = await supabase.from("drill_sessions").insert({
      user_id: userId,
      type: data.type,
      difficulty: data.difficulty,
      total_questions: data.totalQuestions,
      correct: data.correct,
      duration_ms: data.durationMs,
      avg_ms_per_question: avg,
      xp_earned: xpEarned,
    });
    if (sErr) throw new Error(sErr.message);

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("xp, current_streak, longest_streak, last_active_date")
      .eq("id", userId)
      .single();
    if (pErr) throw new Error(pErr.message);

    const todayUtc = new Date().toISOString().slice(0, 10);
    let current = profile.current_streak ?? 0;
    let longest = profile.longest_streak ?? 0;
    const last = profile.last_active_date as string | null;

    if (!last) current = 1;
    else {
      const gap = daysBetween(last, todayUtc);
      if (gap === 0) current = Math.max(current, 1);
      else if (gap === 1) current = current + 1;
      else current = 1;
    }
    if (current > longest) longest = current;

    const newXp = (profile.xp ?? 0) + xpEarned;

    const { data: updated, error: uErr } = await supabase
      .from("profiles")
      .update({
        xp: newXp,
        current_streak: current,
        longest_streak: longest,
        last_active_date: todayUtc,
      })
      .eq("id", userId)
      .select("*")
      .single();
    if (uErr) throw new Error(uErr.message);

    return { profile: updated, xpEarned };
  });
