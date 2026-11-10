import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getReminderPrefs, keyHaptic, updateReminderPrefs, type ReminderPrefs } from "@/lib/native";
import { DAILY_TARGETS, getOnboarding, saveOnboarding, type DailyTargetId } from "@/lib/onboarding";

const TIMES = [
  { label: "8:00", hour: 8 },
  { label: "13:00", hour: 13 },
  { label: "18:00", hour: 18 },
  { label: "20:00", hour: 20 },
  { label: "22:00", hour: 22 },
];

/** App-only settings: daily reminder + daily goal. */
export function ReminderSettings({ trainedToday }: { trainedToday: boolean }) {
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => getReminderPrefs());
  const [target, setTarget] = useState<DailyTargetId>(() => getOnboarding().dailyTarget);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrefs(getReminderPrefs());
  }, []);

  async function apply(next: ReminderPrefs) {
    setBusy(true);
    const saved = await updateReminderPrefs(next, trainedToday);
    setPrefs(saved);
    setBusy(false);
    if (next.enabled && !saved.enabled) {
      toast.error("Notifications are off for Rapid Math. Turn them on in iPhone Settings.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
          <Bell className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <div className="font-semibold">Daily reminder</div>
          <div className="text-xs text-muted-foreground">Skipped on days you've trained</div>
        </div>
        <Switch
          checked={prefs.enabled}
          disabled={busy}
          onCheckedChange={(enabled) => {
            keyHaptic();
            void apply({ ...prefs, enabled });
          }}
          aria-label="Daily reminder"
        />
      </div>

      {prefs.enabled && (
        <div className="mt-4 flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t.hour}
              disabled={busy}
              onClick={() => {
                keyHaptic();
                void apply({ ...prefs, hour: t.hour, minute: 0 });
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium tabular ${
                prefs.hour === t.hour
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <div className="font-semibold">Daily goal</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DAILY_TARGETS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                keyHaptic();
                setTarget(t.id);
                saveOnboarding({ dailyTarget: t.id });
              }}
              className={`rounded-xl border-2 px-2 py-2.5 text-center ${
                target === t.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="font-display text-lg font-semibold tabular">{t.minutes} min</div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
