// Badges: earned from progress the app already tracks (no extra database).
// Everything is computed on the device from the user's own data.

import type { IconName } from "@/components/ui";
import type { AdvancedProgress } from "./advanced.functions";
import type { CurriculumOverview, LevelStats } from "./curriculum.functions";
import { MAX_LEVEL, TRACK_LABELS, TRACKS, type SkillTrack } from "./curriculum";
import { rankForXp } from "./drill-engine";
import { TECHNIQUES } from "./techniques";

export type BadgeGroup = "Getting started" | "Skills" | "Speed" | "Habit" | "Scenarios" | "Learning";

export interface Badge {
  id: string;
  group: BadgeGroup;
  name: string;
  /** How to earn it, shown on locked badges. */
  how: string;
  /** Shown in the celebration. */
  cheer: string;
  icon: IconName;
  color: string;
}

export interface BadgeData {
  overview?: CurriculumOverview;
  stats?: LevelStats;
  profile?: { xp: number; longest_streak: number };
  advanced?: AdvancedProgress;
  learned?: number;
  meeting?: { rounds: number; best: number };
}

const GOLD = "#f5a524";
const BLUE = "#2584f5";
const GREEN = "#32b36e";
const ORANGE = "#f97316";
const PURPLE = "#8b5cf6";
const PINK = "#ec4899";

const TRACK_ICON: Record<SkillTrack, IconName> = {
  addition: "add-circle",
  subtraction: "remove-circle",
  multiplication: "close-circle",
  division: "pie-chart",
  percentage: "pricetag",
};

const MILESTONES = [
  { level: 2, name: "Foundations", color: GREEN, cheer: "The basics are locked in." },
  { level: 5, name: "Building speed", color: BLUE, cheer: "You're getting genuinely quick." },
  { level: 8, name: "Work-ready", color: PURPLE, cheer: "Ready for real numbers at work." },
  { level: MAX_LEVEL, name: "Master", color: GOLD, cheer: "Every level done. That's mastery." },
];

type Rule = Badge & { earned: (d: BadgeData) => boolean };

const passed = (d: BadgeData, t: SkillTrack) => d.overview?.tracks.find((r) => r.track === t)?.highest_level_passed ?? 0;
const allStats = (d: BadgeData) => Object.values(d.stats ?? {});
const totalStars = (d: BadgeData) => allStats(d).reduce((n, s) => n + s.stars, 0);
const rankLevel = (d: BadgeData) => (d.profile ? rankForXp(d.profile.xp).level : 0);

const RULES: Rule[] = [
  {
    id: "first-lesson",
    group: "Getting started",
    name: "First steps",
    how: "Finish your first lesson.",
    cheer: "The first lesson is the hardest. You did it.",
    icon: "footsteps",
    color: GREEN,
    earned: (d) => allStats(d).some((s) => s.attempts > 0),
  },
  {
    id: "placed",
    group: "Getting started",
    name: "Know your level",
    how: "Take the placement test.",
    cheer: "Now every lesson starts at the right level for you.",
    icon: "speedometer",
    color: BLUE,
    earned: (d) => !!d.overview?.hasPlacement,
  },
  ...TRACKS.flatMap((t) =>
    MILESTONES.map<Rule>((m) => ({
      id: `${t}-${m.level}`,
      group: "Skills",
      name: m.level === MAX_LEVEL ? `${TRACK_LABELS[t]} master` : `${TRACK_LABELS[t]}: ${m.name}`,
      how: `Pass ${TRACK_LABELS[t]} Level ${m.level}.`,
      cheer: m.cheer,
      icon: TRACK_ICON[t],
      color: m.color,
      earned: (d) => passed(d, t) >= m.level,
    })),
  ),
  {
    id: "all-foundations",
    group: "Skills",
    name: "All-rounder",
    how: "Pass Level 2 on all five skills.",
    cheer: "Solid basics in all five skills.",
    icon: "apps",
    color: PINK,
    earned: (d) => TRACKS.every((t) => passed(d, t) >= 2),
  },
  {
    id: "three-stars",
    group: "Speed",
    name: "Lightning",
    how: "Earn 3 stars on any level (beat its time target).",
    cheer: "Faster than the target. That's real speed.",
    icon: "flash",
    color: GOLD,
    earned: (d) => allStats(d).some((s) => s.stars === 3),
  },
  {
    id: "stars-25",
    group: "Speed",
    name: "Star collector",
    how: "Collect 25 stars.",
    cheer: "25 stars and counting.",
    icon: "star",
    color: GOLD,
    earned: (d) => totalStars(d) >= 25,
  },
  {
    id: "stars-100",
    group: "Speed",
    name: "Constellation",
    how: "Collect 100 stars.",
    cheer: "100 stars. You're fast across the board.",
    icon: "sparkles",
    color: GOLD,
    earned: (d) => totalStars(d) >= 100,
  },
  {
    id: "rank-sharp",
    group: "Speed",
    name: "Sharp mind",
    how: "Reach the Sharp rank.",
    cheer: "Rank up: you're officially Sharp.",
    icon: "trophy",
    color: PURPLE,
    earned: (d) => rankLevel(d) >= 4,
  },
  {
    id: "rank-mastermind",
    group: "Speed",
    name: "Mastermind",
    how: "Reach the top rank, Mastermind.",
    cheer: "The highest rank in Rapid Math.",
    icon: "ribbon",
    color: GOLD,
    earned: (d) => rankLevel(d) >= 10,
  },
  {
    id: "warmup-1",
    group: "Speed",
    name: "Warmed up",
    how: "Finish a Meeting warm-up (Train tab).",
    cheer: "Ready for the next number someone throws at you.",
    icon: "chatbubbles",
    color: BLUE,
    earned: (d) => (d.meeting?.rounds ?? 0) >= 1,
  },
  {
    id: "warmup-8",
    group: "Speed",
    name: "Boardroom ready",
    how: "Get 8 right in one Meeting warm-up.",
    cheer: "8 in 60 seconds. You'd answer before the calculator comes out.",
    icon: "mic",
    color: PURPLE,
    earned: (d) => (d.meeting?.best ?? 0) >= 8,
  },
  {
    id: "streak-3",
    group: "Habit",
    name: "On a roll",
    how: "Train 3 days in a row.",
    cheer: "Three days running. A habit is forming.",
    icon: "flame",
    color: ORANGE,
    earned: (d) => (d.profile?.longest_streak ?? 0) >= 3,
  },
  {
    id: "streak-7",
    group: "Habit",
    name: "Week strong",
    how: "Train 7 days in a row.",
    cheer: "A full week without a break.",
    icon: "flame",
    color: ORANGE,
    earned: (d) => (d.profile?.longest_streak ?? 0) >= 7,
  },
  {
    id: "streak-30",
    group: "Habit",
    name: "Unstoppable",
    how: "Train 30 days in a row.",
    cheer: "30 days in a row. That's how skills stick.",
    icon: "bonfire",
    color: ORANGE,
    earned: (d) => (d.profile?.longest_streak ?? 0) >= 30,
  },
  {
    id: "scenario-1",
    group: "Scenarios",
    name: "Real world",
    how: "Solve your first real-life scenario.",
    cheer: "Mental maths, used for real.",
    icon: "briefcase",
    color: BLUE,
    earned: (d) => (d.advanced?.overall.mastered ?? 0) >= 1,
  },
  {
    id: "scenario-topic",
    group: "Scenarios",
    name: "Topic expert",
    how: "Solve every scenario in one topic.",
    cheer: "A whole topic, solved.",
    icon: "checkmark-done-circle",
    color: GREEN,
    earned: (d) => Object.values(d.advanced?.byDomain ?? {}).some((x) => x.total > 0 && x.mastered >= x.total),
  },
  {
    id: "scenario-50",
    group: "Scenarios",
    name: "Problem solver",
    how: "Solve 50 scenarios.",
    cheer: "50 real problems solved in your head.",
    icon: "bulb",
    color: PURPLE,
    earned: (d) => (d.advanced?.overall.mastered ?? 0) >= 50,
  },
  {
    id: "scenario-all",
    group: "Scenarios",
    name: "Seen it all",
    how: "Solve every scenario.",
    cheer: "Every scenario in the app, solved.",
    icon: "earth",
    color: GOLD,
    earned: (d) => !!d.advanced && d.advanced.overall.total > 0 && d.advanced.overall.mastered >= d.advanced.overall.total,
  },
  {
    id: "learn-1",
    group: "Learning",
    name: "Curious",
    how: "Learn your first technique (Learn tab).",
    cheer: "New trick unlocked.",
    icon: "book",
    color: GREEN,
    earned: (d) => (d.learned ?? 0) >= 1,
  },
  {
    id: "learn-10",
    group: "Learning",
    name: "Toolkit",
    how: "Learn 10 techniques.",
    cheer: "Ten tricks in your toolkit.",
    icon: "construct",
    color: BLUE,
    earned: (d) => (d.learned ?? 0) >= 10,
  },
  {
    id: "learn-all",
    group: "Learning",
    name: "Scholar",
    how: `Learn all ${TECHNIQUES.length} techniques.`,
    cheer: "You know every technique in the library.",
    icon: "school",
    color: GOLD,
    earned: (d) => (d.learned ?? 0) >= TECHNIQUES.length,
  },
];

export const BADGES: Badge[] = RULES.map(({ earned: _e, ...b }) => b);
export const BADGE_GROUPS: BadgeGroup[] = ["Getting started", "Skills", "Speed", "Habit", "Scenarios", "Learning"];

export function earnedBadges(d: BadgeData): Set<string> {
  return new Set(RULES.filter((r) => r.earned(d)).map((r) => r.id));
}

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);

/* Which badges the user has already been shown (so we only celebrate new ones). */
const SEEN_KEY = "rapidmath.badges.seen";

export function seenBadges(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export function markBadgesSeen(ids: Iterable<string>) {
  const set = seenBadges() ?? new Set<string>();
  for (const id of ids) set.add(id);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
  } catch {
    // Ignore.
  }
}
