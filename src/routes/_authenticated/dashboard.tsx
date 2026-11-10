import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/rapid-math.functions";
import { UpgradeButton } from "@/components/UpgradeButton";
import { WebOnly } from "@/lib/native";
import { getCurriculumOverview, getRecentLessons, getTrackSpeedStats, type TrackSpeedStat } from "@/lib/curriculum.functions";
import {
  TRACKS,
  TRACK_LABELS,
  TRACK_SYMBOL,
  MAX_LEVEL,
  FREE_MAX_LEVEL,
  type SkillTrack,
} from "@/lib/curriculum";
import { levelForXp } from "@/lib/drill-engine";
import {
  ADVANCED_DOMAINS,
  ADVANCED_DOMAIN_LABELS,
  ADVANCED_DOMAIN_BLURBS,
  ADVANCED_DOMAIN_SYMBOL,
} from "@/lib/advanced-domains";
import { getAdvancedProgress } from "@/lib/advanced.functions";
import {
  Flame,
  Trophy,
  ArrowRight,
  Sparkles,
  Crown,
  Target,
  Lock,
  CheckCircle2,
  TrendingDown,
  Minus,
  Timer,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Curriculum — Rapid Math" }] }),
  component: Dashboard,
});

function Dashboard() {
  const profileFn = useServerFn(getProfile);
  const overviewFn = useServerFn(getCurriculumOverview);
  const lessonsFn = useServerFn(getRecentLessons);
  const speedFn = useServerFn(getTrackSpeedStats);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const overviewQ = useQuery({ queryKey: ["curriculum"], queryFn: () => overviewFn() });
  const sessionsQ = useQuery({
    queryKey: ["lessons", "recent"],
    queryFn: () => lessonsFn({ data: { limit: 10 } }),
  });
  const speedQ = useQuery({ queryKey: ["lessons", "speed"], queryFn: () => speedFn() });
  const advancedProgressFn = useServerFn(getAdvancedProgress);
  const advancedQ = useQuery({
    queryKey: ["advanced-progress"],
    queryFn: () => advancedProgressFn(),
  });

  if (profileQ.isLoading || overviewQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }
  if (profileQ.error || overviewQ.error)
    return <div className="text-destructive">Failed to load curriculum.</div>;

  const profile = profileQ.data!;
  const overview = overviewQ.data!;
  const lvl = levelForXp(profile.xp);

  const sessions = sessionsQ.data ?? [];
  const totalCorrect = sessions.reduce((s, x) => s + x.correct, 0);
  const totalQuestions = sessions.reduce((s, x) => s + x.total, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Hi {profile.name || "there"} 👋
            </h1>
            {overview.isPro && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> Pro
              </span>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {profile.current_streak > 0
              ? `You're on a ${profile.current_streak}-day streak — keep it going.`
              : "Pick a track and start your next lesson."}
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Trophy} label={`Level ${lvl.level}`} value={`${profile.xp.toLocaleString()} XP`} sub={`${lvl.toNext} XP to L${lvl.level + 1}`} tone="primary" />
        <StatCard icon={Flame} label="Current streak" value={`${profile.current_streak}`} sub={`day${profile.current_streak === 1 ? "" : "s"} · longest ${profile.longest_streak}`} tone="warm" />
        <StatCard icon={Target} label="Recent accuracy" value={accuracy === null ? "—" : `${accuracy}%`} sub={totalQuestions > 0 ? `${totalCorrect} of ${totalQuestions} correct` : "Run a lesson to see this"} />
        <StatCard
          icon={CheckCircle2}
          label="Today"
          value={
            overview.dailyLimit === null
              ? `${overview.lessonsUsedToday}`
              : `${overview.lessonsUsedToday}/${overview.dailyLimit}`
          }
          sub={overview.dailyLimit === null ? "lessons (unlimited)" : "lessons used"}
        />
      </div>

      {/* Placement CTA — optional, dismissable by just ignoring it */}
      {!overview.hasPlacement && <PlacementCard />}

      {/* Speed by track */}
      <SpeedByTrack stats={speedQ.data ?? []} loading={speedQ.isLoading} />

      {/* Recommended lesson */}
      {overview.recommended && (
        <RecommendedCard
          track={overview.recommended.track}
          level={overview.recommended.level}
          isPro={overview.isPro}
        />
      )}

      {/* Track grid */}
      <section>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Your curriculum</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with Fundamentals, then apply them in Advanced scenarios.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-semibold">Fundamentals</h3>
            <span className="text-xs text-muted-foreground">
              {MAX_LEVEL} levels per track · pass a level (≥80%) to unlock the next
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview.tracks.map((t) => (
              <TrackCard key={t.track} track={t.track} currentLevel={t.current_level} highestPassed={t.highest_level_passed} isPro={overview.isPro} />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-semibold">Advanced scenarios</h3>
            <span className="text-xs text-muted-foreground">
              {advancedQ.data
                ? `${advancedQ.data.overall.mastered}/${advancedQ.data.overall.total} scenarios mastered`
                : "Story questions with charts · pick a context"}
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ADVANCED_DOMAINS.map((d) => {
              const p = advancedQ.data?.byDomain[d];
              const pct = p && p.total > 0 ? Math.round((p.mastered / p.total) * 100) : 0;
              const started = (p?.attempts ?? 0) > 0;
              const complete = !!p && p.total > 0 && p.mastered === p.total;
              return (
                <Link
                  key={d}
                  to="/advanced"
                  search={{ domain: d }}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 font-display text-lg font-semibold text-primary">
                      {ADVANCED_DOMAIN_SYMBOL[d]}
                    </span>
                    {complete && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <CheckCircle2 className="h-3 w-3" /> Complete
                      </span>
                    )}
                  </div>
                  <div className="mt-3 font-medium">{ADVANCED_DOMAIN_LABELS[d]}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{ADVANCED_DOMAIN_BLURBS[d]}</p>

                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      {p
                        ? started
                          ? `${p.mastered}/${p.total} mastered${p.accuracy !== null ? ` · ${p.accuracy}% accuracy` : ""}`
                          : "Not started yet"
                        : "—"}
                    </div>
                  </div>

                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {started ? "Continue" : "Start"}{" "}
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {!overview.isPro && (
        <WebOnly>
          <ProTeaser />
        </WebOnly>
      )}
    </div>
  );
}

function PlacementCard() {
  const [localResult, setLocalResult] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("rapidmath:quick-test-result");
    if (stored) {
      try {
        setLocalResult(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display text-lg font-semibold">
              {localResult ? "Ready to import your score?" : "Not sure where to start?"}
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {localResult 
                ? `We found your assessment score of ${localResult.score}/${localResult.total}. Take the official placement test to set your starting levels.`
                : "Take a 10-question placement to set a starting level on each track. Totally optional — feel free to dive into any track instead."}
            </p>
          </div>
        </div>
        <Link
          to="/placement"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {localResult ? "Complete Placement" : "Start placement"} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function fmtSec(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function SpeedByTrack({ stats, loading }: { stats: TrackSpeedStat[]; loading: boolean }) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }
  if (!stats.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Timer className="h-3.5 w-3.5" />
        </span>
        <h2 className="font-display text-xl font-semibold">Speed by track</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Your average time per question, and how it's moving over time. Every rep counts — progress is rarely a straight line.
      </p>

      <div className="mt-5 space-y-4">
        {stats.map((s) => (
          <TrackSpeedRow key={s.track} stat={s} />
        ))}
      </div>
    </section>
  );
}

function TrackSpeedRow({ stat }: { stat: TrackSpeedStat }) {
  const { track, attempts, overallAvgMs, bestAvgMs, deltaMs, deltaPct, trend } = stat;
  const improved = deltaMs !== null && deltaPct !== null && deltaPct > 0.03;
  const steady = deltaMs !== null && deltaPct !== null && !improved;

  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 font-display text-lg font-semibold text-primary">
            {TRACK_SYMBOL[track]}
          </span>
          <div>
            <div className="font-medium">{TRACK_LABELS[track]}</div>
            <div className="text-xs text-muted-foreground">
              {attempts} lesson{attempts === 1 ? "" : "s"} · best {fmtSec(bestAvgMs)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Average speed</div>
          <div className="font-display text-2xl font-semibold tabular">{fmtSec(overallAvgMs)}</div>
          <div className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            {improved ? (
              <>
                <TrendingDown className="h-3 w-3 text-success" />
                <span className="text-success">
                  {fmtSec(deltaMs!)} faster than when you started
                </span>
              </>
            ) : steady ? (
              <>
                <Minus className="h-3 w-3" /> Holding steady — consistency builds speed
              </>
            ) : (
              <>
                <Minus className="h-3 w-3" /> Great start — more lessons will show your curve
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <SpeedChart values={trend} />
      </div>
    </div>
  );
}

function SpeedChart({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        One more lesson and your speed-over-time chart appears here.
      </div>
    );
  }
  const w = 600;
  const h = 90;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const pts = values.map((v, i) => [i * step, y(v)] as const);
  const line = pts.map(([x, yy]) => `${x},${yy}`).join(" ");
  const area = `${line} ${w},${h} 0,${h}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full text-primary" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="spd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#spd)" />
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.map(([x, yy], i) => (
          <circle key={i} cx={x} cy={yy} r={2.5} fill="currentColor" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>Earlier · {fmtSec(values[0])}</span>
        <span>Latest · {fmtSec(values[values.length - 1])}</span>
      </div>
    </div>
  );
}



function RecommendedCard({ track, level, isPro }: { track: SkillTrack; level: number; isPro: boolean }) {
  const locked = !isPro && level > FREE_MAX_LEVEL;
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-primary">Today's lesson</div>
          <h3 className="mt-1 font-display text-2xl font-semibold">
            {TRACK_LABELS[track]} · Level {level}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            10 questions. Aim for 80% to unlock Level {level + 1}.
          </p>
        </div>
        {locked ? (
          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-5 py-3 text-sm font-medium text-muted-foreground">
            <Lock className="h-4 w-4" /> Unlock with Pro
          </div>
        ) : (
          <Link
            to="/lesson/$track/$level"
            params={{ track, level: String(level) }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Start lesson <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function TrackCard({
  track,
  currentLevel,
  highestPassed,
  isPro,
}: {
  track: SkillTrack;
  currentLevel: number;
  highestPassed: number;
  isPro: boolean;
}) {
  const completedPct = Math.round((highestPassed / MAX_LEVEL) * 100);
  const canPlay = isPro || currentLevel <= FREE_MAX_LEVEL;
  const finished = highestPassed >= MAX_LEVEL;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 font-display text-lg font-semibold text-primary">
            {TRACK_SYMBOL[track]}
          </span>
          <div className="font-display text-lg font-semibold">{TRACK_LABELS[track]}</div>
        </div>
        {finished && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current
          </div>
          <div className="font-display text-2xl font-semibold tabular">
            Level {Math.min(currentLevel, MAX_LEVEL)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Passed
          </div>
          <div className="font-display text-2xl font-semibold tabular">
            {highestPassed}/{MAX_LEVEL}
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${completedPct}%` }} />
      </div>

      {/* Level pips */}
      <div className="mt-4 grid grid-cols-10 gap-1">
        {Array.from({ length: MAX_LEVEL }, (_, i) => {
          const l = i + 1;
          const passed = l <= highestPassed;
          const isCurrent = l === currentLevel;
          const lockedByPro = !isPro && l > FREE_MAX_LEVEL;
          return (
            <div
              key={l}
              title={`Level ${l}${lockedByPro ? " (Pro)" : ""}`}
              className={`h-2 rounded-sm ${
                passed
                  ? "bg-primary"
                  : isCurrent
                  ? "bg-primary/40"
                  : lockedByPro
                  ? "bg-muted-foreground/20"
                  : "bg-muted"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-5">
        {finished ? (
          <Link
            to="/lesson/$track/$level"
            params={{ track, level: String(MAX_LEVEL) }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Replay Level {MAX_LEVEL}
          </Link>
        ) : canPlay ? (
          <Link
            to="/lesson/$track/$level"
            params={{ track, level: String(currentLevel) }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Continue · L{currentLevel} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            <Lock className="h-4 w-4" /> Pro unlocks L{FREE_MAX_LEVEL + 1}–L{MAX_LEVEL}
          </div>
        )}
      </div>
    </div>
  );
}

function ProTeaser() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Crown className="h-3 w-3" /> You're on Free
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold">
            Unlock Levels {FREE_MAX_LEVEL + 1}–{MAX_LEVEL} on every track
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Free covers Levels 1–{FREE_MAX_LEVEL} on all five tracks, capped at 3 lessons a day.
            Pro removes both caps and unlocks the full ladder.
          </p>
        </div>
        <UpgradeButton label="Upgrade to Pro — $10/mo" className="px-5 py-3" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "primary" | "warm";
}) {
  const iconWrap =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "warm"
      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
      : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${iconWrap}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tabular">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}
