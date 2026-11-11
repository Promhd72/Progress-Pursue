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
export const FREE_MAX_LEVEL = 4;   // Free users can play L1–L4
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

// ---------- The skill ladder ----------
// Each level teaches one named skill. Questions are generated to exercise
// exactly that skill, and the coaching method matches it.

export interface LevelDef {
  /** Skill name, e.g. "Crossing 10". */
  name: string;
  /** What you'll be able to do after passing. */
  outcome: string;
  /** Where this shows up in real life. */
  context?: string;
  /** Target average seconds per question for 3 stars. */
  targetSec: number;
  /** Operands for the worked example on the Learn card. */
  example: number[];
  /** Generates operands for one question. */
  gen: () => number[];
}

const pickOne = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
/** Random integer in [lo, hi] whose last digit is NOT in `avoid`. */
function randAvoiding(lo: number, hi: number, avoid: number[]): number {
  for (let i = 0; i < 200; i++) {
    const n = rand(lo, hi);
    if (!avoid.includes(n % 10)) return n;
  }
  return lo;
}
/** Retry a generator until a condition holds. */
function until(gen: () => number[], ok: (o: number[]) => boolean): number[] {
  for (let i = 0; i < 500; i++) {
    const o = gen();
    if (ok(o)) return o;
  }
  return gen();
}
const NO89 = [8, 9];

/** Builds the question text and answer from operands. */
export function buildQuestion(track: SkillTrack, ops: number[]): Question {
  const [a, b, mode] = ops;
  switch (track) {
    case "addition":
      return { prompt: `${a} + ${b}`, answer: a + b, ops, track };
    case "subtraction":
      return { prompt: `${a} − ${b}`, answer: a - b, ops, track };
    case "multiplication":
      return { prompt: `${a} × ${b}`, answer: a * b, ops, track };
    case "division":
      return { prompt: `${a} ÷ ${b}`, answer: a / b, ops, track };
    case "percentage": {
      const part = (b * a) / 100;
      if (mode === 1) return { prompt: `${b} + ${a}%`, answer: b + part, ops, track };
      if (mode === -1) return { prompt: `${b} − ${a}%`, answer: b - part, ops, track };
      return { prompt: `${a}% of ${b}`, answer: part, ops: [a, b], track };
    }
  }
}

const pct = (p: number, mult: number, lo: number, hi: number) => [p, mult * rand(lo, hi)];

export const LADDER: Record<SkillTrack, LevelDef[]> = {
  addition: [
    {
      name: "Count on",
      outcome: "Add small numbers instantly, without counting on your fingers.",
      targetSec: 3,
      example: [6, 3],
      gen: () => until(() => [rand(3, 8), rand(1, 4)], ([a, b]) => a + b <= 10),
    },
    {
      name: "Crossing 10",
      outcome: "Add two single digits that go past 10, like 8 + 7, in a flash.",
      targetSec: 3,
      example: [8, 7],
      gen: () => until(() => [rand(5, 9), rand(3, 9)], ([a, b]) => a + b > 10),
    },
    {
      name: "Bridge to the next ten",
      outcome: "Add a single digit to any two-digit number, like 47 + 6.",
      context: "Adding a small extra to a running total.",
      targetSec: 3.5,
      example: [47, 6],
      gen: () => until(() => [rand(21, 87), rand(3, 9)], ([a, b]) => (a % 10) + b > 10 && a % 10 < 8),
    },
    {
      name: "Tens, then ones",
      outcome: "Add two-digit numbers that don't carry, like 42 + 35.",
      targetSec: 4,
      example: [42, 35],
      gen: () =>
        until(
          () => [randAvoiding(11, 77, NO89), randAvoiding(11, 77, NO89)],
          ([a, b]) => (a % 10) + (b % 10) <= 9 && tensDigit(a) + tensDigit(b) <= 9,
        ),
    },
    {
      name: "Carrying",
      outcome: "Add any two two-digit numbers, like 47 + 38, in your head.",
      context: "Adding up two items on a bill.",
      targetSec: 5,
      example: [47, 36],
      gen: () =>
        until(
          () => [randAvoiding(14, 67, NO89), randAvoiding(14, 67, NO89)],
          ([a, b]) => (a % 10) + (b % 10) >= 10 && tensDigit(a) + tensDigit(b) <= 8,
        ),
    },
    {
      name: "Round up, then fix",
      outcome: "Add numbers like 56 + 29 by rounding 29 to 30 and fixing it.",
      context: "Prices like $29 or $49: round them up, then take back the change.",
      targetSec: 5,
      example: [56, 29],
      gen: () => [randAvoiding(21, 79, NO89), tensDigit(rand(19, 79)) * 10 + pickOne([8, 9])],
    },
    {
      name: "Three digits + two digits",
      outcome: "Add a two-digit number to a three-digit one, like 245 + 38.",
      targetSec: 6,
      example: [245, 37],
      gen: () => [randAvoiding(101, 879, NO89), randAvoiding(11, 77, NO89)],
    },
    {
      name: "Round hundreds and tens",
      outcome: "Add round amounts like 340 + 270 without writing anything down.",
      context: "Adding budgets or headcounts.",
      targetSec: 6,
      example: [340, 270],
      gen: () => [rand(11, 69) * 10, rand(11, 39) * 10],
    },
    {
      name: "Three digits + three digits",
      outcome: "Add two three-digit numbers, like 368 + 457, by place value.",
      targetSec: 8,
      example: [365, 457],
      gen: () => [randAvoiding(112, 497, NO89), randAvoiding(112, 497, NO89)],
    },
    {
      name: "Near-round big sums",
      outcome: "Add big numbers like 499 + 376 by rounding to 500.",
      context: "Totals with prices like $499 or $1,999.",
      targetSec: 7,
      example: [499, 376],
      gen: () => [rand(2, 7) * 100 - pickOne([1, 2]), randAvoiding(112, 497, NO89)],
    },
  ],
  subtraction: [
    {
      name: "Take away within 10",
      outcome: "Subtract small numbers instantly.",
      targetSec: 3,
      example: [9, 4],
      gen: () => until(() => [rand(4, 9), rand(1, 8)], ([a, b]) => b < a),
    },
    {
      name: "Back over 10",
      outcome: "Take a single digit from a teen, like 15 − 7.",
      targetSec: 3,
      example: [15, 7],
      gen: () => until(() => [rand(11, 18), rand(3, 9)], ([a, b]) => b > a % 10),
    },
    {
      name: "Drop through the ten",
      outcome: "Take a single digit from a bigger number, like 43 − 7.",
      targetSec: 3.5,
      example: [43, 7],
      gen: () => until(() => [rand(31, 98), rand(3, 9)], ([a, b]) => b > a % 10),
    },
    {
      name: "Tens, then ones",
      outcome: "Subtract two-digit numbers with no borrowing, like 87 − 42.",
      targetSec: 4,
      example: [87, 42],
      gen: () =>
        until(
          () => [rand(45, 99), randAvoiding(11, 67, NO89)],
          ([a, b]) => b % 10 <= a % 10 && a - b > 20,
        ),
    },
    {
      name: "Count up the gap",
      outcome: "Find the gap between close numbers, like 52 − 47, by counting up.",
      context: "Working out change, or how far you are from a target.",
      targetSec: 4,
      example: [52, 47],
      gen: () => until(() => { const b = rand(21, 89); return [b + rand(3, 15), b]; }, ([a, b]) => a % 10 < b % 10 && a <= 99),
    },
    {
      name: "Borrowing",
      outcome: "Subtract two-digit numbers that need borrowing, like 72 − 38.",
      targetSec: 5,
      example: [72, 36],
      gen: () =>
        until(
          () => [rand(41, 99), randAvoiding(12, 67, NO89)],
          ([a, b]) => b % 10 > a % 10 && a - b > 20,
        ),
    },
    {
      name: "Take a round number, give back",
      outcome: "Subtract numbers like 29 or 98 by taking 30 or 100 and adding back.",
      context: "Taking away prices like $99.",
      targetSec: 5,
      example: [84, 29],
      gen: () => {
        const b = tensDigit(rand(19, 69)) * 10 + pickOne([8, 9]);
        return [b + rand(25, 120), b];
      },
    },
    {
      name: "Three digits − two digits",
      outcome: "Take a two-digit number from a three-digit one, like 245 − 67.",
      targetSec: 6,
      example: [245, 67],
      gen: () => until(() => [rand(121, 899), randAvoiding(21, 87, NO89)], ([a, b]) => a - b > 20),
    },
    {
      name: "Three digits − three digits",
      outcome: "Subtract three-digit numbers, like 624 − 375.",
      targetSec: 8,
      example: [624, 375],
      gen: () => until(() => [rand(321, 989), randAvoiding(112, 697, NO89)], ([a, b]) => a - b > 20),
    },
    {
      name: "Change from a round amount",
      outcome: "Work out change from 100, 500 or 1,000 instantly.",
      context: "What's left from a $500 or $1,000 budget.",
      targetSec: 7,
      example: [1000, 365],
      gen: () => {
        const a = pickOne([100, 200, 500, 1000]);
        return [a, randAvoiding(Math.round(a * 0.2), a - 25, [0, 8, 9])];
      },
    },
  ],
  multiplication: [
    {
      name: "×2, ×5, ×10",
      outcome: "Know the 2, 5 and 10 times tables cold.",
      targetSec: 3,
      example: [7, 5],
      gen: () => [rand(2, 10), pickOne([2, 5, 10])],
    },
    {
      name: "×3 and ×4",
      outcome: "Know the 3 and 4 times tables cold.",
      targetSec: 3,
      example: [6, 4],
      gen: () => [rand(3, 10), pickOne([3, 4])],
    },
    {
      name: "×6 to ×9",
      outcome: "Handle the harder tables: 6, 7, 8 and 9.",
      targetSec: 3.5,
      example: [7, 8],
      gen: () => [rand(3, 9), pickOne([6, 7, 8, 9])],
    },
    {
      name: "Mixed times tables",
      outcome: "Any times-table fact from 2 × 2 to 10 × 10, fast.",
      targetSec: 3,
      example: [8, 6],
      gen: () => [rand(2, 10), rand(2, 10)],
    },
    {
      name: "Tens × a digit",
      outcome: "Multiply round numbers like 40 × 6 by hiding the zero.",
      context: "Like 6 items at $40 each.",
      targetSec: 3.5,
      example: [40, 6],
      gen: () => [rand(2, 9) * 10, pickOne([3, 6, 7, 8])],
    },
    {
      name: "Two digits × a digit",
      outcome: "Multiply numbers like 23 × 4 by splitting into tens and ones.",
      targetSec: 5,
      example: [23, 6],
      gen: () => [randAvoiding(12, 49, [0]), pickOne([3, 6, 7, 8])],
    },
    {
      name: "×9 and ×11 tricks",
      outcome: "Use the ×9 and ×11 shortcuts on two-digit numbers.",
      targetSec: 5,
      example: [42, 11],
      gen: () => [randAvoiding(12, 89, [0]), pickOne([9, 11])],
    },
    {
      name: "Bigger two digits × a digit",
      outcome: "Multiply numbers like 68 × 7 in your head.",
      context: "Like 7 nights at $68.",
      targetSec: 6,
      example: [68, 7],
      gen: () => [randAvoiding(51, 99, [0]), pickOne([3, 6, 7, 8])],
    },
    {
      name: "Two digits × teens",
      outcome: "Multiply by numbers like 12, 13 or 15.",
      context: "Monthly to yearly: × 12.",
      targetSec: 8,
      example: [24, 13],
      gen: () => [randAvoiding(21, 59, [0]), rand(12, 19)],
    },
    {
      name: "Two digits × two digits",
      outcome: "Multiply two two-digit numbers, like 46 × 25.",
      targetSec: 10,
      example: [46, 25],
      gen: () => [randAvoiding(21, 69, [0]), randAvoiding(21, 49, [0])],
    },
  ],
  division: [
    {
      name: "÷2, ÷5, ÷10",
      outcome: "Divide by 2, 5 and 10 instantly.",
      targetSec: 3,
      example: [35, 5],
      gen: () => { const d = pickOne([2, 5, 10]); return [d * rand(2, 10), d]; },
    },
    {
      name: "÷3 and ÷4",
      outcome: "Divide by 3 and 4 using the times tables backwards.",
      targetSec: 3,
      example: [24, 4],
      gen: () => { const d = pickOne([3, 4]); return [d * rand(2, 10), d]; },
    },
    {
      name: "÷6 to ÷9",
      outcome: "Divide by 6, 7, 8 and 9 using the times tables backwards.",
      targetSec: 3.5,
      example: [56, 7],
      gen: () => { const d = pickOne([6, 7, 8, 9]); return [d * rand(3, 10), d]; },
    },
    {
      name: "Mixed division facts",
      outcome: "Any division fact from the 2 to 10 times tables, fast.",
      targetSec: 3,
      example: [63, 9],
      gen: () => { const d = rand(2, 10); return [d * rand(2, 10), d]; },
    },
    {
      name: "Hide the zero",
      outcome: "Divide round numbers like 240 ÷ 6 by hiding the zero.",
      targetSec: 4,
      example: [240, 6],
      gen: () => { const d = pickOne([3, 6, 7, 9]); return [d * rand(2, 9) * 10, d]; },
    },
    {
      name: "Beyond the tables",
      outcome: "Divide numbers like 84 ÷ 6 that go past the times tables.",
      targetSec: 5,
      example: [84, 6],
      gen: () => { const d = pickOne([3, 4, 6, 7, 8]); return [d * rand(11, 19), d]; },
    },
    {
      name: "Three digits ÷ a digit",
      outcome: "Divide three-digit numbers like 252 ÷ 7, one digit at a time.",
      context: "Sharing a cost between a few people.",
      targetSec: 7,
      example: [252, 7],
      gen: () => { const d = pickOne([3, 6, 7, 9]); return [d * randAvoiding(21, 49, [0]), d]; },
    },
    {
      name: "÷5 at speed",
      outcome: "Divide big numbers by 5 by doubling, then taking a 0 off.",
      targetSec: 5,
      example: [345, 5],
      gen: () => [5 * rand(21, 99), 5],
    },
    {
      name: "Divide by teens",
      outcome: "Divide by 12, 13, 14 or 15.",
      context: "Yearly to monthly: ÷ 12.",
      targetSec: 8,
      example: [156, 12],
      gen: () => { const d = rand(12, 15); return [d * rand(6, 19), d]; },
    },
    {
      name: "Split the bill",
      outcome: "Divide bigger amounts between groups, like 432 ÷ 12.",
      context: "Splitting a team dinner bill.",
      targetSec: 9,
      example: [432, 12],
      gen: () => { const d = pickOne([12, 15, 16, 24, 25]); return [d * randAvoiding(11, 39, [0]), d]; },
    },
  ],
  percentage: [
    {
      name: "50% and 10%",
      outcome: "Find half and a tenth of any round number.",
      targetSec: 4,
      example: [10, 240],
      gen: () => pct(pickOne([50, 10]), 10, 1, 30),
    },
    {
      name: "25% and 75%",
      outcome: "Find a quarter and three quarters of a number.",
      targetSec: 4,
      example: [25, 80],
      gen: () => pct(pickOne([25, 75]), 4, 2, 30),
    },
    {
      name: "20% and 5%",
      outcome: "Find 20% and 5% using 10% as your anchor.",
      context: "5% is a common sales tax or VAT rate.",
      targetSec: 5,
      example: [5, 360],
      gen: () => (Math.random() < 0.5 ? pct(20, 5, 2, 40) : pct(5, 20, 1, 25)),
    },
    {
      name: "15%, 30% and 40%",
      outcome: "Build any percentage from 10% and 5%.",
      context: "A 15% tip.",
      targetSec: 5,
      example: [15, 240],
      gen: () => pct(pickOne([15, 30, 40]), 20, 1, 20),
    },
    {
      name: "1%, 2% and 3%",
      outcome: "Find small percentages of big numbers using 1%.",
      context: "Fees and commissions.",
      targetSec: 5,
      example: [3, 1200],
      gen: () => pct(pickOne([1, 2, 3]), 100, 2, 30),
    },
    {
      name: "12% and 18%",
      outcome: "Find awkward percentages by nudging from 10% or 20%.",
      targetSec: 6,
      example: [12, 350],
      gen: () => pct(pickOne([12, 18]), 50, 1, 20),
    },
    {
      name: "Add VAT",
      outcome: "Add 5% VAT to a price in your head.",
      context: "Shelf price to what you actually pay at the till.",
      targetSec: 7,
      example: [5, 240, 1],
      gen: () => [5, 20 * rand(2, 40), 1],
    },
    {
      name: "Discounts",
      outcome: "Work out the sale price after a discount.",
      context: "Sale-season prices: 20%, 25% or 50% off.",
      targetSec: 7,
      example: [20, 350, -1],
      gen: () => {
        const p = pickOne([10, 20, 25, 50]);
        return [p, (p === 25 ? 4 : 10) * rand(5, 40), -1];
      },
    },
    {
      name: "Swap and build",
      outcome: "Use the swap trick (12% of 25 = 25% of 12) and build odd percentages.",
      targetSec: 7,
      example: [12, 25],
      gen: () =>
        pickOne([
          () => [pickOne([4, 8, 12, 16, 28, 36]), 25],
          () => [pickOne([14, 16, 18, 22, 26]), 50],
          () => pct(pickOne([35, 45]), 20, 1, 20),
        ])(),
    },
    {
      name: "Real-life mix",
      outcome: "VAT, discounts, tips and shares, mixed together, at speed.",
      context: "Everything you'll meet at work and when shopping.",
      targetSec: 8,
      example: [15, 420],
      gen: () =>
        pickOne([
          () => [5, 20 * rand(2, 40), 1],
          () => [pickOne([10, 20, 25]), 20 * rand(3, 30), -1],
          () => pct(pickOne([15, 30, 40]), 20, 1, 30),
          () => pct(pickOne([12, 18]), 50, 1, 20),
        ])(),
    },
  ],
};

function tensDigit(n: number) {
  return Math.floor(n / 10) % 10;
}

export function levelDef(track: SkillTrack, level: number): LevelDef {
  const list = LADDER[track];
  return list[Math.min(Math.max(level, 1), list.length) - 1];
}

export function generateForLevel(track: SkillTrack, level: number): Question {
  return buildQuestion(track, levelDef(track, level).gen());
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

// ---------- Level descriptions (for the curriculum roadmap) ----------

export interface LevelSummary {
  name: string;
  outcome: string;
  context?: string;
  targetSec: number;
  /** A typical question at this level. */
  example: string;
}

export function levelSummary(track: SkillTrack, level: number): LevelSummary {
  const d = levelDef(track, level);
  return { name: d.name, outcome: d.outcome, context: d.context, targetSec: d.targetSec, example: buildQuestion(track, d.example).prompt };
}

/** Stars for a passed lesson: 1 for passing, 2 within 1.5× the target time, 3 within the target. */
export function starsFor(track: SkillTrack, level: number, passed: boolean, avgSec: number): number {
  if (!passed) return 0;
  const t = levelDef(track, level).targetSec;
  return avgSec <= t ? 3 : avgSec <= t * 1.5 ? 2 : 1;
}
