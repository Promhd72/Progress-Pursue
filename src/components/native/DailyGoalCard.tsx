import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { dailyTargetFor, getOnboarding } from "@/lib/onboarding";

/**
 * Today's progress ring against the user's daily goal. The single most
 * important "come back tomorrow" hook on the home screen.
 */
export function DailyGoalCard({
  lessonsToday,
  streak,
  nextHref,
}: {
  lessonsToday: number;
  streak: number;
  nextHref?: { track: string; level: number } | null;
}) {
  const target = dailyTargetFor(getOnboarding().dailyTarget);
  const done = Math.min(lessonsToday, target.lessons);
  const pct = done / target.lessons;
  const complete = lessonsToday >= target.lessons;
  const r = 34;
  const c = 2 * Math.PI * r;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary to-blue-700 p-5 text-primary-foreground shadow-lg shadow-primary/25">
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center font-display text-lg font-semibold tabular">
            {complete ? "✓" : `${done}/${target.lessons}`}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Today's goal
          </div>
          <div className="mt-1 font-display text-xl font-semibold leading-tight">
            {complete
              ? "Goal smashed. See you tomorrow!"
              : lessonsToday === 0
                ? `${target.minutes} minutes keeps the streak alive`
                : `${target.lessons - lessonsToday} more to hit your goal`}
          </div>
          <div className="mt-1 text-sm opacity-80">🔥 {streak}-day streak</div>
        </div>
      </div>
      {!complete && nextHref && (
        <Link
          to="/lesson/$track/$level"
          params={{ track: nextHref.track, level: String(nextHref.level) }}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-base font-semibold text-primary active:bg-white/90"
        >
          {lessonsToday === 0 ? "Start today's lesson" : "Next lesson"}{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
