import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  generateLesson,
  QUESTIONS_PER_LESSON,
  PASS_THRESHOLD,
  TRACK_LABELS,
  MAX_LEVEL,
  FREE_MAX_LEVEL,
  type SkillTrack,
  type Question,
} from "@/lib/curriculum";
import { getLessonAccess, submitLesson } from "@/lib/curriculum.functions";
import { Check, X, ArrowRight, RotateCcw, Lock, Crown, Share2 } from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { AppOnly, answerHaptic, finishHaptic, isNativeApp, shareText, useIsNativeApp } from "@/lib/native";
import { NumericKeypad } from "@/components/native/NumericKeypad";
import {
  CoachingReview,
  CoachingToggle,
  TipCard,
  useCoachingPreference,
  type ReviewItem,
} from "@/components/CoachingTip";



const VALID_TRACKS: SkillTrack[] = ["addition", "subtraction", "multiplication", "division", "percentage"];

export const Route = createFileRoute("/_authenticated/lesson/$track/$level")({
  head: () => ({ meta: [{ title: "Lesson — Rapid Math" }] }),
  component: LessonPage,
});

function LessonPage() {
  const { track: trackParam, level: levelParam } = Route.useParams();
  const track = VALID_TRACKS.includes(trackParam as SkillTrack) ? (trackParam as SkillTrack) : null;
  const level = Number(levelParam);

  if (!track || !Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Lesson not found</h1>
        <Link to="/dashboard" className="mt-4 inline-block text-primary hover:underline">
          Back to curriculum
        </Link>
      </div>
    );
  }

  return <LessonGate track={track} level={level} />;
}

function LessonGate({ track, level }: { track: SkillTrack; level: number }) {
  const accessFn = useServerFn(getLessonAccess);
  const accessQ = useQuery({
    queryKey: ["lesson-access", track, level],
    queryFn: () => accessFn({ data: { track, level } }),
  });

  if (accessQ.isLoading) {
    return <div className="mx-auto max-w-2xl text-muted-foreground">Loading lesson…</div>;
  }
  if (accessQ.error || !accessQ.data) {
    return <div className="mx-auto max-w-2xl text-destructive">Failed to load lesson.</div>;
  }
  const access = accessQ.data;
  if (!access.allowed && access.reason !== "ok") {
    return <Locked reason={access.reason} track={track} level={level} />;
  }
  return <LessonRunner track={track} level={level} />;
}

function Locked({
  reason,
  track,
  level,
}: {
  reason: "locked_pro" | "locked_progression" | "daily_limit";
  track: SkillTrack;
  level: number;
}) {
  const native = useIsNativeApp();
  const title =
    reason === "locked_pro"
      ? `Level ${level} is Pro-only`
      : reason === "locked_progression"
      ? `Finish earlier levels first`
      : `You've hit today's free lesson limit`;
  const body =
    reason === "locked_pro"
      ? native
        ? `Free covers ${TRACK_LABELS[track]} Levels 1–${FREE_MAX_LEVEL}. Pro accounts unlock the rest.`
        : `Free covers ${TRACK_LABELS[track]} Levels 1–${FREE_MAX_LEVEL}. Upgrade to Pro to unlock the rest.`
      : reason === "locked_progression"
      ? `Pass the previous level (≥80%) to unlock Level ${level}.`
      : native
      ? `Free is capped at 3 lessons per day. Come back tomorrow for more.`
      : `Free is capped at 3 lessons per day. Come back tomorrow or go Pro for unlimited training.`;
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        {reason === "locked_pro" ? <Crown className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/dashboard" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          Back to curriculum
        </Link>
        {reason === "locked_pro" || reason === "daily_limit" ? (
          <UpgradeButton label="Upgrade to Pro" />
        ) : null}
      </div>
    </div>
  );
}

type Result = { correct: number; total: number; durationMs: number; xpEarned: number; passed: boolean };

function LessonRunner({ track, level }: { track: SkillTrack; level: number }) {
  const submitFn = useServerFn(submitLesson);
  const qc = useQueryClient();
  const { enabled: coaching, toggle: toggleCoaching } = useCoachingPreference();
  const [phase, setPhase] = useState<"running" | "done">("running");
  const [result, setResult] = useState<Result | null>(null);
  const [seed, setSeed] = useState(0); // bump to replay

  const questions = useMemo<Question[]>(
    () => generateLesson(track, level),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track, level, seed],
  );

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [paused, setPaused] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const startRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const native = useIsNativeApp();

  useEffect(() => {
    // In the app the on-screen keypad is used instead of the iOS keyboard.
    if (!paused && !isNativeApp()) inputRef.current?.focus();
  }, [index, paused]);

  if (phase === "done" && result) {
    return (
      <Results
        track={track}
        level={level}
        result={result}
        review={review}
        onReplay={() => {
          setIndex(0);
          setInput("");
          setCorrect(0);
          setFlash(null);
          setPaused(false);
          setReview([]);
          startRef.current = Date.now();
          submittingRef.current = false;
          setResult(null);
          setSeed((s) => s + 1);
          setPhase("running");
        }}
      />
    );
  }

  const q = questions[index];
  const progress = (index / questions.length) * 100;

  async function finish(finalCorrect: number) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const durationMs = Date.now() - startRef.current;
    try {
      const res = await submitFn({
        data: { track, level, correct: finalCorrect, total: questions.length, durationMs },
      });
      await qc.invalidateQueries();
      setResult({
        correct: finalCorrect,
        total: questions.length,
        durationMs,
        xpEarned: res.xpEarned,
        passed: res.passed,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save lesson");
      setResult({
        correct: finalCorrect,
        total: questions.length,
        durationMs,
        xpEarned: 0,
        passed: finalCorrect / questions.length >= PASS_THRESHOLD,
      });
    }
    finishHaptic();
    setPhase("done");
  }

  function advance(isOk: boolean) {
    setFlash(null);
    setPaused(false);
    setInput("");
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      void finish(correct + (isOk ? 1 : 0));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (flash || paused) return;
    const trimmed = input.trim();
    const val = trimmed === "" ? Number.NaN : Number(trimmed.replace(",", "."));
    const isOk = !Number.isNaN(val) && val === q.answer;
    setFlash(isOk ? "ok" : "bad");
    answerHaptic(isOk);
    if (isOk) setCorrect((c) => c + 1);
    setReview((r) => [
      ...r,
      { prompt: q.prompt, answer: q.answer, given: trimmed, correct: isOk, track: q.track, ops: q.ops },
    ]);

    if (coaching) {
      setPaused(true);
      return;
    }
    setTimeout(() => advance(isOk), isOk ? 280 : 700);
  }

  const lastOk = flash === "ok";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="app-flat rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {TRACK_LABELS[track]} · Level {level} · Q{index + 1}/{questions.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="tabular">{correct} correct</span>
            <CoachingToggle enabled={coaching} onToggle={() => toggleCoaching()} />
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-10 text-center">
          <div className="font-display text-6xl font-semibold tabular tracking-tight md:text-7xl">
            {q.prompt}
          </div>
          <form ref={formRef} onSubmit={submit} className="mt-10">
            <div
              className={`mx-auto inline-flex items-center gap-3 rounded-xl border-2 bg-background px-6 py-3 transition ${
                flash === "ok"
                  ? "border-success"
                  : flash === "bad"
                  ? "border-destructive"
                  : "border-primary/40"
              }`}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode={native ? "none" : "numeric"}
                readOnly={native}
                autoComplete="off"
                className="w-48 bg-transparent text-center font-display text-4xl tabular outline-none"
                placeholder="?"
                disabled={!!flash}
              />
              {flash === "ok" && <Check className="h-7 w-7 text-success" />}
              {flash === "bad" && <X className="h-7 w-7 text-destructive" />}
            </div>
            {flash === "bad" && (
              <div className="mt-3 text-sm text-muted-foreground">
                Answer: <span className="font-medium text-foreground tabular">{q.answer}</span>
              </div>
            )}
            {!paused && !native && (
              <div className="mt-6 text-xs text-muted-foreground">Press Enter to submit</div>
            )}
          </form>
          {native && !paused && (
            <NumericKeypad
              disabled={!!flash}
              onDigit={(d) => setInput((v) => (v + d).slice(0, 7))}
              onBackspace={() => setInput((v) => v.slice(0, -1))}
              onSubmit={() => formRef.current?.requestSubmit()}
            />
          )}

          {paused && (
            <div className="mt-6">
              <TipCard track={q.track} ops={q.ops} />
              <button
                type="button"
                autoFocus
                onClick={() => advance(lastOk)}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {index + 1 < questions.length ? "Next question" : "See results"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



function Results({
  track,
  level,
  result,
  review,
  onReplay,
}: {
  track: SkillTrack;
  level: number;
  result: Result;
  review: ReviewItem[];
  onReplay: () => void;
}) {

  const accuracy = Math.round((result.correct / result.total) * 100);
  const avg = (result.durationMs / result.total / 1000).toFixed(1);
  const nextLevel = Math.min(level + 1, MAX_LEVEL);
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="font-display text-sm uppercase tracking-wider text-muted-foreground">
        {TRACK_LABELS[track]} · Level {level}
      </div>
      <h1 className="mt-3 font-display text-4xl font-semibold">
        {result.passed ? "Level passed!" : "Not quite — try again."}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {result.passed
          ? `Level ${nextLevel} is now unlocked.`
          : `You need ${Math.round(PASS_THRESHOLD * 100)}% to advance.`}
      </p>
      {!result.passed && (
        <div className="mt-6 max-w-md mx-auto rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          In a meeting, this hesitation means the conversation moves on without your input. Take a breath — speed comes with practice, and you're building it right now.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Avg time" value={`${avg}s`} />
        <Stat label="XP earned" value={`+${result.xpEarned}`} accent />
      </div>

      <CoachingReview items={review} />

      <AppOnly>
        <button
          onClick={() =>
            void shareText(
              "My Rapid Math score",
              `I just hit ${accuracy}% on ${TRACK_LABELS[track]} Level ${level} in Rapid Math, averaging ${avg}s per answer. 🧠⚡`,
            )
          }
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary active:bg-primary/20"
        >
          <Share2 className="h-4 w-4" /> Share result
        </button>
      </AppOnly>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          onClick={onReplay}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-5 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        {result.passed && nextLevel !== level && (
          <Link
            to="/lesson/$track/$level"
            params={{ track, level: String(nextLevel) }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Next: Level {nextLevel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          Back to curriculum
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-5">
      <div className={`font-display text-3xl font-semibold tabular ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
