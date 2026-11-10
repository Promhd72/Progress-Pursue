// Curriculum: 5 skill tracks × 10 levels each.
// Each level is a single lesson of 10 questions at a fixed difficulty band.

export type SkillTrack = "addition" | "subtraction" | "multiplication" | "division" | "percentage";

export const TRACKS: SkillTrack[] = ["addition", "subtraction", "multiplication", "division", "percentage"];

export const TRACK_LABELS: Record<SkillTrack, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  percentage: "Percentages",
};

export const TRACK_SYMBOL: Record<SkillTrack, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
  percentage: "%",
};

export const MAX_LEVEL = 10;
export const QUESTIONS_PER_LESSON = 10;
export const PASS_THRESHOLD = 0.8; // 80% correct to pass
export const FREE_MAX_LEVEL = 2;   // Free users can play L1–L2
export const FREE_DAILY_LESSONS = 3;

export interface Question {
  prompt: string;
  answer: number;
  /** Operands behind the prompt, used to derive coaching tips. */
  ops?: number[];
  /** Track the question was generated for. */
  track?: SkillTrack;
}


const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Difficulty knobs grow smoothly with level.
function addBand(level: number): [number, number] {
  // L1: 2–20 ... L10: 200–999
  const lo = Math.round(2 + (level - 1) * 22);
  const hi = Math.round(20 + (level - 1) * 110);
  return [lo, Math.min(999, hi)];
}
function subBand(level: number): [number, number] {
  const lo = Math.round(2 + (level - 1) * 18);
  const hi = Math.round(20 + (level - 1) * 100);
  return [lo, Math.min(999, hi)];
}
function mulBand(level: number): { a: [number, number]; b: [number, number] } {
  // L1: 2..5 × 2..5  → L10: 12..99 × 11..25
  return {
    a: [2 + Math.floor((level - 1) * 1.1), 5 + Math.floor((level - 1) * 10)],
    b: [2 + Math.floor((level - 1) * 0.9), 5 + Math.floor((level - 1) * 2.2)],
  };
}
function divBand(level: number): { divisor: [number, number]; quotient: [number, number] } {
  return {
    divisor: [2 + Math.floor((level - 1) * 0.8), 5 + Math.floor((level - 1) * 1.5)],
    quotient: [2 + Math.floor((level - 1) * 0.9), 5 + Math.floor((level - 1) * 3)],
  };
}
function pctPool(level: number): number[] {
  if (level <= 2) return [10, 25, 50];
  if (level <= 4) return [10, 20, 25, 50, 75];
  if (level <= 6) return [5, 10, 15, 20, 25, 50, 75];
  if (level <= 8) return [5, 12, 15, 18, 20, 22, 25, 35, 45];
  return [3, 7, 12, 13, 17, 22, 28, 33, 45];
}

export function generateForLevel(track: SkillTrack, level: number): Question {
  switch (track) {
    case "addition": {
      const [lo, hi] = addBand(level);
      const a = rand(lo, hi);
      const b = rand(lo, hi);
      return { prompt: `${a} + ${b}`, answer: a + b, ops: [a, b], track };
    }
    case "subtraction": {
      const [lo, hi] = subBand(level);
      const a = rand(lo, hi);
      const b = rand(lo, a);
      return { prompt: `${a} − ${b}`, answer: a - b, ops: [a, b], track };
    }
    case "multiplication": {
      const { a: ra, b: rb } = mulBand(level);
      const a = rand(...ra);
      const b = rand(...rb);
      return { prompt: `${a} × ${b}`, answer: a * b, ops: [a, b], track };
    }
    case "division": {
      const { divisor, quotient } = divBand(level);
      const b = rand(...divisor);
      const ans = rand(...quotient);
      return { prompt: `${b * ans} ÷ ${b}`, answer: ans, ops: [b * ans, b], track };
    }
    case "percentage": {
      const pcts = pctPool(level);
      const pct = pcts[rand(0, pcts.length - 1)];
      const baseMultiples = Math.max(1, 100 / gcd(pct, 100));
      const multiplier = level <= 3 ? rand(1, 6) : level <= 6 ? rand(2, 15) : rand(3, 30);
      const whole = baseMultiples * multiplier;
      return { prompt: `${pct}% of ${whole}`, answer: (whole * pct) / 100, ops: [pct, whole], track };
    }
  }

}

export function generateLesson(track: SkillTrack, level: number, count = QUESTIONS_PER_LESSON): Question[] {
  return Array.from({ length: count }, () => generateForLevel(track, level));
}

// XP per correct answer scales with level (gentler than the old difficulty multiplier).
export function xpForLesson(correct: number, level: number): number {
  return correct * Math.max(1, Math.ceil(level / 2));
}

// ---------- Placement test ----------

export interface PlacementQuestion extends Question {
  track: SkillTrack;
  weight: number; // points awarded for a correct answer (1..3 based on difficulty)
}

export const PLACEMENT_LENGTH = 10;

// Deterministic-ish structure: each track gets exactly 2 questions
// across an easy → medium → hard ramp.
export function buildPlacement(): PlacementQuestion[] {
  // Map: difficulty step (level) and weight per question slot.
  const plan: Array<{ track: SkillTrack; level: number; weight: number }> = [
    // easy
    { track: "addition", level: 2, weight: 1 },
    { track: "subtraction", level: 2, weight: 1 },
    { track: "multiplication", level: 2, weight: 1 },
    // medium
    { track: "division", level: 4, weight: 2 },
    { track: "percentage", level: 4, weight: 2 },
    { track: "addition", level: 6, weight: 2 },
    { track: "subtraction", level: 6, weight: 2 },
    // hard
    { track: "multiplication", level: 8, weight: 3 },
    { track: "division", level: 8, weight: 3 },
    { track: "percentage", level: 9, weight: 3 },
  ];
  return plan.map(({ track, level, weight }) => ({ ...generateForLevel(track, level), track, weight }));
}

// Convert per-track weighted scores (0..max) into a starting level (1..5).
export function placementToLevel(score: number, maxScore: number): number {
  if (maxScore <= 0) return 1;
  const ratio = score / maxScore;
  if (ratio >= 1) return 5;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}
