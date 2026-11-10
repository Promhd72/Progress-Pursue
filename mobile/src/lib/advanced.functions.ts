import { serverFn, rpc } from "./api";
import { z } from "zod";
import { resolveIsPro } from "./plan";
import { ADVANCED_QUESTIONS, toPublic, type PublicAdvancedQuestion } from "./advanced-questions";
import { ADVANCED_DOMAINS, type AdvancedDomain } from "./advanced-domains";

export const FREE_DAILY_LIMIT = 3;

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function pickNextQuestion(seenIds: Set<string>, domain?: AdvancedDomain) {
  const scoped = domain
    ? ADVANCED_QUESTIONS.filter((q) => q.domain === domain)
    : ADVANCED_QUESTIONS;
  const base = scoped.length > 0 ? scoped : ADVANCED_QUESTIONS;
  const unseen = base.filter((q) => !seenIds.has(q.id));
  const pool = unseen.length > 0 ? unseen : base;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type AdvancedAccess = {
  isPro: boolean;
  domain: AdvancedDomain | null;
  usedToday: number;
  remainingToday: number; // Infinity for pro is represented as null
  limit: number | null;   // null means unlimited
  question: PublicAdvancedQuestion | null;
  locked: boolean;
};

const AccessSchema = z.object({
  domain: z.enum(ADVANCED_DOMAINS).nullish(),
});

export const getAdvancedAccess = serverFn()
  .inputValidator((d: unknown) => AccessSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<AdvancedAccess> => {
    const domain = (data?.domain ?? null) as AdvancedDomain | null;
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", userId)
      .maybeSingle();
    const isPro = resolveIsPro(profile);

    const { data: todays } = await supabase
      .from("advanced_attempts")
      .select("question_id")
      .eq("user_id", userId)
      .gte("created_at", startOfUtcDayIso());

    const usedToday = todays?.length ?? 0;
    const seen = new Set((todays ?? []).map((r) => r.question_id));

    if (!isPro && usedToday >= FREE_DAILY_LIMIT) {
      return {
        isPro: false,
        domain,
        usedToday,
        remainingToday: 0,
        limit: FREE_DAILY_LIMIT,
        question: null,
        locked: true,
      };
    }

    const q = pickNextQuestion(seen, domain ?? undefined);
    return {
      isPro,
      domain,
      usedToday,
      remainingToday: isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - usedToday),
      limit: isPro ? null : FREE_DAILY_LIMIT,
      question: toPublic(q),
      locked: false,
    };
  });

const SubmitSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(10),
});

export type AdvancedAnswerResult = {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  steps: string[];
  technique?: string;
  remainingToday: number | null; // null = unlimited
  isPro: boolean;
};

export const submitAdvancedAnswer = serverFn()
  .inputValidator((d: unknown) => SubmitSchema.parse(d))
  .handler(async ({ data }): Promise<AdvancedAnswerResult> => {
    const q = ADVANCED_QUESTIONS.find((x) => x.id === data.questionId);
    if (!q) throw new Error("Unknown question");
    const isCorrect = data.selectedIndex === q.correctIndex;

    // The database enforces the daily cap and awards XP.
    const res = await rpc<{ isPro: boolean; remainingToday: number | null }>(
      "submit_advanced_attempt",
      { p_question_id: q.id, p_selected_index: data.selectedIndex, p_is_correct: isCorrect },
    );

    return {
      correct: isCorrect,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      steps: q.steps,
      technique: q.technique,
      remainingToday: res.remainingToday,
      isPro: res.isPro,
    };
  });


export type AdvancedDomainProgress = {
  domain: AdvancedDomain;
  total: number;
  mastered: number;
  attempts: number;
  correct: number;
  accuracy: number | null;
};

export type AdvancedProgress = {
  byDomain: Record<AdvancedDomain, AdvancedDomainProgress>;
  overall: Omit<AdvancedDomainProgress, "domain">;
};

export const getAdvancedProgress = serverFn()
  .handler(async ({ context }): Promise<AdvancedProgress> => {
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("advanced_attempts")
      .select("question_id, is_correct")
      .eq("user_id", userId);

    return computeAdvancedProgress(rows ?? []);
  });

/** Mastery per domain from attempt rows. Shared with demo mode. */
export function computeAdvancedProgress(
  rows: { question_id: string; is_correct: boolean }[],
): AdvancedProgress {
  const byId = new Map(ADVANCED_QUESTIONS.map((q) => [q.id, q]));
  const byDomain = {} as Record<AdvancedDomain, AdvancedDomainProgress>;
  for (const d of ADVANCED_DOMAINS) {
    byDomain[d] = {
      domain: d,
      total: ADVANCED_QUESTIONS.filter((q) => q.domain === d).length,
      mastered: 0,
      attempts: 0,
      correct: 0,
      accuracy: null,
    };
  }

  const masteredIds = new Set<string>();
  for (const r of rows) {
    const q = byId.get(r.question_id);
    if (!q) continue;
    const slot = byDomain[q.domain];
    slot.attempts += 1;
    if (r.is_correct) {
      slot.correct += 1;
      if (!masteredIds.has(q.id)) {
        masteredIds.add(q.id);
        slot.mastered += 1;
      }
    }
  }

  let attempts = 0;
  let correct = 0;
  for (const d of ADVANCED_DOMAINS) {
    const s = byDomain[d];
    s.accuracy = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : null;
    attempts += s.attempts;
    correct += s.correct;
  }

  return {
    byDomain,
    overall: {
      total: ADVANCED_QUESTIONS.length,
      mastered: masteredIds.size,
      attempts,
      correct,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
    },
  };
}

