import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getAdvancedAccess,
  getAdvancedProgress,
  submitAdvancedAnswer,
  type AdvancedAccess,
  type AdvancedAnswerResult,
} from "@/lib/advanced.functions";

import { AdvancedVisual } from "@/components/advanced/AdvancedVisual";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Lock, Sparkles, XCircle } from "lucide-react";
import {
  ADVANCED_DOMAINS,
  ADVANCED_DOMAIN_LABELS,
  type AdvancedDomain,
} from "@/lib/advanced-domains";
import { UpgradeButton } from "@/components/UpgradeButton";
import { WebOnly } from "@/lib/native";

export const Route = createFileRoute("/_authenticated/advanced")({
  validateSearch: (search: Record<string, unknown>): { domain?: AdvancedDomain } => {
    const d = search.domain;
    return typeof d === "string" && (ADVANCED_DOMAINS as readonly string[]).includes(d)
      ? { domain: d as AdvancedDomain }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Advanced drills — Rapid Math" },
      {
        name: "description",
        content:
          "Boardroom-style story questions: read the chart, weigh the numbers, pick the right answer.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="text-destructive">Something went wrong: {error.message}</div>
  ),
  notFoundComponent: () => <div className="text-muted-foreground">Not found.</div>,
  component: AdvancedPage,
});

function AdvancedPage() {
  const accessFn = useServerFn(getAdvancedAccess);
  const submitFn = useServerFn(submitAdvancedAnswer);
  const router = useRouter();

  const { domain } = Route.useSearch();

  const accessQ = useQuery({
    queryKey: ["advanced-access", domain ?? "all"],
    queryFn: () => accessFn({ data: { domain: domain ?? null } }),
    refetchOnWindowFocus: false,
  });

  const progressFn = useServerFn(getAdvancedProgress);
  const progressQ = useQuery({
    queryKey: ["advanced-progress"],
    queryFn: () => progressFn(),
    refetchOnWindowFocus: false,
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AdvancedAnswerResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);

  const submitM = useMutation({
    mutationFn: (input: { questionId: string; selectedIndex: number }) =>
      submitFn({ data: input }),
    onSuccess: (data) => {
      setResult(data);
      progressQ.refetch();
    },
  });

  if (accessQ.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (accessQ.error) return <div className="text-destructive">Failed to load.</div>;

  const access = accessQ.data!;
  const progress = progressQ.data
    ? domain
      ? progressQ.data.byDomain[domain]
      : progressQ.data.overall
    : null;

  function nextQuestion() {
    setSelected(null);
    setResult(null);
    setHintsShown(0);
    submitM.reset();
    router.invalidate();
    accessQ.refetch();
    progressQ.refetch();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to curriculum
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Curriculum · Advanced
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {domain ? ADVANCED_DOMAIN_LABELS[domain] : "Advanced scenarios"}
          </h1>
          <p className="text-muted-foreground">
            Read the story, scan the numbers, pick the answer.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          {access.isPro ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              Pro · Unlimited
            </span>
          ) : (
            <span>
              {access.usedToday}/{access.limit} used today
            </span>
          )}
        </div>
      </header>

      {progress && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">
              {domain ? `${ADVANCED_DOMAIN_LABELS[domain]} progress` : "Overall progress"}
            </div>
            <div className="flex gap-5 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">
                  {progress.mastered}/{progress.total}
                </span>{" "}
                mastered
              </span>
              <span>
                <span className="font-semibold text-foreground">
                  {progress.accuracy === null ? "—" : `${progress.accuracy}%`}
                </span>{" "}
                accuracy
              </span>
              <span>
                <span className="font-semibold text-foreground">{progress.attempts}</span> solved
              </span>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${progress.total > 0 ? Math.round((progress.mastered / progress.total) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress.mastered === progress.total && progress.total > 0
              ? "Every scenario here solved at least once — keep practising to stay sharp."
              : "A scenario counts as mastered the first time you answer it correctly."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <DomainChip label="All" to={undefined} active={!domain} />
        {ADVANCED_DOMAINS.map((d) => (
          <DomainChip key={d} label={ADVANCED_DOMAIN_LABELS[d]} to={d} active={domain === d} />
        ))}
      </div>

      {access.locked ? (
        <LockedCard />
      ) : (
        <QuestionCard
          q={access.question!}
          selected={selected}
          setSelected={setSelected}
          result={result}
          submitting={submitM.isPending}
          hintsShown={hintsShown}
          onShowHint={() => setHintsShown((n) => Math.min(n + 1, access.question!.hints.length))}
          onSubmit={() => {
            if (selected === null) return;
            submitM.mutate({
              questionId: access.question!.id,
              selectedIndex: selected,
            });
          }}
          onNext={nextQuestion}
          isPro={access.isPro}
        />
      )}
    </div>
  );
}

function QuestionCard({
  q,
  selected,
  setSelected,
  result,
  submitting,
  hintsShown,
  onShowHint,
  onSubmit,
  onNext,
  isPro,
}: {
  q: NonNullable<AdvancedAccess["question"]>;
  selected: number | null;
  setSelected: (n: number) => void;
  result: AdvancedAnswerResult | null;
  submitting: boolean;
  hintsShown: number;
  onShowHint: () => void;
  onSubmit: () => void;
  onNext: () => void;
  isPro: boolean;
}) {
  const totalHints = q.hints.length;
  const canShowMoreHints = !result && hintsShown < totalHints;

  return (
    <article className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {q.topic}
      </div>
      <p className="text-base leading-relaxed text-foreground">{q.scenario}</p>

      {q.visual.kind !== "none" && (
        <div className="rounded-xl bg-muted/30 p-4">
          <AdvancedVisual visual={q.visual} />
        </div>
      )}

      <h2 className="font-display text-xl font-semibold">{q.question}</h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = result && i === result.correctIndex;
          const isWrongPick = result && isSelected && !result.correct;
          return (
            <button
              key={i}
              type="button"
              disabled={!!result || submitting}
              onClick={() => setSelected(i)}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                result
                  ? isCorrect
                    ? "border-green-600/60 bg-green-600/10 text-foreground"
                    : isWrongPick
                      ? "border-destructive/60 bg-destructive/10 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  : isSelected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background hover:border-primary/50",
              ].join(" ")}
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {result && isCorrect && (
                <CheckCircle2 className="ml-2 inline h-4 w-4 text-green-600" />
              )}
              {result && isWrongPick && (
                <XCircle className="ml-2 inline h-4 w-4 text-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hints — progressive nudges shown before answering. */}
      {!result && (hintsShown > 0 || canShowMoreHints) && (
        <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-50/60 p-4 dark:bg-amber-500/5">
          {hintsShown > 0 && (
            <ol className="space-y-2">
              {q.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{h}</span>
                </li>
              ))}
            </ol>
          )}
          {canShowMoreHints && (
            <button
              type="button"
              onClick={onShowHint}
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
            >
              <Lightbulb className="h-4 w-4" />
              {hintsShown === 0
                ? `Stuck? Get a hint (${totalHints} available)`
                : `Next hint (${totalHints - hintsShown} left)`}
            </button>
          )}
        </div>
      )}

      {result ? (
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-sm">
            <span className="font-semibold">
              {result.correct ? "Nice — correct." : "Not quite."}
            </span>{" "}
            <span className="text-muted-foreground">{result.explanation}</span>
          </div>

          {/* Mental-math walkthrough */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                How to do it in your head
              </div>
              {result.technique && (
                <div className="text-xs font-medium text-muted-foreground">
                  Technique: <span className="text-foreground">{result.technique}</span>
                </div>
              )}
            </div>
            <ol className="mt-3 space-y-2">
              {result.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {result.isPro || (result.remainingToday ?? 0) > 0 ? (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Next scenario <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <FreeLimitReached />
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {isPro
              ? "Pro · Unlimited advanced drills"
              : "Free tier · 3 advanced scenarios per day"}
          </div>
          <button
            onClick={onSubmit}
            disabled={selected === null || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Submit answer"}
          </button>
        </div>
      )}
    </article>
  );
}

function DomainChip({
  label,
  to,
  active,
}: {
  label: string;
  to?: AdvancedDomain;
  active: boolean;
}) {
  return (
    <Link
      to="/advanced"
      search={to ? { domain: to } : {}}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function LockedCard() {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="font-display text-xl font-semibold">
        You've used today's free Advanced scenarios
      </h2>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Free gives you three boardroom-style scenarios each day.
        <WebOnly>
          {" "}Pro unlocks unlimited Advanced drills — charts, tables, and story problems on tap.
        </WebOnly>
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <UpgradeButton label="Upgrade to Pro — $10/mo" className="px-5 py-2.5" />
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-md border border-input bg-card px-5 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          Run a regular drill
        </Link>
      </div>
    </div>
  );
}

function FreeLimitReached() {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
      <div className="font-semibold text-foreground">That's today's free run.</div>
      <p className="mt-1 text-muted-foreground">
        Come back tomorrow for three more
        <WebOnly>, or go Pro for unlimited Advanced scenarios right now</WebOnly>.
      </p>
      <UpgradeButton label="Go Pro — $10/mo" className="mt-3" />
    </div>
  );
}
