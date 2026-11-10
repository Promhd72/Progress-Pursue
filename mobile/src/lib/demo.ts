/**
 * Demo mode: a local stand-in for Supabase so the whole app can be tried
 * before a Supabase project is connected. Data lives only on this device.
 * It follows the same rules as the database functions in
 * supabase/migrations (daily limits, Pro-only levels, progression, XP, streaks).
 */
import type { Database } from "@/integrations/supabase/types";
import { ADVANCED_QUESTIONS, toPublic } from "./advanced-questions";
import type { AdvancedDomain } from "./advanced-domains";
import {
  FREE_DAILY_LIMIT,
  computeAdvancedProgress,
  pickNextQuestion,
  type AdvancedAccess,
  type AdvancedAnswerResult,
  type AdvancedProgress,
} from "./advanced.functions";
import {
  FREE_DAILY_LESSONS,
  FREE_MAX_LEVEL,
  MAX_LEVEL,
  PASS_THRESHOLD,
  TRACKS,
  placementToLevel,
  xpForLesson,
  type SkillTrack,
} from "./curriculum";
import {
  computeSpeedStats,
  type CurriculumOverview,
  type LessonAccess,
  type LessonAttemptRow,
  type SubmitLessonResult,
  type SubmitPlacementResult,
  type TrackSpeedStat,
} from "./curriculum.functions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Progress = { current_level: number; highest_level_passed: number };
type AdvancedRow = { question_id: string; selected_index: number; is_correct: boolean; created_at: string };

type DemoDB = {
  profile: Profile | null;
  lessons: LessonAttemptRow[];
  hasPlacement: boolean;
  progress: Partial<Record<SkillTrack, Progress>>;
  advanced: AdvancedRow[];
};

const KEY = "rapidmath.demo";
const EMPTY: DemoDB = { profile: null, lessons: [], hasPlacement: false, progress: {}, advanced: [] };

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as DemoDB) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function save(db: DemoDB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Ignore.
  }
  listeners.forEach((l) => l());
}

const listeners = new Set<() => void>();
export function onDemoChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const todayUtc = () => new Date().toISOString().slice(0, 10);
const isToday = (iso: string) => iso.slice(0, 10) === todayUtc();
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function requireProfile(db: DemoDB): Profile {
  if (!db.profile) throw new Error("You're signed out. Please sign in again.");
  return db.profile;
}

/* Account ------------------------------------------------------------- */

export function demoSignedIn() {
  return Boolean(load().profile);
}

export function demoSignUp(name: string, email: string) {
  const now = new Date().toISOString();
  save({
    ...EMPTY,
    profile: {
      id: "demo-user",
      name: name || email.split("@")[0] || "Demo",
      email,
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      onboarding_completed: false,
      is_pro: false,
      pro_source: null,
      created_at: now,
      updated_at: now,
    } as Profile,
  });
}

export function demoSignOut() {
  // Keep the data so signing back in (any email) restores progress.
  const db = load();
  try {
    localStorage.setItem(KEY + ".saved", JSON.stringify(db));
  } catch {
    // Ignore.
  }
  save({ ...EMPTY });
}

export function demoSignIn(email: string) {
  try {
    const saved = localStorage.getItem(KEY + ".saved");
    if (saved) {
      save(JSON.parse(saved) as DemoDB);
      return;
    }
  } catch {
    // Fall through to a fresh profile.
  }
  demoSignUp("", email);
}

export function demoUpdateProfile(patch: Partial<Pick<Profile, "name" | "onboarding_completed">>) {
  const db = load();
  if (!db.profile) return;
  db.profile = { ...db.profile, ...patch };
  save(db);
}

export function demoDeleteAccount() {
  try {
    localStorage.removeItem(KEY + ".saved");
  } catch {
    // Ignore.
  }
  save({ ...EMPTY });
}

/* Reads --------------------------------------------------------------- */

export async function getProfile(): Promise<Profile> {
  return requireProfile(load());
}

function tracksOf(db: DemoDB) {
  return TRACKS.map((t) => ({
    track: t,
    current_level: db.progress[t]?.current_level ?? 1,
    highest_level_passed: db.progress[t]?.highest_level_passed ?? 0,
  }));
}

export async function getCurriculumOverview(): Promise<CurriculumOverview> {
  const db = load();
  const p = requireProfile(db);
  const tracks = tracksOf(db);
  const candidates = tracks.filter((t) => t.highest_level_passed < MAX_LEVEL).sort((a, b) => a.current_level - b.current_level);
  return {
    isPro: p.is_pro,
    hasPlacement: db.hasPlacement,
    lessonsUsedToday: db.lessons.filter((l) => isToday(l.created_at)).length,
    dailyLimit: p.is_pro ? null : FREE_DAILY_LESSONS,
    tracks,
    recommended: candidates[0] ? { track: candidates[0].track, level: candidates[0].current_level } : null,
  };
}

export async function getRecentLessons(opts?: { data?: unknown }): Promise<LessonAttemptRow[]> {
  const limit = Math.min((opts?.data as { limit?: number } | undefined)?.limit ?? 10, 200);
  return load().lessons.slice(0, limit);
}

export async function getTrackSpeedStats(): Promise<TrackSpeedStat[]> {
  return computeSpeedStats([...load().lessons].reverse());
}

export async function getLessonAccess(opts?: { data?: unknown }): Promise<LessonAccess> {
  const { track, level } = opts?.data as { track: SkillTrack; level: number };
  const db = load();
  const p = requireProfile(db);
  const currentLevel = db.progress[track]?.current_level ?? 1;
  const lessonsUsedToday = db.lessons.filter((l) => isToday(l.created_at)).length;
  const base = { isPro: p.is_pro, lessonsUsedToday, dailyLimit: p.is_pro ? null : FREE_DAILY_LESSONS, currentLevel };
  if (!p.is_pro && level > FREE_MAX_LEVEL) return { ...base, allowed: false, reason: "locked_pro" };
  if (level > currentLevel) return { ...base, allowed: false, reason: "locked_progression" };
  if (!p.is_pro && lessonsUsedToday >= FREE_DAILY_LESSONS) return { ...base, allowed: false, reason: "daily_limit" };
  return { ...base, allowed: true, reason: "ok" };
}

export async function getAdvancedAccess(opts?: { data?: unknown }): Promise<AdvancedAccess> {
  const domain = ((opts?.data as { domain?: AdvancedDomain | null } | undefined)?.domain ?? null) as AdvancedDomain | null;
  const db = load();
  const p = requireProfile(db);
  const todays = db.advanced.filter((a) => isToday(a.created_at));
  const usedToday = todays.length;
  if (!p.is_pro && usedToday >= FREE_DAILY_LIMIT) {
    return { isPro: false, domain, usedToday, remainingToday: 0, limit: FREE_DAILY_LIMIT, question: null, locked: true };
  }
  const q = pickNextQuestion(new Set(todays.map((a) => a.question_id)), domain ?? undefined);
  return {
    isPro: p.is_pro,
    domain,
    usedToday,
    remainingToday: p.is_pro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - usedToday),
    limit: p.is_pro ? null : FREE_DAILY_LIMIT,
    question: toPublic(q),
    locked: false,
  };
}

export async function getAdvancedProgress(): Promise<AdvancedProgress> {
  return computeAdvancedProgress(load().advanced);
}

/* Writes (same rules as the SQL functions) ---------------------------- */

function touchStreak(p: Profile, addXp: number): Profile {
  const today = todayUtc();
  let cur: number;
  if (!p.last_active_date) cur = 1;
  else {
    const gap = Math.round((Date.parse(today) - Date.parse(p.last_active_date)) / 86_400_000);
    cur = gap === 0 ? Math.max(p.current_streak, 1) : gap === 1 ? p.current_streak + 1 : 1;
  }
  return { ...p, xp: p.xp + addXp, current_streak: cur, longest_streak: Math.max(p.longest_streak, cur), last_active_date: today };
}

export async function submitLesson(opts?: { data?: unknown }): Promise<SubmitLessonResult> {
  const d = opts?.data as { track: SkillTrack; level: number; correct: number; total: number; durationMs: number };
  const db = load();
  const p = requireProfile(db);
  const usedToday = db.lessons.filter((l) => isToday(l.created_at)).length;
  if (!p.is_pro && usedToday >= FREE_DAILY_LESSONS) throw new Error("Daily lesson limit reached");
  if (!p.is_pro && d.level > FREE_MAX_LEVEL) throw new Error("This level is Pro-only");
  const prog = db.progress[d.track] ?? { current_level: 1, highest_level_passed: 0 };
  if (d.level > prog.current_level) throw new Error("Finish earlier levels first");

  const passed = d.correct / d.total >= PASS_THRESHOLD;
  const xp = xpForLesson(d.correct, d.level);
  const newHighest = passed && d.level > prog.highest_level_passed ? d.level : prog.highest_level_passed;
  const newCurrent = passed && d.level === prog.current_level && prog.current_level < MAX_LEVEL ? prog.current_level + 1 : prog.current_level;

  db.lessons = [
    {
      id: uid(),
      track: d.track,
      level: d.level,
      correct: d.correct,
      total: d.total,
      passed,
      duration_ms: d.durationMs,
      xp_earned: xp,
      created_at: new Date().toISOString(),
    },
    ...db.lessons,
  ];
  db.progress = { ...db.progress, [d.track]: { current_level: newCurrent, highest_level_passed: newHighest } };
  db.profile = touchStreak(p, xp);
  save(db);
  return { passed, xpEarned: xp, newCurrentLevel: newCurrent, newHighestPassed: newHighest };
}

export async function submitPlacement(opts?: { data?: unknown }): Promise<SubmitPlacementResult> {
  const d = opts?.data as { perSkill: Record<SkillTrack, { score: number; max: number }> };
  const db = load();
  requireProfile(db);
  const startingLevels = {} as Record<SkillTrack, number>;
  for (const t of TRACKS) {
    const e = d.perSkill[t];
    const lvl = e ? placementToLevel(e.score, e.max) : 1;
    startingLevels[t] = lvl;
    const prev = db.progress[t] ?? { current_level: 1, highest_level_passed: 0 };
    db.progress = { ...db.progress, [t]: { ...prev, current_level: Math.max(prev.current_level, lvl) } };
  }
  db.hasPlacement = true;
  save(db);
  return { startingLevels };
}

export async function submitAdvancedAnswer(opts?: { data?: unknown }): Promise<AdvancedAnswerResult> {
  const d = opts?.data as { questionId: string; selectedIndex: number };
  const q = ADVANCED_QUESTIONS.find((x) => x.id === d.questionId);
  if (!q) throw new Error("Unknown question");
  const db = load();
  const p = requireProfile(db);
  const usedToday = db.advanced.filter((a) => isToday(a.created_at)).length;
  if (!p.is_pro && usedToday >= FREE_DAILY_LIMIT) throw new Error("Daily Advanced limit reached");
  const correct = d.selectedIndex === q.correctIndex;
  db.advanced = [
    { question_id: q.id, selected_index: d.selectedIndex, is_correct: correct, created_at: new Date().toISOString() },
    ...db.advanced,
  ];
  if (correct) db.profile = { ...p, xp: p.xp + 8 };
  save(db);
  return {
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    steps: q.steps,
    technique: q.technique,
    remainingToday: p.is_pro ? null : Math.max(0, FREE_DAILY_LIMIT - (usedToday + 1)),
    isPro: p.is_pro,
  };
}
