import { serverFn, rpc } from "./api";
import { z } from "zod";
import { resolveIsPro } from "./plan";
import {
  TRACKS,
  MAX_LEVEL,
  starsFor,
  FREE_MAX_LEVEL,
  FREE_DAILY_LESSONS,
  type SkillTrack,
} from "./curriculum";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
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

export const getCurriculumOverview = serverFn()
  .handler(async ({ context }): Promise<CurriculumOverview> => {
    const { supabase, userId } = context;

    const [profileRes, placementRes, progressRes, todayRes] = await Promise.all([
      supabase.from("profiles").select("is_pro").eq("id", userId).maybeSingle(),
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

export const getRecentLessons = serverFn()
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

export const submitPlacement = serverFn()
  .inputValidator((d: unknown) => PlacementSchema.parse(d))
  .handler(async ({ data }): Promise<SubmitPlacementResult> =>
    rpc<SubmitPlacementResult>("submit_placement", {
      p_per_skill: data.perSkill,
      p_total_correct: data.totalCorrect,
      p_total: data.total,
    }),
  );

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

export const getLessonAccess = serverFn()
  .inputValidator((d: unknown) => LessonAccessSchema.parse(d))
  .handler(async ({ data, context }): Promise<LessonAccess> => {
    const { supabase, userId } = context;

    const [profileRes, progressRes, todayRes] = await Promise.all([
      supabase.from("profiles").select("is_pro").eq("id", userId).maybeSingle(),
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

export const submitLesson = serverFn()
  .inputValidator((d: unknown) => SubmitLessonSchema.parse(d))
  .handler(async ({ data }): Promise<SubmitLessonResult> =>
    rpc<SubmitLessonResult>("submit_lesson", {
      p_track: data.track,
      p_level: data.level,
      p_correct: data.correct,
      p_total: data.total,
      p_duration_ms: data.durationMs,
    }),
  );

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


export const getTrackSpeedStats = serverFn()
  .handler(async ({ context }): Promise<TrackSpeedStat[]> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("lesson_attempts")
      .select("track, total, duration_ms, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return computeSpeedStats(rows ?? []);
  });

/** Speed per track from lesson rows (oldest first). Shared with demo mode. */
export function computeSpeedStats(
  rows: { track: string; total: number; duration_ms: number }[],
): TrackSpeedStat[] {
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
}


export type LevelStat = { stars: number; bestAvgSec: number | null; attempts: number; passed: boolean };
export type LevelStats = Record<string, LevelStat>; // key: `${track}-${level}`

/** Best stars and speed per level, from lesson history. Shared with demo mode. */
export function computeLevelStats(
  rows: { track: string; level: number; passed: boolean; total: number; duration_ms: number }[],
): LevelStats {
  const out: LevelStats = {};
  for (const r of rows) {
    const key = `${r.track}-${r.level}`;
    const cur = out[key] ?? { stars: 0, bestAvgSec: null, attempts: 0, passed: false };
    const avg = r.total > 0 ? r.duration_ms / r.total / 1000 : null;
    cur.attempts += 1;
    cur.passed = cur.passed || r.passed;
    if (r.passed && avg !== null) {
      cur.stars = Math.max(cur.stars, starsFor(r.track as SkillTrack, r.level, true, avg));
      cur.bestAvgSec = cur.bestAvgSec === null ? avg : Math.min(cur.bestAvgSec, avg);
    }
    out[key] = cur;
  }
  return out;
}

export const getLevelStats = serverFn().handler(async ({ context }): Promise<LevelStats> => {
  const { supabase, userId } = context;
  const { data: rows, error } = await supabase
    .from("lesson_attempts")
    .select("track, level, passed, total, duration_ms")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return computeLevelStats(rows ?? []);
});
