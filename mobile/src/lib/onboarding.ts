/**
 * Onboarding answers (goal + daily commitment). Picked before sign-up, so they
 * live on the device. Wrapped in try/catch: storage can be unavailable.
 */

export type GoalId = "meetings" | "interviews" | "money" | "sharp";
export type DailyTargetId = "casual" | "regular" | "serious";

export const GOALS: { id: GoalId; emoji: string; title: string; blurb: string }[] = [
  {
    id: "meetings",
    emoji: "💼",
    title: "Meetings & presentations",
    blurb: "Percentages, growth and margins on the spot",
  },
  {
    id: "interviews",
    emoji: "🎯",
    title: "Interviews & case tests",
    blurb: "Consulting, banking and numerical reasoning",
  },
  {
    id: "money",
    emoji: "🧾",
    title: "Everyday money maths",
    blurb: "Discounts, tax, tips and splitting the bill",
  },
  {
    id: "sharp",
    emoji: "🧠",
    title: "Keep my brain sharp",
    blurb: "A daily workout that actually feels good",
  },
];

export const DAILY_TARGETS: {
  id: DailyTargetId;
  minutes: number;
  lessons: number;
  label: string;
}[] = [
  // Kept within the Free plan's 3 lessons/day so every user can hit their goal.
  { id: "casual", minutes: 3, lessons: 1, label: "Casual" },
  { id: "regular", minutes: 5, lessons: 2, label: "Regular" },
  { id: "serious", minutes: 10, lessons: 3, label: "Serious" },
];

export type OnboardingPrefs = {
  goal: GoalId | null;
  dailyTarget: DailyTargetId;
  completed: boolean;
};

const KEY = "rapidmath.onboarding";
const DEFAULTS: OnboardingPrefs = { goal: null, dailyTarget: "regular", completed: false };

export function getOnboarding(): OnboardingPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<OnboardingPrefs>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveOnboarding(patch: Partial<OnboardingPrefs>): OnboardingPrefs {
  const next = { ...getOnboarding(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore: answers just won't persist across launches.
  }
  return next;
}

export function dailyTargetFor(id: DailyTargetId) {
  return DAILY_TARGETS.find((t) => t.id === id) ?? DAILY_TARGETS[1];
}

/** Which track to suggest first, based on why the user is here. */
export function focusTrackFor(goal: GoalId | null): string {
  switch (goal) {
    case "meetings":
    case "money":
      return "Percentages";
    case "interviews":
      return "Multiplication & percentages";
    default:
      return "All five tracks";
  }
}
