import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/api";
import { Bell, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/rapid-math.functions";
import { getCurriculumOverview } from "@/lib/curriculum.functions";
import { getOnboarding, saveOnboarding, focusTrackFor, dailyTargetFor } from "@/lib/onboarding";
import { getReminderPrefs, keyHaptic, updateReminderPrefs } from "@/lib/native";
import { PrimaryButton } from "@/components/native/PrimaryButton";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up — Rapid Math" }] }),
  component: Onboarding,
});

const TIMES = [
  { label: "Morning", sub: "8:00", hour: 8, minute: 0, emoji: "☀️" },
  { label: "Lunch break", sub: "13:00", hour: 13, minute: 0, emoji: "🥗" },
  { label: "Evening", sub: "20:00", hour: 20, minute: 0, emoji: "🌙" },
];

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileFn = useServerFn(getProfile);
  const overviewFn = useServerFn(getCurriculumOverview);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const { data: overview } = useQuery({ queryKey: ["curriculum"], queryFn: () => overviewFn() });

  const [step, setStep] = useState<"reminder" | "level">("reminder");
  const [time, setTime] = useState(() => {
    const p = getReminderPrefs();
    return TIMES.findIndex((t) => t.hour === p.hour) >= 0
      ? TIMES.findIndex((t) => t.hour === p.hour)
      : 2;
  });
  const [busy, setBusy] = useState(false);

  const prefs = getOnboarding();
  const target = dailyTargetFor(prefs.dailyTarget);

  async function finish(to: "/placement" | "/dashboard") {
    setBusy(true);
    saveOnboarding({ completed: true });
    if (profile?.id) {
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", profile.id);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
    navigate({ to, replace: true });
  }

  async function chooseReminder(enabled: boolean) {
    setBusy(true);
    keyHaptic();
    const t = TIMES[time];
    await updateReminderPrefs({ enabled, hour: t.hour, minute: t.minute }, false);
    setBusy(false);
    setStep("level");
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <div key={step} className="animate-in fade-in slide-in-from-right-4 flex-1 duration-300">
        {step === "reminder" ? (
          <>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Bell className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight">
              When should we nudge you?
            </h1>
            <p className="mt-2 text-muted-foreground">
              A daily nudge makes it much easier to keep your streak. We'll skip it on days you've
              already trained.
            </p>
            <div className="mt-6 space-y-3">
              {TIMES.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => {
                    keyHaptic();
                    setTime(i);
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
                    time === i ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="flex-1 font-semibold">{t.label}</span>
                  <span className="tabular text-muted-foreground">{t.sub}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Gauge className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight">
              {overview?.hasPlacement ? "You're all set" : "Let's find your level"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {overview?.hasPlacement
                ? "Your starting levels are already saved. Jump into your first lesson."
                : "A quick 2-minute test across all five tracks, so your lessons start at the right difficulty. No pressure: blank answers are fine."}
            </p>
            <div className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-5">
              <Row label="Focus" value={focusTrackFor(prefs.goal)} />
              <Row
                label="Daily goal"
                value={`${target.minutes} min · ${target.lessons} lesson${target.lessons === 1 ? "" : "s"}`}
              />
            </div>
          </>
        )}
      </div>

      <div className="pb-safe-4 sticky bottom-0 space-y-3 bg-gradient-to-t from-background from-80% to-transparent pt-6">
        {step === "reminder" ? (
          <>
            <PrimaryButton disabled={busy} onClick={() => chooseReminder(true)}>
              Turn on reminders
            </PrimaryButton>
            <button
              disabled={busy}
              onClick={() => chooseReminder(false)}
              className="block w-full rounded-2xl py-3.5 text-center text-base font-semibold text-muted-foreground active:bg-muted"
            >
              Not now
            </button>
          </>
        ) : overview?.hasPlacement ? (
          <PrimaryButton disabled={busy} onClick={() => finish("/dashboard")}>
            Start training
          </PrimaryButton>
        ) : (
          <>
            <PrimaryButton disabled={busy} onClick={() => finish("/placement")}>
              Start the placement test
            </PrimaryButton>
            <button
              disabled={busy}
              onClick={() => finish("/dashboard")}
              className="block w-full rounded-2xl py-3.5 text-center text-base font-semibold text-muted-foreground active:bg-muted"
            >
              Skip, start at Level 1
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}
