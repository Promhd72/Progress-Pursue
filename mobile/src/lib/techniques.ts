// The technique library: the theory behind every skill in the app.
// Worked examples are rendered with the coaching engine, so the numbers are
// always correct and the explanations match what lessons teach.

import { LADDER, type SkillTrack } from "./curriculum";

export interface Technique {
  id: string;
  track: SkillTrack;
  name: string;
  /** One line that sells the technique. */
  tagline: string;
  /** When to reach for it. */
  when: string;
  /** Why it works, in everyday words. */
  why: string;
  /** The method in a few short steps (no numbers). */
  steps: string[];
  /** Operands for worked examples (rendered by the coaching engine). */
  examples: number[][];
  /** Levels that practise this technique. */
  levels: number[];
  /** Operands for one "Try it" question. */
  gen: () => number[];
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const level = (track: SkillTrack, l: number) => LADDER[track][l - 1].gen;
/** Random integer in [lo, hi] that isn't one of `skip` (so a different trick doesn't kick in). */
const randExcept = (lo: number, hi: number, skip: number[]) => {
  for (let i = 0; i < 100; i++) {
    const n = rand(lo, hi);
    if (!skip.includes(n)) return n;
  }
  return lo;
};
const notEnding = (lo: number, hi: number, digits: number[]) => {
  for (let i = 0; i < 100; i++) {
    const n = rand(lo, hi);
    if (!digits.includes(n % 10)) return n;
  }
  return lo + 1;
};

export const TECHNIQUES: Technique[] = [
  // Addition
  {
    id: "make-10",
    track: "addition",
    name: "Make a 10",
    tagline: "The foundation of fast adding.",
    when: "Adding two small numbers that go past 10, like 8 + 7.",
    why: "10 is the easiest number to add to. Topping up to 10 first turns one awkward sum into two easy ones.",
    steps: ["Ask how much the bigger number needs to reach 10.", "Take that much from the other number.", "Add what's left to 10."],
    examples: [[8, 7], [9, 6]],
    levels: [2],
    gen: level("addition", 2),
  },
  {
    id: "bridge-ten",
    track: "addition",
    name: "Bridge to the next ten",
    tagline: "Make a 10, scaled up to any number.",
    when: "Adding a single digit to a bigger number, like 47 + 6.",
    why: "Round tens (50, 60, 70) are easy landing spots. Hop to the next one, then add the rest.",
    steps: ["Find how far the big number is from the next ten.", "Use that part of the small number to land on the ten.", "Add what's left."],
    examples: [[47, 6], [68, 5]],
    levels: [3],
    gen: level("addition", 3),
  },
  {
    id: "tens-then-ones-add",
    track: "addition",
    name: "Tens, then ones",
    tagline: "How to add any two numbers without paper.",
    when: "Adding two-digit or three-digit numbers, like 47 + 36.",
    why: "Numbers are made of parts: tens and ones. Adding the matching parts separately keeps each step small.",
    steps: ["Add the tens together.", "Add the ones together.", "Join the two answers."],
    examples: [[42, 35], [47, 36]],
    levels: [4, 5, 7, 9],
    gen: level("addition", 5),
  },
  {
    id: "round-fix-add",
    track: "addition",
    name: "Round up, then fix",
    tagline: "The shopper's trick for prices like 29 or 499.",
    when: "One number ends in 8 or 9, like 56 + 29.",
    why: "29 is almost 30, and adding 30 is easy. You add 1 too many, so take it back.",
    steps: ["Round the 8- or 9-ending number up to the next ten.", "Add the round number.", "Take back the extra you added."],
    examples: [[56, 29], [499, 376]],
    levels: [6, 10],
    gen: level("addition", 6),
  },
  // Subtraction
  {
    id: "count-up",
    track: "subtraction",
    name: "Count up the gap",
    tagline: "Subtraction without taking anything away.",
    when: "The two numbers are close, like 52 − 47.",
    why: "The answer to a subtraction is the gap between the numbers. Counting up from the smaller one finds the gap in easy hops.",
    steps: ["Start at the smaller number.", "Hop up to the next round ten.", "Hop on to the bigger number.", "Add the hops."],
    examples: [[52, 47], [83, 76]],
    levels: [2, 5],
    gen: level("subtraction", 5),
  },
  {
    id: "drop-through-ten",
    track: "subtraction",
    name: "Drop through the ten",
    tagline: "Take away small numbers cleanly.",
    when: "Taking a single digit from a bigger number, like 43 − 7.",
    why: "Landing on a round ten first means the second step is always easy.",
    steps: ["Take away just enough to land on the ten below.", "Take away the rest from that round ten."],
    examples: [[43, 7], [62, 5]],
    levels: [3],
    gen: level("subtraction", 3),
  },
  {
    id: "tens-then-ones-sub",
    track: "subtraction",
    name: "Take the tens, then the ones",
    tagline: "Break a hard subtraction into two easy jumps.",
    when: "Taking away a two- or three-digit number, like 72 − 36.",
    why: "Taking 30 and then 6 is two small jumps you can do in your head, instead of one big one.",
    steps: ["Take away the round part (the tens).", "Then take away the ones."],
    examples: [[87, 42], [72, 36]],
    levels: [4, 6, 8, 9],
    gen: level("subtraction", 6),
  },
  {
    id: "round-give-back",
    track: "subtraction",
    name: "Take a round number, give back",
    tagline: "The fastest way to take away 29, 98 or 199.",
    when: "The number you take away ends in 8 or 9.",
    why: "Taking away 30 is easy. If you only needed to take 29, you took 1 too many, so give it back.",
    steps: ["Round the number you take away up to the next ten.", "Take the round number away.", "Add back the extra."],
    examples: [[84, 29], [153, 98]],
    levels: [7],
    gen: level("subtraction", 7),
  },
  {
    id: "change-from-round",
    track: "subtraction",
    name: "Count up, like giving change",
    tagline: "Work out change like a cashier.",
    when: "Taking away from 100, 500 or 1,000, like what's left of a $500 budget.",
    why: "Counting up from the price to the round amount in small hops is easier than taking away across lots of zeros.",
    steps: ["From the price, hop to the next ten.", "Hop to the next hundred.", "Hop to the round amount.", "Add up the hops."],
    examples: [[1000, 365], [500, 135]],
    levels: [10],
    gen: level("subtraction", 10),
  },
  // Multiplication
  {
    id: "doubling",
    track: "multiplication",
    name: "Double, and double again",
    tagline: "×2 and ×4 without the times tables.",
    when: "Multiplying by 2 or 4.",
    why: "×2 is doubling. 4 is 2 × 2, so ×4 is just doubling twice.",
    steps: ["Double the number.", "For ×4, double the answer again."],
    examples: [[7, 4], [13, 4]],
    levels: [1, 2],
    gen: () => [randExcept(6, 25, [9, 10, 11, 20]), pick([2, 4])],
  },
  {
    id: "times-five",
    track: "multiplication",
    name: "×5 is half of ×10",
    tagline: "Turn ×5 into the easiest sum there is.",
    when: "Multiplying by 5, like 36 × 5.",
    why: "5 is half of 10. Multiplying by 10 is just adding a zero, so ×5 is that, halved.",
    steps: ["Multiply by 10 (add a zero).", "Halve the result."],
    examples: [[14, 5], [36, 5]],
    levels: [1],
    gen: () => [randExcept(6, 48, [9, 10, 11, 20, 30, 40]), 5],
  },
  {
    id: "times-nine",
    track: "multiplication",
    name: "×9 is ×10, minus one lot",
    tagline: "Never get stuck on the 9 times table again.",
    when: "Multiplying by 9, like 37 × 9.",
    why: "9 lots is one lot fewer than 10 lots, and ×10 is easy.",
    steps: ["Multiply by 10 (add a zero).", "Take away one lot of the number."],
    examples: [[7, 9], [37, 9]],
    levels: [3, 7],
    gen: () => [randExcept(4, 60, [4, 5, 10, 11, 20, 30, 40, 50, 60]), 9],
  },
  {
    id: "times-eleven",
    track: "multiplication",
    name: "×11: add the digits, put the sum in the middle",
    tagline: "The trick that always impresses.",
    when: "Multiplying a two-digit number by 11, like 42 × 11.",
    why: "42 × 11 is 420 + 42. That always works out as the two digits with their sum squeezed in between.",
    steps: ["Split the number into its two digits.", "Add the digits.", "Put the sum in the middle (carry the 1 if it's 10 or more)."],
    examples: [[42, 11], [78, 11]],
    levels: [7],
    gen: () => [notEnding(12, 99, [0]), 11],
  },
  {
    id: "hide-zero-mul",
    track: "multiplication",
    name: "Hide the zero",
    tagline: "Round numbers multiply like small ones.",
    when: "Multiplying a round number, like 40 × 6.",
    why: "40 is just 4 tens. So 40 × 6 is 4 × 6, in tens.",
    steps: ["Cover the zero.", "Multiply what's left.", "Put the zero back."],
    examples: [[40, 6], [70, 8]],
    levels: [5],
    gen: level("multiplication", 5),
  },
  {
    id: "split-multiply",
    track: "multiplication",
    name: "Split into tens and ones",
    tagline: "How to multiply any two-digit number in your head.",
    when: "Multiplying a two-digit number, like 23 × 6 or 24 × 13.",
    why: "23 is 20 + 3. Multiplying each part and adding gives the same answer in two easy steps.",
    steps: ["Split one number into tens and ones.", "Multiply each part.", "Add the two results."],
    examples: [[23, 6], [24, 13]],
    levels: [6, 8, 9, 10],
    gen: level("multiplication", 6),
  },
  {
    id: "build-from-fact",
    track: "multiplication",
    name: "Build from a fact you know",
    tagline: "Forgot a times-table fact? Work it out from an easy one.",
    when: "You can't remember a fact like 7 × 8.",
    why: "7 is 5 + 2. So 7 × 8 is 5 × 8 (40) plus 2 × 8 (16), which makes 56. Times 5 and times 2 are the easy ones.",
    steps: ["Split the 6, 7, 8 or 9 into 5 and what's left.", "Do the 5 part, then the part that's left.", "Add the two answers."],
    examples: [[7, 8], [6, 7]],
    levels: [3, 4],
    gen: () => [rand(6, 8), rand(6, 8)],
  },
  // Division
  {
    id: "tables-backwards",
    track: "division",
    name: "Times tables backwards",
    tagline: "Every division fact is a times-table fact in disguise.",
    when: "Dividing within the times tables, like 56 ÷ 7.",
    why: "56 ÷ 7 asks: 7 times what makes 56? If you know your tables, you know the answer.",
    steps: ["Turn it into a question: the small number times what gives the big one?", "Count up in the small number, or start from × 5."],
    examples: [[56, 7], [42, 6]],
    levels: [2, 3, 4],
    gen: () => { const d = pick([3, 6, 7, 9]); return [d * rand(3, 10), d]; },
  },
  {
    id: "halving",
    track: "division",
    name: "Halve, and halve again",
    tagline: "÷2 and ÷4 without any division.",
    when: "Dividing by 2 or 4, like 96 ÷ 4.",
    why: "Dividing by 4 is the same as halving twice, and halving is easy.",
    steps: ["Halve the number.", "For ÷4, halve it again."],
    examples: [[96, 4], [72, 4]],
    levels: [2, 6],
    gen: () => [4 * rand(11, 40), 4],
  },
  {
    id: "digit-by-digit",
    track: "division",
    name: "Divide digit by digit",
    tagline: "Divide any big number by a single digit.",
    when: "Dividing a big number by a single digit, like 184 ÷ 8 or 252 ÷ 7.",
    why: "You don't have to divide the whole number at once. Go from the left, one digit at a time, and carry anything left over to the next digit.",
    steps: [
      "Start at the left. If the first digit is too small, use the first two.",
      "Divide, and note what's left over.",
      "Put the leftover in front of the next digit and divide again.",
      "Read the answer digits in order.",
    ],
    examples: [[184, 8], [252, 7]],
    levels: [6, 7],
    gen: level("division", 7),
  },
  {
    id: "divide-by-five",
    track: "division",
    name: "÷5: double, then drop a zero",
    tagline: "Divide by 5 faster than a calculator.",
    when: "Dividing by 5, like 345 ÷ 5.",
    why: "Dividing by 5 is the same as doubling and dividing by 10.",
    steps: ["Double the number.", "Take a zero off (divide by 10)."],
    examples: [[345, 5], [120, 5]],
    levels: [1, 8],
    gen: level("division", 8),
  },
  {
    id: "hide-zero-div",
    track: "division",
    name: "Hide the zero",
    tagline: "Divide round numbers like small ones.",
    when: "Dividing a round number, like 240 ÷ 6.",
    why: "240 is 24 tens. 24 ÷ 6 = 4, so 240 ÷ 6 is 4 tens.",
    steps: ["Cover the zero.", "Divide what's left.", "Put the zero back."],
    examples: [[240, 6], [350, 7]],
    levels: [5],
    gen: level("division", 5),
  },
  {
    id: "chunking",
    track: "division",
    name: "Take out an easy chunk",
    tagline: "Divide by 12, 15 or 25 by taking out tens first.",
    when: "Dividing by a two-digit number, like 432 ÷ 12.",
    why: "12 × 10 = 120 and 12 × 30 = 360 are easy. Take out a round chunk like that first, and only a small piece is left to divide.",
    steps: ["Take out as many lots of 10 as you can.", "See what's left.", "Divide what's left and add the two counts."],
    examples: [[156, 12], [432, 12]],
    levels: [9, 10],
    gen: level("division", 9),
  },
  // Percentages
  {
    id: "anchor-percents",
    track: "percentage",
    name: "The anchor percentages",
    tagline: "50%, 25%, 75% and 10%: the four you'll use daily.",
    when: "Any time you see 50%, 25%, 75% or 10%.",
    why: "Per cent means 'out of 100'. 50% is half, 25% is a quarter, 75% is three quarters, and 10% is a tenth.",
    steps: ["50%: halve it.", "25%: halve, then halve again.", "75%: find a quarter, times 3.", "10%: take a zero off."],
    examples: [[25, 80], [10, 240]],
    levels: [1, 2],
    gen: () => (Math.random() < 0.5 ? level("percentage", 1)() : level("percentage", 2)()),
  },
  {
    id: "build-10-5",
    track: "percentage",
    name: "Build from 10% and 5%",
    tagline: "Make any percentage from two easy pieces.",
    when: "Percentages like 15%, 30%, 35% or 45%.",
    why: "10% is a tenth and 5% is half of that. Every multiple of 5% is some 10s plus maybe a 5.",
    steps: ["Find 10%.", "Find 5% (half of 10%) if you need it.", "Add up the pieces you need."],
    examples: [[15, 240], [35, 60]],
    levels: [3, 4],
    gen: level("percentage", 4),
  },
  {
    id: "one-percent",
    track: "percentage",
    name: "Start from 1%",
    tagline: "Small percentages of big numbers.",
    when: "Percentages like 1%, 2% or 3% of a big number.",
    why: "1% is a hundredth: take two zeros off. Then multiply by the percentage.",
    steps: ["Find 1% by dividing by 100.", "Multiply by the percentage."],
    examples: [[3, 1200], [2, 700]],
    levels: [5],
    gen: level("percentage", 5),
  },
  {
    id: "nudge-2",
    track: "percentage",
    name: "Nudge from 10% or 20%",
    tagline: "Awkward percentages, made easy.",
    when: "Percentages like 12% or 18%.",
    why: "12% is 10% + 2%, and 18% is 20% − 2%. 2% is a fifth of 10%.",
    steps: ["Find 10% (or 20%).", "Find 2%: a fifth of 10%.", "Add or take away the 2%."],
    examples: [[12, 350], [18, 250]],
    levels: [6],
    gen: level("percentage", 6),
  },
  {
    id: "swap",
    track: "percentage",
    name: "The swap trick",
    tagline: "x% of y is the same as y% of x.",
    when: "One way round is awkward, like 12% of 25.",
    why: "Both are the two numbers multiplied together, divided by 100. So you can swap them for the easier one.",
    steps: ["Swap the numbers: 12% of 25 becomes 25% of 12.", "Work out the easy version."],
    examples: [[12, 25], [16, 50]],
    levels: [9],
    gen: level("percentage", 9),
  },
  {
    id: "vat-discount",
    track: "percentage",
    name: "Add VAT, take off a discount",
    tagline: "Real prices, in your head.",
    when: "Adding 5% VAT or working out a sale price.",
    why: "Find the percentage first, then add it on (VAT) or take it off (discount).",
    steps: ["Find the percentage of the price.", "VAT: add it. Discount: take it away."],
    examples: [[5, 240, 1], [20, 350, -1]],
    levels: [7, 8, 10],
    gen: () => (Math.random() < 0.5 ? level("percentage", 7)() : level("percentage", 8)()),
  },
];

const LEARNED_KEY = "rapidmath.techniques";

export function learnedTechniques(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LEARNED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function markTechniqueLearned(id: string) {
  const set = learnedTechniques();
  set.add(id);
  try {
    localStorage.setItem(LEARNED_KEY, JSON.stringify([...set]));
  } catch {
    // Ignore.
  }
}

export const techniqueById = (id: string) => TECHNIQUES.find((t) => t.id === id);
