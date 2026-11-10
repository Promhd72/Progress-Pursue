import { useEffect, useState } from "react";
import { Lightbulb, GraduationCap } from "lucide-react";
import { coachingTip } from "@/lib/coaching";
import type { SkillTrack } from "@/lib/curriculum";

const STORAGE_KEY = "rapidmath.coaching";

/** Opt-in coaching preference, remembered on the device. Off by default. */
export function useCoachingPreference() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(STORAGE_KEY) === "on");
    } catch {
      /* storage unavailable */
    }
  }, []);

  function toggle(next?: boolean) {
    setEnabled((cur) => {
      const value = next ?? !cur;
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
      } catch {
        /* storage unavailable */
      }
      return value;
    });
  }

  return { enabled, toggle };
}

export function CoachingToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        enabled
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-accent"
      }`}
    >
      <GraduationCap className="h-3.5 w-3.5" />
      Coaching {enabled ? "on" : "off"}
    </button>
  );
}

export function TipCard({
  track,
  ops,
  compact,
}: {
  track: SkillTrack | undefined;
  ops: number[] | undefined;
  compact?: boolean;
}) {
  const tip = track ? coachingTip(track, ops) : null;
  if (!tip) return null;
  return (
    <div
      className={`rounded-xl border border-primary/20 bg-primary/5 text-left ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
        <Lightbulb className="h-3.5 w-3.5" /> {tip.headline}
      </div>
      <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
        {tip.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

export interface ReviewItem {
  prompt: string;
  answer: number;
  given: string;
  correct: boolean;
  track?: SkillTrack;
  ops?: number[];
}

export function CoachingReview({ items }: { items: ReviewItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="mt-8 text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
      >
        <GraduationCap className="h-4 w-4" />
        {open ? "Hide coaching" : "Show coaching"}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-lg font-semibold tabular">{item.prompt}</span>
                <span className="text-xs text-muted-foreground">
                  You:{" "}
                  <span className={item.correct ? "text-success" : "text-destructive"}>
                    {item.given === "" ? "skipped" : item.given}
                  </span>
                  {" · "}Answer: <span className="text-foreground tabular">{item.answer}</span>
                </span>
              </div>
              <div className="mt-3">
                <TipCard track={item.track} ops={item.ops} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
