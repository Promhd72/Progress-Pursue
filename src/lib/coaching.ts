// Derives a short, plain-language "how to do it in your head" tip for any
// generated curriculum question. Pure functions — no dependencies.

import type { SkillTrack } from "./curriculum";

export interface CoachingTip {
  headline: string;
  steps: string[];
}

const nf = (n: number) => {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
};

function roundTarget(n: number): number {
  if (n >= 100) return Math.round(n / 100) * 100;
  return Math.round(n / 10) * 10;
}

function additionTip(a: number, b: number): CoachingTip {
  // Round the second number to a friendly target, then correct.
  const target = roundTarget(b);
  const diff = target - b;
  if (diff === 0 || target === 0) {
    return {
      headline: "Split into place values",
      steps: [
        `Add the big parts first, then the rest.`,
        `${nf(a)} + ${nf(b)} = ${nf(a + b)}.`,
      ],
    };
  }
  const mid = a + target;
  return {
    headline: "Round, add, then correct",
    steps: [
      `Push ${nf(b)} up to ${nf(target)}: ${nf(a)} + ${nf(target)} = ${nf(mid)}.`,
      diff > 0
        ? `You added ${nf(diff)} too much — take it back: ${nf(mid)} − ${nf(diff)} = ${nf(a + b)}.`
        : `You were ${nf(-diff)} short — add it back: ${nf(mid)} + ${nf(-diff)} = ${nf(a + b)}.`,
    ],
  };
}

function subtractionTip(a: number, b: number): CoachingTip {
  const target = roundTarget(b);
  const diff = target - b;
  if (diff === 0) {
    return {
      headline: "Count up from the smaller number",
      steps: [
        `From ${nf(b)}, how far to ${nf(a)}?`,
        `${nf(b)} + ${nf(a - b)} = ${nf(a)}, so the answer is ${nf(a - b)}.`,
      ],
    };
  }
  const mid = a - target;
  return {
    headline: "Round, subtract, then correct",
    steps: [
      `Take off ${nf(target)} instead: ${nf(a)} − ${nf(target)} = ${nf(mid)}.`,
      diff > 0
        ? `You removed ${nf(diff)} too much — add it back: ${nf(mid)} + ${nf(diff)} = ${nf(a - b)}.`
        : `You removed ${nf(-diff)} too little — take it off: ${nf(mid)} − ${nf(-diff)} = ${nf(a - b)}.`,
    ],
  };
}

function multiplicationTip(a: number, b: number): CoachingTip {
  // Prefer the tricks first.
  if (b === 5 || a === 5) {
    const other = b === 5 ? a : b;
    return {
      headline: "×5 is ×10, halved",
      steps: [
        `${nf(other)} × 10 = ${nf(other * 10)}.`,
        `Halve it: ${nf((other * 10) / 2)}.`,
      ],
    };
  }
  if (b === 9 || a === 9) {
    const other = b === 9 ? a : b;
    return {
      headline: "×9 is ×10 minus one",
      steps: [
        `${nf(other)} × 10 = ${nf(other * 10)}.`,
        `Subtract one ${nf(other)}: ${nf(other * 10)} − ${nf(other)} = ${nf(other * 9)}.`,
      ],
    };
  }
  if (b === 4 || a === 4) {
    const other = b === 4 ? a : b;
    return {
      headline: "×4 is double, doubled",
      steps: [
        `Double ${nf(other)} → ${nf(other * 2)}.`,
        `Double again → ${nf(other * 4)}.`,
      ],
    };
  }
  // Split the larger factor into tens + units.
  const [big, small] = a >= b ? [a, b] : [b, a];
  const tens = Math.floor(big / 10) * 10;
  const units = big - tens;
  if (tens > 0 && units > 0) {
    return {
      headline: "Break one factor apart",
      steps: [
        `${nf(tens)} × ${nf(small)} = ${nf(tens * small)}.`,
        `${nf(units)} × ${nf(small)} = ${nf(units * small)}. Add them: ${nf(a * b)}.`,
      ],
    };
  }
  return {
    headline: "Keep it in round chunks",
    steps: [`${nf(a)} × ${nf(b)} = ${nf(a * b)} — a clean multiple, worth memorising.`],
  };
}

function divisionTip(dividend: number, divisor: number): CoachingTip {
  const answer = dividend / divisor;
  if (divisor === 4) {
    return {
      headline: "÷4 is halve, then halve again",
      steps: [
        `Half of ${nf(dividend)} is ${nf(dividend / 2)}.`,
        `Half again: ${nf(answer)}.`,
      ],
    };
  }
  if (divisor === 5) {
    return {
      headline: "÷5 is double, then ÷10",
      steps: [
        `Double ${nf(dividend)} → ${nf(dividend * 2)}.`,
        `Drop a zero: ${nf(answer)}.`,
      ],
    };
  }
  // Chunk the dividend into a friendly multiple plus a remainder chunk.
  const chunk = Math.floor(answer / 10) * 10 * divisor;
  const rest = dividend - chunk;
  if (chunk > 0 && rest > 0) {
    return {
      headline: "Chunk the big number",
      steps: [
        `${nf(chunk)} ÷ ${nf(divisor)} = ${nf(chunk / divisor)}.`,
        `${nf(rest)} ÷ ${nf(divisor)} = ${nf(rest / divisor)}. Add them: ${nf(answer)}.`,
      ],
    };
  }
  return {
    headline: "Think in multiples",
    steps: [
      `How many ${nf(divisor)}s fit in ${nf(dividend)}?`,
      `${nf(divisor)} × ${nf(answer)} = ${nf(dividend)}, so the answer is ${nf(answer)}.`,
    ],
  };
}

function percentageTip(pct: number, whole: number): CoachingTip {
  const answer = (whole * pct) / 100;
  const ten = whole / 10;
  const one = whole / 100;

  if (pct === 50) {
    return { headline: "50% is just half", steps: [`Half of ${nf(whole)} is ${nf(answer)}.`] };
  }
  if (pct === 25) {
    return {
      headline: "25% is half of half",
      steps: [`Half of ${nf(whole)} is ${nf(whole / 2)}.`, `Half again: ${nf(answer)}.`],
    };
  }
  if (pct === 75) {
    return {
      headline: "75% is a half plus a quarter",
      steps: [`Half is ${nf(whole / 2)}, a quarter is ${nf(whole / 4)}.`, `Add: ${nf(answer)}.`],
    };
  }
  if (pct === 10) {
    return { headline: "10% is one decimal shift", steps: [`Move the point once: ${nf(answer)}.`] };
  }
  if (pct % 10 === 0) {
    return {
      headline: "Anchor on 10%",
      steps: [`10% of ${nf(whole)} is ${nf(ten)}.`, `×${pct / 10} → ${nf(answer)}.`],
    };
  }
  // Near a multiple of ten: go up/down from the anchor using 1% steps.
  const anchor = Math.round(pct / 10) * 10;
  const delta = pct - anchor;
  if (anchor > 0 && Math.abs(delta) <= 5) {
    const anchorVal = (whole * anchor) / 100;
    return {
      headline: `Start at ${anchor}%, adjust with 1%`,
      steps: [
        `${anchor}% of ${nf(whole)} is ${nf(anchorVal)}; 1% is ${nf(one)}.`,
        delta > 0
          ? `Add ${delta} × ${nf(one)} = ${nf(delta * one)} → ${nf(answer)}.`
          : `Subtract ${-delta} × ${nf(one)} = ${nf(-delta * one)} → ${nf(answer)}.`,
      ],
    };
  }
  return {
    headline: "Build it from 10% and 1%",
    steps: [
      `10% is ${nf(ten)}, 1% is ${nf(one)}.`,
      `${pct}% = ${Math.floor(pct / 10)} × ${nf(ten)} + ${pct % 10} × ${nf(one)} = ${nf(answer)}.`,
    ],
  };
}

/**
 * Build a coaching tip from the operands of a generated question.
 * `ops` follows the order used by the generator:
 *  - addition/subtraction/multiplication: [a, b]
 *  - division: [dividend, divisor]
 *  - percentage: [pct, whole]
 */
export function coachingTip(track: SkillTrack, ops: number[] | undefined): CoachingTip | null {
  if (!ops || ops.length < 2) return null;
  const [x, y] = ops;
  switch (track) {
    case "addition":
      return additionTip(x, y);
    case "subtraction":
      return subtractionTip(x, y);
    case "multiplication":
      return multiplicationTip(x, y);
    case "division":
      return divisionTip(x, y);
    case "percentage":
      return percentageTip(x, y);
    default:
      return null;
  }
}
