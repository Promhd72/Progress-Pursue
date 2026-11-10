import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { buildPlacement, PLACEMENT_LENGTH, TRACK_LABELS, TRACKS, type PlacementQuestion, type SkillTrack } from "@/lib/curriculum";
import { submitPlacement } from "@/lib/curriculum.functions";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { CoachingReview, type ReviewItem } from "@/components/CoachingTip";
import { answerHaptic } from "@/lib/native";

export const Route = createFileRoute("/_authenticated/placement")({
  head: () => ({ meta: [{ title: "Placement test — Rapid Math" }] }),
  component: PlacementPage,
});

type Phase = "intro" | "running" | "done";


function PlacementPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [results, setResults] = useState<Record<SkillTrack, number> | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);

  return (
    <div className="mx-auto max-w-2xl">
      {phase === "intro" && <Intro onStart={() => setPhase("running")} />}
      {phase === "running" && (
        <Runner
          onDone={(levels, items) => {
            setResults(levels);
            setReview(items);
            setPhase("done");
          }}
        />
      )}
      {phase === "done" && results && <Done startingLevels={results} review={review} />}
    </div>
  );
}


function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        <Sparkles className="h-3 w-3" /> Placement
      </div>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        Let's find your starting point
      </h1>
      <p className="mt-2 text-muted-foreground">
        {PLACEMENT_LENGTH} quick questions across addition, subtraction, multiplication,
        division and percentages. We'll use your accuracy to set a starting level
        on each track — no guessing where to begin.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        <li>• Type your answer, press Enter.</li>
        <li>• If you don't know, leave it blank and submit — skips count as wrong.</li>
        <li>• You can retake the placement anytime from your profile.</li>
      </ul>
      <button
        onClick={onStart}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Start placement <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Runner({
  onDone,
}: {
  onDone: (startingLevels: Record<SkillTrack, number>, review: ReviewItem[]) => void;
}) {

  const submitFn = useServerFn(submitPlacement);
  const qc = useQueryClient();

  const questions = useMemo<PlacementQuestion[]>(() => buildPlacement(), []);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [perSkill, setPerSkill] = useState<Record<SkillTrack, { score: number; max: number }>>(() => {
    const init = {} as Record<SkillTrack, { score: number; max: number }>;
    for (const t of TRACKS) init[t] = { score: 0, max: 0 };
    for (const q of questions) init[q.track].max += q.weight;
    return init;
  });
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [review, setReview] = useState<ReviewItem[]>([]);

  const submittingRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const q = questions[index];
  const progress = (index / questions.length) * 100;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (flash) return;
    const trimmed = input.trim();
    const val = trimmed === "" ? Number.NaN : Number(trimmed.replace(",", "."));
    const isOk = !Number.isNaN(val) && val === q.answer;
    setFlash(isOk ? "ok" : "bad");
    answerHaptic(isOk);

    const nextPerSkill = { ...perSkill };
    if (isOk) {
      nextPerSkill[q.track] = {
        ...nextPerSkill[q.track],
        score: nextPerSkill[q.track].score + q.weight,
      };
    }
    setPerSkill(nextPerSkill);
    const nextTotal = totalCorrect + (isOk ? 1 : 0);
    setTotalCorrect(nextTotal);
    const nextReview: ReviewItem[] = [
      ...review,
      { prompt: q.prompt, answer: q.answer, given: trimmed, correct: isOk, track: q.track, ops: q.ops },
    ];
    setReview(nextReview);

    setTimeout(async () => {
      setFlash(null);
      setInput("");
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        if (submittingRef.current) return;
        submittingRef.current = true;
        try {
          const res = await submitFn({
            data: {
              perSkill: nextPerSkill,
              totalCorrect: nextTotal,
              total: questions.length,
            },
          });
          await qc.invalidateQueries();
          onDone(res.startingLevels, nextReview);

        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to save placement");
        }
      }
    }, isOk ? 280 : 700);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {index + 1} / {questions.length} ·{" "}
          <span className="text-foreground/80">{TRACK_LABELS[q.track]}</span>
        </span>
        <span className="tabular">{totalCorrect} correct</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-10 text-center">
        <div className="font-display text-6xl font-semibold tabular tracking-tight md:text-7xl">
          {q.prompt}
        </div>
        <form onSubmit={submit} className="mt-10">
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
              inputMode="numeric"
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
          <div className="mt-6 text-xs text-muted-foreground">Press Enter to submit · blank = skip</div>
        </form>
      </div>
    </div>
  );
}

function Done({
  startingLevels,
  review,
}: {
  startingLevels: Record<SkillTrack, number>;
  review: ReviewItem[];
}) {

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your starting line</h1>
      <p className="mt-2 text-muted-foreground">
        Here's where you'll start on each track. You can always replay earlier levels.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TRACKS.map((t) => (
          <div key={t} className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {TRACK_LABELS[t]}
            </div>
            <div className="mt-1 font-display text-2xl font-semibold">Level {startingLevels[t]}</div>
          </div>
        ))}
      </div>
      <CoachingReview items={review} />
      <div className="mt-8 flex justify-end">

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Open my curriculum <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
