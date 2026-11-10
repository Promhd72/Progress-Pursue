import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Flame, Timer, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DAILY_TARGETS,
  GOALS,
  getOnboarding,
  saveOnboarding,
  type DailyTargetId,
  type GoalId,
} from "@/lib/onboarding";
import { keyHaptic } from "@/lib/native";
import { PrimaryButton } from "@/components/native/PrimaryButton";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome to Rapid Math" }] }),
  component: Welcome,
});

type Step = "intro" | "goal" | "target" | "ready";
const ORDER: Step[] = ["intro", "goal", "target", "ready"];

function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [goal, setGoal] = useState<GoalId | null>(() => getOnboarding().goal);
  const [target, setTarget] = useState<DailyTargetId>(() => getOnboarding().dailyTarget);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const idx = ORDER.indexOf(step);
  const go = (s: Step) => {
    keyHaptic();
    setStep(s);
  };

  return (
    <div className="pt-safe flex min-h-[100dvh] flex-col bg-background">
      {/* Top bar: back + progress */}
      <div className="flex h-14 items-center gap-3 px-5">
        {idx > 0 ? (
          <button
            onClick={() => go(ORDER[idx - 1])}
            aria-label="Back"
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted-foreground active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="h-10 w-8" />
        )}
        {idx > 0 && (
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(idx / (ORDER.length - 1)) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div
        key={step}
        className="animate-in fade-in slide-in-from-right-4 flex flex-1 flex-col px-6 duration-300"
      >
        {step === "intro" && <Intro />}
        {step === "goal" && (
          <>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight">
              What do you want sharper numbers for?
            </h1>
            <p className="mt-2 text-muted-foreground">We'll shape your plan around it.</p>
            <div className="mt-6 space-y-3">
              {GOALS.map((g) => (
                <ChoiceCard
                  key={g.id}
                  selected={goal === g.id}
                  onSelect={() => {
                    keyHaptic();
                    setGoal(g.id);
                  }}
                  emoji={g.emoji}
                  title={g.title}
                  blurb={g.blurb}
                />
              ))}
            </div>
          </>
        )}
        {step === "target" && (
          <>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight">
              Pick a daily goal
            </h1>
            <p className="mt-2 text-muted-foreground">
              Short and daily beats long and rare. You can change it anytime.
            </p>
            <div className="mt-6 space-y-3">
              {DAILY_TARGETS.map((t) => (
                <ChoiceCard
                  key={t.id}
                  selected={target === t.id}
                  onSelect={() => {
                    keyHaptic();
                    setTarget(t.id);
                  }}
                  emoji={t.id === "casual" ? "🌱" : t.id === "regular" ? "⚡" : "🔥"}
                  title={`${t.minutes} min a day`}
                  blurb={`${t.label} · ${t.lessons} lesson${t.lessons === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          </>
        )}
        {step === "ready" && <Ready goal={goal} target={target} />}
      </div>

      {/* Bottom actions */}
      <div className="pb-safe-4 sticky bottom-0 space-y-3 bg-gradient-to-t from-background from-80% to-transparent px-6 pt-6">
        {step === "intro" && (
          <>
            <PrimaryButton onClick={() => go("goal")}>Get started</PrimaryButton>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="block w-full rounded-2xl py-3.5 text-center text-base font-semibold text-primary active:bg-muted"
            >
              I already have an account
            </Link>
          </>
        )}
        {step === "goal" && (
          <PrimaryButton
            disabled={!goal}
            onClick={() => {
              saveOnboarding({ goal });
              go("target");
            }}
          >
            Continue
          </PrimaryButton>
        )}
        {step === "target" && (
          <PrimaryButton
            onClick={() => {
              saveOnboarding({ dailyTarget: target });
              go("ready");
            }}
          >
            Continue
          </PrimaryButton>
        )}
        {step === "ready" && (
          <PrimaryButton
            onClick={() => {
              keyHaptic();
              navigate({ to: "/auth", search: { mode: "signup" } });
            }}
          >
            Create my free account
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function Intro() {
  return (
    <div className="flex flex-1 flex-col justify-center pb-6">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary font-display text-4xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
        R
      </div>
      <h1 className="mt-8 text-center font-display text-4xl font-semibold leading-tight tracking-tight">
        Think faster.
        <br />
        Talk numbers.
      </h1>
      <p className="mx-auto mt-3 max-w-xs text-center text-muted-foreground">
        Mental math training for professionals. Five minutes a day.
      </p>
      <div className="mx-auto mt-10 w-full max-w-sm space-y-4">
        <Benefit
          icon={Timer}
          title="Answer in seconds"
          text="18% of 250? You'll know before the slide changes."
        />
        <Benefit
          icon={TrendingUp}
          title="Measured progress"
          text="Speed and accuracy tracked every session."
        />
        <Benefit
          icon={Flame}
          title="A habit that sticks"
          text="Streaks, XP and gentle daily reminders."
        />
      </div>
    </div>
  );
}

function Ready({ goal, target }: { goal: GoalId | null; target: DailyTargetId }) {
  const g = GOALS.find((x) => x.id === goal);
  const t = DAILY_TARGETS.find((x) => x.id === target) ?? DAILY_TARGETS[1];
  return (
    <div className="flex flex-1 flex-col justify-center pb-6">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
        <Check className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-center font-display text-3xl font-semibold leading-tight tracking-tight">
        Your plan is ready
      </h1>
      <div className="mx-auto mt-8 w-full max-w-sm space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <PlanRow label="Focus" value={g ? `${g.emoji} ${g.title}` : "🧠 All-round speed"} />
        <PlanRow
          label="Daily goal"
          value={`${t.minutes} min · ${t.lessons} lesson${t.lessons === 1 ? "" : "s"}`}
        />
        <PlanRow label="First step" value="2-minute placement test" />
      </div>
      <p className="mx-auto mt-6 max-w-xs text-center text-sm text-muted-foreground">
        Create a free account to save your streak and progress.
      </p>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  emoji,
  title,
  blurb,
}: {
  selected: boolean;
  onSelect: () => void;
  emoji: string;
  title: string;
  blurb: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{blurb}</span>
      </span>
      <span
        className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
