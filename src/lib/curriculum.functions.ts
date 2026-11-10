import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveIsPro } from "./plan";
import {
  TRACKS,
  MAX_LEVEL,
  FREE_MAX_LEVEL,
  FREE_DAILY_LESSONS,
  PASS_THRESHOLD,
  placementToLevel,
  xpForLesson,
  type SkillTrack,
} from "./curriculum";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

export type TrackProgressRow = {
  track: SkillTrack;
  current_level: number;
  highest_level_passed: number;
};

export type CurriculumOverview = {
  isPro: boolean;
  hasPlacement: boolean;
  lessonsUsedToday: number;
  dailyLimit: number | null; // null = unlimited
  tracks: TrackProgressRow[];
  recommended: { track: SkillTrack; level: number } | null;
};

export const getCurriculumOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CurriculumOverview> => {
    const { supabase, userId } = context;

    const [profileRes, placementRes, progressRes, todayRes] = await Promise.all([
      supabase.from("profiles").select("is_pro, preview_plan").eq("id", userId).maybeSingle(),
      supabase
        .from("placement_results")
        .select("id")
        .eq("user_id", userId)
        .limit(1),
      supabase
        .from("track_progress")
        .select("track, current_level, highest_level_passed")
        .eq("user_id", userId),
      supabase
        .from("lesson_attempts")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", startOfUtcDayIso()),
    ]);

    const isPro = resolveIsPro(profileRes.data);
    const hasPlacement = (placementRes.data?.length ?? 0) > 0;
    const lessonsUsedToday = todayRes.data?.length ?? 0;

    const existing = new Map<SkillTrack, TrackProgressRow>();
    for (const r of progressRes.data ?? []) {
      existing.set(r.track as SkillTrack, {
        track: r.track as SkillTrack,
        current_level: r.current_level,
        highest_level_passed: r.highest_level_passed,
      });
    }
    const tracks: TrackProgressRow[] = TRACKS.map(
      (t) => existing.get(t) ?? { track: t, current_level: 1, highest_level_passed: 0 },
    );

    // Recommend the lowest current_level among tracks not yet finished.
    const candidates = tracks.filter((t) => t.highest_level_passed < MAX_LEVEL);
    candidates.sort((a, b) => a.current_level - b.current_level);
    const recommended = candidates[0]
      ? { track: candidates[0].track, level: candidates[0].current_level }
      : null;

    return {
      isPro,
      hasPlacement,
      lessonsUsedToday,
      dailyLimit: isPro ? null : FREE_DAILY_LESSONS,
      tracks,
      recommended,
    };
  });

export type LessonAttemptRow = {
  id: string;
  track: SkillTrack;
  level: number;
  correct: number;
  total: number;
  passed: boolean;
  duration_ms: number;
  xp_earned: number;
  created_at: string;
};

export const getRecentLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number } | undefined) => ({ limit: Math.min(d?.limit ?? 10, 200) }))
  .handler(async ({ data, context }): Promise<LessonAttemptRow[]> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("lesson_attempts")
      .select("id, track, level, correct, total, passed, duration_ms, xp_earned, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []) as LessonAttemptRow[];
  });

const PlacementSchema = z.object({
  perSkill: z.record(
    z.enum(["addition", "subtraction", "multiplication", "division", "percentage"]),
    z.object({ score: z.number().int().min(0).max(20), max: z.number().int().min(1).max(20) }),
  ),
  totalCorrect: z.number().int().min(0).max(50),
  total: z.number().int().min(1).max(50),
});

export type SubmitPlacementResult = {
  startingLevels: Record<SkillTrack, number>;
};

export const submitPlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlacementSchema.parse(d))
  .handler(async ({ data, context }): Promise<SubmitPlacementResult> => {
    const { supabase, userId } = context;

    const startingLevels = {} as Record<SkillTrack, number>;
    for (const track of TRACKS) {
      const entry = data.perSkill[track];
      const lvl = entry ? placementToLevel(entry.score, entry.max) : 1;
      startingLevels[track] = lvl;
    }

    const { error: insErr } = await supabase.from("placement_results").insert({
      user_id: userId,
      score: data.totalCorrect,
      total: data.total,
      per_skill: data.perSkill,
    });
    if (insErr) throw new Error(insErr.message);

    // Upsert track_progress for each track. current_level = max(existing, placement).
    const { data: existing } = await supabase
      .from("track_progress")
      .select("track, current_level")
      .eq("user_id", userId);
    const existingMap = new Map<string, number>(
      (existing ?? []).map((r) => [r.track, r.current_level]),
    );

    for (const track of TRACKS) {
      const placed = startingLevels[track];
      const current = existingMap.get(track) ?? 1;
      const next = Math.max(current, placed);
      const { error } = await supabase
        .from("track_progress")
        .upsert(
          { user_id: userId, track, current_level: next },
          { onConflict: "user_id,track" },
        );
      if (error) throw new Error(error.message);
    }

    return { startingLevels };
  });

const LessonAccessSchema = z.object({
  track: z.enum(["addition", "subtraction", "multiplication", "division", "percentage"]),
  level: z.number().int().min(1).max(MAX_LEVEL),
});

export type LessonAccess = {
  allowed: boolean;
  reason: "ok" | "locked_pro" | "locked_progression" | "daily_limit";
  isPro: boolean;
  lessonsUsedToday: number;
  dailyLimit: number | null;
  currentLevel: number;
};

export const getLessonAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LessonAccessSchema.parse(d))
  .handler(async ({ data, context }): Promise<LessonAccess> => {
    const { supabase, userId } = context;

    const [profileRes, progressRes, todayRes] = await Promise.all([
      supabase.from("profiles").select("is_pro, preview_plan").eq("id", userId).maybeSingle(),
      supabase
        .from("track_progress")
        .select("current_level")
        .eq("user_id", userId)
        .eq("track", data.track)
        .maybeSingle(),
      supabase
        .from("lesson_attempts")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", startOfUtcDayIso()),
    ]);

    const isPro = resolveIsPro(profileRes.data);
    const currentLevel = progressRes.data?.current_level ?? 1;
    const lessonsUsedToday = todayRes.data?.length ?? 0;
    const dailyLimit = isPro ? null : FREE_DAILY_LESSONS;

    if (!isPro && data.level > FREE_MAX_LEVEL) {
      return { allowed: false, reason: "locked_pro", isPro, lessonsUsedToday, dailyLimit, currentLevel };
    }
    if (data.level > currentLevel) {
      return { allowed: false, reason: "locked_progression", isPro, lessonsUsedToday, dailyLimit, currentLevel };
    }
    if (!isPro && lessonsUsedToday >= FREE_DAILY_LESSONS) {
      return { allowed: false, reason: "daily_limit", isPro, lessonsUsedToday, dailyLimit, currentLevel };
    }
    return { allowed: true, reason: "ok", isPro, lessonsUsedToday, dailyLimit, currentLevel };
  });

const SubmitLessonSchema = z.object({
  track: z.enum(["addition", "subtraction", "multiplication", "division", "percentage"]),
  level: z.number().int().min(1).max(MAX_LEVEL),
  correct: z.number().int().min(0).max(50),
  total: z.number().int().min(1).max(50),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000),
});

export type SubmitLessonResult = {
  passed: boolean;
  xpEarned: number;
  newCurrentLevel: number;
  newHighestPassed: number;
};

export const submitLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitLessonSchema.parse(d))
  .handler(async ({ data, context }): Promise<SubmitLessonResult> => {
    const { supabase, userId } = context;

    // Re-check daily limit & pro gate before recording (defense in depth)
    const [profileRes, todayRes, progressRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_pro, preview_plan, xp, current_streak, longest_streak, last_active_date")
        .eq("id", userId)
        .single(),
      supabase
        .from("lesson_attempts")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", startOfUtcDayIso()),
      supabase
        .from("track_progress")
        .select("current_level, highest_level_passed")
        .eq("user_id", userId)
        .eq("track", data.track)
        .maybeSingle(),
    ]);
    const profile = profileRes.data!;
    const isPro = resolveIsPro(profile);
    const usedToday = todayRes.data?.length ?? 0;
    if (!isPro && usedToday >= FREE_DAILY_LESSONS) {
      throw new Error("Daily lesson limit reached. Upgrade to Pro for unlimited.");
    }
    if (!isPro && data.level > FREE_MAX_LEVEL) {
      throw new Error("This level is Pro-only.");
    }

    const passed = data.correct / data.total >= PASS_THRESHOLD;
    const xp = xpForLesson(data.correct, data.level);

    const { error: insErr } = await supabase.from("lesson_attempts").insert({
      user_id: userId,
      track: data.track,
      level: data.level,
      correct: data.correct,
      total: data.total,
      passed,
      duration_ms: data.durationMs,
      xp_earned: xp,
    });
    if (insErr) throw new Error(insErr.message);

    // Advance track progress
    const currentLevel = progressRes.data?.current_level ?? 1;
    const highest = progressRes.data?.highest_level_passed ?? 0;
    const newHighest = passed && data.level > highest ? data.level : highest;
    const newCurrent = passed && data.level === currentLevel && currentLevel < MAX_LEVEL
      ? currentLevel + 1
      : currentLevel;

    const { error: upErr } = await supabase
      .from("track_progress")
      .upsert(
        {
          user_id: userId,
          track: data.track,
          current_level: newCurrent,
          highest_level_passed: newHighest,
        },
        { onConflict: "user_id,track" },
      );
    if (upErr) throw new Error(upErr.message);

    // Update profile XP + streak
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

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        xp: (profile.xp ?? 0) + xp,
        current_streak: current,
        longest_streak: longest,
        last_active_date: todayUtc,
      })
      .eq("id", userId);
    if (pErr) throw new Error(pErr.message);

    return { passed, xpEarned: xp, newCurrentLevel: newCurrent, newHighestPassed: newHighest };
  });

export type TrackSpeedStat = {
  track: SkillTrack;
  attempts: number;
  latestAvgMs: number;
  overallAvgMs: number;
  bestAvgMs: number;
  baselineAvgMs: number | null;
  deltaMs: number | null;
  deltaPct: number | null;
  trend: number[];
};


export const getTrackSpeedStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TrackSpeedStat[]> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("lesson_attempts")
      .select("track, total, duration_ms, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const byTrack = new Map<SkillTrack, number[]>();
    for (const r of rows ?? []) {
      if (!r.total || r.total <= 0) continue;
      const avg = r.duration_ms / r.total;
      const arr = byTrack.get(r.track as SkillTrack) ?? [];
      arr.push(avg);
      byTrack.set(r.track as SkillTrack, arr);
    }

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const out: TrackSpeedStat[] = [];
    for (const [track, avgs] of byTrack.entries()) {
      const n = avgs.length;
      if (n === 0) continue;
      const window = Math.min(3, Math.floor(n / 2)) || 1;
      const latestAvgMs = mean(avgs.slice(-window));
      let baselineAvgMs: number | null = null;
      let deltaMs: number | null = null;
      let deltaPct: number | null = null;
      if (n >= 2) {
        const baseWindow = Math.min(3, Math.floor(n / 2)) || 1;
        baselineAvgMs = mean(avgs.slice(0, baseWindow));
        deltaMs = baselineAvgMs - latestAvgMs;
        deltaPct = baselineAvgMs > 0 ? deltaMs / baselineAvgMs : null;
      }
      out.push({
        track,
        attempts: n,
        latestAvgMs,
        overallAvgMs: mean(avgs),
        bestAvgMs: Math.min(...avgs),
        baselineAvgMs,

        deltaMs,
        deltaPct,
        trend: avgs.slice(-12),
      });
    }
    out.sort((a, b) => b.attempts - a.attempts);
    return out;
  });
