// Pure functions for question generation, scoring, XP, and level.

export type DrillType = "addition" | "subtraction" | "multiplication" | "division" | "percentage" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  prompt: string;
  answer: number;
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

type Range = [number, number];
function rangeFor(difficulty: Difficulty): { small: Range; mid: Range; large: Range } {
  switch (difficulty) {
    case "easy": return { small: [2, 12], mid: [10, 50], large: [10, 100] };
    case "medium": return { small: [3, 15], mid: [20, 200], large: [50, 500] };
    case "hard": return { small: [6, 25], mid: [50, 999], large: [100, 9999] };
  }
}

function makeAddition(d: Difficulty): Question {
  const r = rangeFor(d);
  const a = rand(...r.mid);
  const b = rand(...r.mid);
  return { prompt: `${a} + ${b}`, answer: a + b };
}

function makeSubtraction(d: Difficulty): Question {
  const r = rangeFor(d);
  const a = rand(...r.mid);
  const b = rand(r.mid[0], a);
  return { prompt: `${a} − ${b}`, answer: a - b };
}

function makeMultiplication(d: Difficulty): Question {
  const r = rangeFor(d);
  const a = rand(...r.small);
  const b = d === "hard" ? rand(...r.mid) : rand(...r.small);
  return { prompt: `${a} × ${b}`, answer: a * b };
}

function makeDivision(d: Difficulty): Question {
  const r = rangeFor(d);
  const b = rand(r.small[0], r.small[1]);
  const ans = rand(r.small[0], r.small[1]);
  const a = b * ans;
  return { prompt: `${a} ÷ ${b}`, answer: ans };
}

function makePercentage(d: Difficulty): Question {
  // Keep answers integers: pct% of whole where pct is 5,10,15,20,25,50,75
  const pcts = d === "easy" ? [10, 25, 50] : d === "medium" ? [5, 10, 15, 20, 25, 50, 75] : [3, 7, 12, 15, 18, 22, 35, 45];
  const pct = pcts[rand(0, pcts.length - 1)];
  // Choose whole so that whole*pct/100 is integer
  const baseMultiples = Math.max(1, 100 / gcd(pct, 100));
  const multiplier = d === "hard" ? rand(2, 40) : rand(1, 12);
  const whole = baseMultiples * multiplier;
  return { prompt: `${pct}% of ${whole}`, answer: (whole * pct) / 100 };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const generators: Record<Exclude<DrillType, "mixed">, (d: Difficulty) => Question> = {
  addition: makeAddition,
  subtraction: makeSubtraction,
  multiplication: makeMultiplication,
  division: makeDivision,
  percentage: makePercentage,
};

export function generateQuestion(type: DrillType, difficulty: Difficulty): Question {
  if (type === "mixed") {
    const keys = Object.keys(generators) as Array<keyof typeof generators>;
    const pick = keys[rand(0, keys.length - 1)];
    return generators[pick](difficulty);
  }
  return generators[type](difficulty);
}

export function difficultyMultiplier(d: Difficulty): number {
  return d === "easy" ? 1 : d === "medium" ? 2 : 3;
}

export function xpFor(correct: number, difficulty: Difficulty): number {
  return correct * difficultyMultiplier(difficulty);
}

// Level thresholds: cumulative XP required to *reach* level N.
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 24000, 48000];

export function levelForXp(xp: number): { level: number; into: number; toNext: number; nextAt: number } {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const currentAt = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextAt = LEVEL_THRESHOLDS[level] ?? currentAt + 50000;
  return { level, into: xp - currentAt, toNext: nextAt - xp, nextAt };
}

export const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  percentage: "Percentages",
  mixed: "Mixed",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Rank names for XP tiers (separate from track levels, which are skills). */
export const RANKS = ["Starter", "Learner", "Quick", "Sharp", "Swift", "Fluent", "Rapid", "Expert", "Elite", "Mastermind"];

export function rankForXp(xp: number) {
  const l = levelForXp(xp);
  const name = RANKS[Math.min(l.level, RANKS.length) - 1];
  const next = l.level < RANKS.length ? RANKS[l.level] : null;
  return { ...l, name, next };
}
