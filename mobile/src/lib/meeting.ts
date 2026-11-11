// Meeting warm-up: 60 seconds of numbers phrased the way they come up at work
// and in conversation. Practice only: nothing is written to the server, so
// stats live on the device (like onboarding answers).

import type { SkillTrack } from "./curriculum";

export const MEETING_SECONDS = 60;

export interface MeetingQuestion {
  /** The question as someone would say it. */
  say: string;
  /** The bare sum behind it, e.g. "18% of 250". */
  math: string;
  answer: number;
  /** For the step-by-step coaching card (same engine as lessons). */
  track?: SkillTrack;
  ops?: number[];
  /** Used when there's no coaching card for this kind of question. */
  explain?: string[];
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(xs: T[]): T => xs[rand(0, xs.length - 1)];
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const pctOf = (say: string, p: number, whole: number): MeetingQuestion => ({
  say,
  math: `${p}% of ${whole.toLocaleString("en-US")}`,
  answer: (p * whole) / 100,
  track: "percentage",
  ops: [p, whole],
});

const TEMPLATES: (() => MeetingQuestion)[] = [
  () => {
    const p = pick([10, 15, 20, 25, 30]);
    const t = 20 * rand(3, 20);
    return pctOf(`"We're at ${p}% of our $${t}K target." How much is that, in $K?`, p, t);
  },
  () => {
    const p = pick([5, 10, 15, 20, 25]);
    const a = 100 * rand(4, 60);
    return pctOf(`The client asks for ${p}% off a ${usd(a)} order. How many dollars off is that?`, p, a);
  },
  () => {
    const p = pick([10, 15, 20]);
    const b = 20 * rand(3, 15);
    return pctOf(`Dinner comes to ${usd(b)} and you want to tip ${p}%. How much is the tip?`, p, b);
  },
  () => {
    const p = pick([20, 25, 30, 40]);
    const r = 20 * rand(5, 40);
    return pctOf(`"Our margin is ${p}% on $${r}K of sales." What's the profit, in $K?`, p, r);
  },
  () => {
    const p = pick([5, 10, 20]);
    const r = 100 * rand(1, 30);
    return {
      say: `Your ${usd(r)} contract goes up ${p}% next year. What's the new price?`,
      math: `${r} + ${p}%`,
      answer: r + (r * p) / 100,
      track: "percentage",
      ops: [p, r, 1],
    };
  },
  () => {
    const p = pick([10, 20, 25, 50]);
    const price = 20 * rand(3, 15);
    return {
      say: `A ${usd(price)} jacket is ${p}% off. What do you pay?`,
      math: `${price} − ${p}%`,
      answer: price - (price * p) / 100,
      track: "percentage",
      ops: [p, price, -1],
    };
  },
  () => {
    const [a, g] = pick([
      [100, pick([5, 10, 15, 20, 30, 40])],
      [200, pick([5, 10, 15, 20, 25])],
      [400, pick([5, 10, 25, 50])],
      [500, pick([10, 20, 30])],
      [50, pick([10, 20, 40])],
    ]);
    const d = (a * g) / 100;
    return {
      say: `"Revenue went from $${a}K to $${a + d}K." What's the growth, in %?`,
      math: `${d} out of ${a}`,
      answer: g,
      explain: [`Growth is the change divided by where you started.`, `${a + d} − ${a} = ${d}`, `${d} out of ${a} is ${g}%.`],
    };
  },
  () => {
    const n = rand(3, 8);
    const e = rand(15, 60);
    return {
      say: `The bill is ${usd(n * e)}, split ${n} ways. How much does each person pay?`,
      math: `${n * e} ÷ ${n}`,
      answer: e,
      track: "division",
      ops: [n * e, n],
    };
  },
  () => {
    const w = pick([4, 5, 6, 8, 10, 12]);
    const x = rand(12, 90);
    return {
      say: `"We need ${(w * x).toLocaleString("en-US")} sign-ups in ${w} weeks." How many per week?`,
      math: `${w * x} ÷ ${w}`,
      answer: x,
      track: "division",
      ops: [w * x, w],
    };
  },
  () => {
    const h = pick([4, 5, 6, 8]);
    const r = 5 * rand(5, 19);
    return {
      say: `A ${h}-hour job is quoted at ${usd(h * r)}. What's the hourly rate, in $?`,
      math: `${h * r} ÷ ${h}`,
      answer: r,
      track: "division",
      ops: [h * r, h],
    };
  },
  () => {
    const s = rand(12, 60);
    const c = pick([5, 9, 12, 15, 20, 25]);
    return {
      say: `${s} seats at ${usd(c)} a month each. What's the monthly total, in $?`,
      math: `${s} × ${c}`,
      answer: s * c,
      track: "multiplication",
      ops: [s, c],
    };
  },
  () => {
    const m = rand(15, 80);
    return {
      say: `"We bring in $${m}K a month." What's that for the year, in $K?`,
      math: `${m} × 12`,
      answer: m * 12,
      track: "multiplication",
      ops: [m, 12],
    };
  },
  () => {
    const b = 10 * rand(15, 90);
    const s = rand(60, b - 20);
    return {
      say: `"Our budget is $${b}K and we've spent $${s}K." How much is left, in $K?`,
      math: `${b} − ${s}`,
      answer: b - s,
      track: "subtraction",
      ops: [b, s],
    };
  },
  () => {
    const a = rand(120, 700);
    const b = a + rand(15, 250);
    return {
      say: `${a} sign-ups last month, ${b} this month. How many more is that?`,
      math: `${b} − ${a}`,
      answer: b - a,
      track: "subtraction",
      ops: [b, a],
    };
  },
  () => {
    const a = rand(25, 480);
    const b = rand(25, 480);
    return {
      say: `Two deals closed this week: $${a}K and $${b}K. What's the total, in $K?`,
      math: `${a} + ${b}`,
      answer: a + b,
      track: "addition",
      ops: [a, b],
    };
  },
  () => {
    const total = pick([30, 45, 60, 90]);
    const used = rand(7, total - 6);
    return {
      say: `The call is booked for ${total} minutes and you're ${used} minutes in. How many minutes are left?`,
      math: `${total} − ${used}`,
      answer: total - used,
      track: "subtraction",
      ops: [total, used],
    };
  },
  () => {
    const n = pick([4, 6, 8, 12]);
    const u = rand(3, 25);
    return {
      say: `A pack of ${n} costs ${usd(n * u)}. What's the price per item, in $?`,
      math: `${n * u} ÷ ${n}`,
      answer: u,
      track: "division",
      ops: [n * u, n],
    };
  },
];

/** A shuffled set of questions, no template twice in a row. */
export function buildMeetingRound(count = 30): MeetingQuestion[] {
  const out: MeetingQuestion[] = [];
  let last = -1;
  while (out.length < count) {
    let i = rand(0, TEMPLATES.length - 1);
    if (i === last) i = (i + 1) % TEMPLATES.length;
    last = i;
    out.push(TEMPLATES[i]());
  }
  return out;
}

/* Stats, kept on the device. */

export interface MeetingStats {
  rounds: number;
  best: number;
  lastPlayed: string | null;
}

const KEY = "rapidmath.meeting";
const EMPTY: MeetingStats = { rounds: 0, best: 0, lastPlayed: null };

export function getMeetingStats(): MeetingStats {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<MeetingStats>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Saves a finished round. Returns the previous best (to spot a new record). */
export function recordMeetingRound(correct: number): { previousBest: number; stats: MeetingStats } {
  const prev = getMeetingStats();
  const stats: MeetingStats = {
    rounds: prev.rounds + 1,
    best: Math.max(prev.best, correct),
    lastPlayed: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Ignore.
  }
  return { previousBest: prev.best, stats };
}
