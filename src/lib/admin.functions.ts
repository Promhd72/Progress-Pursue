import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("preview_plan, is_pro")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      isAdmin: Boolean(data),
      previewPlan: (profile?.preview_plan ?? "off") as "off" | "free" | "pro",
      realIsPro: Boolean(profile?.is_pro),
    };
  });

export const setPreviewPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ plan: z.enum(["off", "free", "pro"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { error } = await context.supabase
      .from("profiles")
      .update({ preview_plan: data.plan })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const, plan: data.plan };
  });

/* ------------------------------ coupons ------------------------------ */

export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as Ctx);
    const [{ data: coupons, error }, { data: redemptions }] = await Promise.all([
      context.supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      context.supabase.from("coupon_redemptions").select("coupon_id, user_id, created_at"),
    ]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const r of redemptions ?? []) counts.set(r.coupon_id, (counts.get(r.coupon_id) ?? 0) + 1);
    return (coupons ?? []).map((c: any) => ({ ...c, redemptions: counts.get(c.id) ?? 0 }));
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().min(3).max(64),
        description: z.string().trim().max(200).default(""),
        maxRedemptions: z.number().int().min(1).max(100000).nullable().optional(),
        expiresAt: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { error } = await context.supabase.from("coupons").insert({
      code: data.code.toLowerCase().replace(/\s+/g, ""),
      description: data.description ?? "",
      grants_pro: true,
      max_redemptions: data.maxRedemptions ?? null,
      expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      created_by: context.userId,
    });
    if (error) {
      if (error.code === "23505") return { ok: false as const, message: "That code already exists." };
      throw new Error(error.message);
    }
    return { ok: true as const, message: "Coupon created." };
  });

export const updateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { error } = await context.supabase
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ------------------------------- users ------------------------------- */

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ search: z.string().trim().max(120).default(""), limit: z.number().int().min(1).max(200).default(100) })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    let q = context.supabase
      .from("profiles")
      .select("id, name, email, xp, current_streak, longest_streak, last_active_date, is_pro, pro_source, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.search) q = q.or(`name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const uid = data.userId;
    const [profile, placement, progress, lessons, advanced, subs] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      context.supabase
        .from("placement_results")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1),
      context.supabase.from("track_progress").select("*").eq("user_id", uid),
      context.supabase
        .from("lesson_attempts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("advanced_attempts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
    ]);

    const lessonRows = lessons.data ?? [];
    const totalQ = lessonRows.reduce((s: number, r: any) => s + r.total, 0);
    const totalC = lessonRows.reduce((s: number, r: any) => s + r.correct, 0);
    const totalMs = lessonRows.reduce((s: number, r: any) => s + r.duration_ms, 0);

    return {
      profile: profile.data,
      placement: placement.data?.[0] ?? null,
      progress: progress.data ?? [],
      lessons: lessonRows,
      advanced: advanced.data ?? [],
      subscriptions: subs.data ?? [],
      stats: {
        lessonsCompleted: lessonRows.length,
        lessonsPassed: lessonRows.filter((r: any) => r.passed).length,
        accuracy: totalQ ? Math.round((totalC / totalQ) * 100) : 0,
        avgMsPerQuestion: totalQ ? Math.round(totalMs / totalQ) : 0,
      },
    };
  });

/* ------------------------------ metrics ------------------------------ */

function daysAgoIso(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as Ctx);

    const [profilesRes, lessonsRes, advancedRes, placementRes, subsRes, redemptionsRes] =
      await Promise.all([
        context.supabase.from("profiles").select("id, is_pro, pro_source, created_at, last_active_date, xp"),
        context.supabase.from("lesson_attempts").select("correct, total, duration_ms, passed, created_at"),
        context.supabase.from("advanced_attempts").select("is_correct, created_at"),
        context.supabase.from("placement_results").select("id, created_at"),
        context.supabase.from("subscriptions").select("*"),
        context.supabase.from("coupon_redemptions").select("id, created_at"),
      ]);

    const profiles = profilesRes.data ?? [];
    const lessons = lessonsRes.data ?? [];
    const advanced = advancedRes.data ?? [];
    const subs = subsRes.data ?? [];

    const today = new Date().toISOString().slice(0, 10);
    const d7 = daysAgoIso(7).slice(0, 10);
    const d30 = daysAgoIso(30).slice(0, 10);

    const totalUsers = profiles.length;
    const proUsers = profiles.filter((p: any) => p.is_pro).length;
    const paidUsers = profiles.filter((p: any) => p.is_pro && p.pro_source === "paid").length;
    const couponUsers = profiles.filter((p: any) => p.is_pro && p.pro_source === "coupon").length;

    const activeToday = profiles.filter((p: any) => p.last_active_date === today).length;
    const active7 = profiles.filter((p: any) => p.last_active_date && p.last_active_date >= d7).length;
    const active30 = profiles.filter((p: any) => p.last_active_date && p.last_active_date >= d30).length;

    const activeSubs = subs.filter((s: any) => ["active", "trialing", "past_due"].includes(s.status));
    const mrrCents = activeSubs.reduce((sum: number, s: any) => sum + (s.amount_cents ?? 0), 0);
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const newSubsThisMonth = subs.filter((s: any) => s.created_at >= monthStart.toISOString()).length;
    const churnedThisMonth = subs.filter(
      (s: any) => s.status === "canceled" && s.updated_at >= monthStart.toISOString(),
    ).length;

    const totalQ = lessons.reduce((s: number, r: any) => s + r.total, 0);
    const totalC = lessons.reduce((s: number, r: any) => s + r.correct, 0);
    const totalMs = lessons.reduce((s: number, r: any) => s + r.duration_ms, 0);

    // 30-day signup + revenue trend
    const trend: { date: string; signups: number; newSubs: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      trend.push({
        date: day,
        signups: profiles.filter((p: any) => String(p.created_at).slice(0, 10) === day).length,
        newSubs: subs.filter((s: any) => String(s.created_at).slice(0, 10) === day).length,
      });
    }

    return {
      users: {
        total: totalUsers,
        pro: proUsers,
        paid: paidUsers,
        coupon: couponUsers,
        conversionRate: totalUsers ? Math.round((proUsers / totalUsers) * 1000) / 10 : 0,
        activeToday,
        active7,
        active30,
        newLast7: profiles.filter((p: any) => p.created_at >= daysAgoIso(7)).length,
      },
      revenue: {
        mrrCents,
        arrCents: mrrCents * 12,
        activeSubscriptions: activeSubs.length,
        newSubsThisMonth,
        churnedThisMonth,
      },
      engagement: {
        lessonsCompleted: lessons.length,
        lessonsPassed: lessons.filter((r: any) => r.passed).length,
        questionsAnswered: totalQ,
        accuracy: totalQ ? Math.round((totalC / totalQ) * 100) : 0,
        avgMsPerQuestion: totalQ ? Math.round(totalMs / totalQ) : 0,
        advancedAttempts: advanced.length,
        advancedAccuracy: advanced.length
          ? Math.round((advanced.filter((a: any) => a.is_correct).length / advanced.length) * 100)
          : 0,
        placementTests: placementRes.data?.length ?? 0,
        couponRedemptions: redemptionsRes.data?.length ?? 0,
      },
      trend,
    };
  });
