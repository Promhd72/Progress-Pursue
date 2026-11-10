// Beginner-friendly "how to do it in your head" coaching for every generated
// question. Each tip picks a method that suits the actual numbers, explains
// why it works in everyday words, and walks through small, checkable steps.
// Pure functions, no dependencies.

import type { SkillTrack } from "./curriculum";

export interface CoachingStep {
  /** What to do, in plain words. */
  say: string;
  /** The small sum for this step, e.g. "30 + 20 = 50". */
  math?: string;
}

export interface CoachingTip {
  /** Plain name of the method, e.g. "Make a 10 first". */
  method: string;
  /** One sentence on why the method works. */
  idea: string;
  steps: CoachingStep[];
  /** A quick way to sanity-check the answer. */
  check?: string;
  /** Rule of thumb to reuse next time. */
  remember: string;
  /** First move only; never contains the answer. Used by the Hint button. */
  hint: string;
}

const nf = (n: number) => String(Math.round(n * 100) / 100);
const step = (say: string, math?: string): CoachingStep => ({ say, math });
const tensOf = (n: number) => Math.floor(n / 10) * 10;
const nextTen = (n: number) => (n % 10 === 0 ? n : tensOf(n) + 10);

/** Splits a number into place-value parts: 347 → [300, 40, 7] (zeros dropped). */
function parts(n: number): number[] {
  const h = Math.floor(n / 100) * 100;
  const t = Math.floor((n % 100) / 10) * 10;
  const o = n % 10;
  return [h, t, o].filter((p) => p > 0);
}

/* Addition ------------------------------------------------------------ */

function additionTip(a: number, b: number): CoachingTip {
  const sum = a + b;
  const big = Math.max(a, b);
  const small = Math.min(a, b);

  // Small number added to anything: hop to the next ten first.
  if (small < 10) {
    const need = nextTen(big) - big;
    if (need === 0 || need >= small) {
      return {
        method: "Count on from the bigger number",
        idea: "It's quicker to start at the bigger number and count on the small one than the other way round.",
        steps: [
          step(`Start at the bigger number, ${big}.`),
          step(`Count on ${small} more.`, `${big} + ${small} = ${sum}`),
        ],
        check: `Adding always makes it bigger, so the answer must be more than ${big}.`,
        remember: "Start from the bigger number and count on the smaller one.",
        hint: `Start at ${big} and count on ${small}.`,
      };
    }
    const rest = small - need;
    const ten = big + need;
    return {
      method: big < 10 ? "Make a 10 first" : "Bridge to the next ten",
      idea: "Round numbers like 10, 20 or 50 are easy to add to. So fill up to the next ten, then add what's left.",
      steps: [
        step(`${big} needs ${need} more to reach ${ten}. Split ${small} into ${need} and ${rest}.`, `${small} = ${need} + ${rest}`),
        step(`Add the ${need} to reach the round number.`, `${big} + ${need} = ${ten}`),
        step(`Now add the ${rest} that's left.`, `${ten} + ${rest} = ${sum}`),
      ],
      check: `Adding always makes it bigger, so the answer must be more than ${big}.`,
      remember: "Fill up to the next ten first, then add the rest.",
      hint: `How much does ${big} need to reach ${ten}? Use that part of ${small} first.`,
    };
  }

  // One number is just below a round ten (…8 or …9): round it up, then fix.
  const near = b % 10 >= 8 ? b : a % 10 >= 8 ? a : null;
  if (near !== null) {
    const other = near === b ? a : b;
    const up = nextTen(near);
    const extra = up - near;
    const mid = other + up;
    return {
      method: "Round up, then fix",
      idea: `${near} is very close to ${up}, and adding ${up} is easy. You just added a bit too much, so take that bit back.`,
      steps: [
        step(`Pretend ${near} is ${up}. That's ${extra} too much.`, `${near} + ${extra} = ${up}`),
        step(`Add the round number.`, `${other} + ${up} = ${mid}`),
        step(`Take back the extra ${extra}.`, `${mid} − ${extra} = ${sum}`),
      ],
      check: `${other} + ${up} is ${mid}, and the real answer is just a little less.`,
      remember: "Numbers ending in 8 or 9: round up to the ten, add, then take back the extra.",
      hint: `${near} is almost ${up}. Add ${up} instead, then fix it.`,
    };
  }

  // General case: add each place (hundreds, tens, ones) separately.
  const pa = parts(a);
  const pb = parts(b);
  const places = [100, 10, 1]
    .map((unit) => {
      const x = pa.find((p) => (unit === 1 ? p < 10 : p >= unit && p < unit * 10)) ?? 0;
      const y = pb.find((p) => (unit === 1 ? p < 10 : p >= unit && p < unit * 10)) ?? 0;
      return { unit, x, y };
    })
    .filter((p) => p.x + p.y > 0);
  const names: Record<number, string> = { 100: "hundreds", 10: "tens", 1: "ones" };
  const subtotals = places.map((p) => p.x + p.y);
  const steps = places.map((p) => step(`Add the ${names[p.unit]}.`, `${p.x} + ${p.y} = ${p.x + p.y}`));
  if (subtotals.length > 1) {
    steps.push(step("Put the pieces together.", `${subtotals.join(" + ")} = ${sum}`));
  }
  const first = places[0];
  return {
    method: places.length > 2 ? "Hundreds, then tens, then ones" : "Tens first, then ones",
    idea: "Big numbers are just smaller pieces stuck together. Add the matching pieces, then join them up.",
    steps,
    check: `Round both numbers: about ${Math.round(a / 10) * 10} + ${Math.round(b / 10) * 10} = ${Math.round(a / 10) * 10 + Math.round(b / 10) * 10}, so the answer should be close to that.`,
    remember: "Split both numbers into tens and ones. Add tens to tens, ones to ones, then combine.",
    hint: `Start with the ${names[first.unit]}: ${first.x} + ${first.y}.`,
  };
}

/* Subtraction ---------------------------------------------------------- */

function subtractionTip(a: number, b: number): CoachingTip {
  const diff = a - b;
  const check = `Check by adding back: ${nf(diff)} + ${b} should give ${a}.`;

  if (diff === 0) {
    return {
      method: "Same number, nothing left",
      idea: "If you take away everything you started with, nothing is left.",
      steps: [step(`${a} take away ${b} leaves nothing.`, `${a} − ${b} = 0`)],
      check,
      remember: "Any number minus itself is 0.",
      hint: "Look closely: are the two numbers the same?",
    };
  }

  // Small number off, and the ones digit is big enough: only the ones change.
  if (b < 10 && a % 10 >= b) {
    const down = a % 10;
    return {
      method: "Only the ones change",
      idea: `The ones digit of ${a} is ${down}, which is enough to take ${b} from, so the tens stay the same.`,
      steps: [step("Take away from the ones.", `${down} − ${b} = ${down - b}`), step("Keep the tens as they are.", `${a} − ${b} = ${diff}`)],
      check,
      remember: "If the ones digit is big enough, only the ones change.",
      hint: `Look at the ones digit of ${a}. Take ${b} away from it.`,
    };
  }

  // Numbers close together: count up from the smaller one (like giving change).
  if (diff <= 20) {
    const hop1Target = nextTen(b);
    if (hop1Target > b && hop1Target < a) {
      const hop1 = hop1Target - b;
      const hop2 = a - hop1Target;
      return {
        method: "Count up from the smaller number",
        idea: "When the numbers are close, it's easier to find the gap by counting up, like a shopkeeper giving change.",
        steps: [
          step(`Hop from ${b} up to the round number ${hop1Target}.`, `${b} + ${hop1} = ${hop1Target}`),
          step(`Hop from ${hop1Target} up to ${a}.`, `${hop1Target} + ${hop2} = ${a}`),
          step("Add up the two hops. That's the gap.", `${hop1} + ${hop2} = ${diff}`),
        ],
        check,
        remember: "Close numbers? Count up from the smaller one and add the hops.",
        hint: `Count up from ${b}. How far is it to ${hop1Target}?`,
      };
    }
    return {
      method: "Count up from the smaller number",
      idea: "When the numbers are close, it's easier to find the gap by counting up from the smaller one.",
      steps: [step(`Start at ${b} and count up to ${a}.`, `${b} + ${diff} = ${a}`), step(`You counted up ${diff}, so that's the answer.`, `${a} − ${b} = ${diff}`)],
      check,
      remember: "Close numbers? Count up from the smaller one.",
      hint: `Start at ${b} and count up until you reach ${a}.`,
    };
  }

  // Change from a round amount (100, 500, 1000): count up in friendly hops.
  if (a % 100 === 0 && a >= 100 && b % 10 !== 0) {
    const t = nextTen(b);
    const h = Math.ceil(t / 100) * 100;
    const hop1 = t - b;
    const hop2 = h - t;
    const hop3 = a - h;
    const steps = [step(`Hop from ${b} up to the next ten, ${t}.`, `${b} + ${hop1} = ${t}`)];
    if (hop2 > 0) steps.push(step(`Hop from ${t} up to the next hundred, ${h}.`, `${t} + ${hop2} = ${h}`));
    if (hop3 > 0) steps.push(step(`Hop from ${h} up to ${a}.`, `${h} + ${hop3} = ${a}`));
    const hops = [hop1, hop2, hop3].filter((x) => x > 0);
    steps.push(step("Add up the hops. That's the change.", `${hops.join(" + ")} = ${diff}`));
    return {
      method: "Count up to the round amount",
      idea: "This is how a cashier gives change: start at the price and count up to the note in easy hops.",
      steps,
      check,
      remember: "Change from a round amount? Hop to the next ten, then the next hundred, then the total.",
      hint: `Start at ${b}. How far is it to ${t}?`,
    };
  }

  // Taking away a number just below a ten (…8 or …9): take the ten, give back.
  if (b >= 10 && b % 10 >= 8) {
    const up = nextTen(b);
    const extra = up - b;
    const mid = a - up;
    return {
      method: "Take away a round number, then give back",
      idea: `${b} is almost ${up}, and taking away ${up} is easy. You took a little too much, so give it back.`,
      steps: [
        step(`Take away ${up} instead of ${b}.`, `${a} − ${up} = ${mid}`),
        step(`You took ${extra} too many, so add ${extra} back.`, `${mid} + ${extra} = ${diff}`),
      ],
      check,
      remember: "Taking away a number ending in 8 or 9? Take the round ten, then give back the extra.",
      hint: `Take away ${up} first, then fix it.`,
    };
  }

  // Taking away a small number: drop to the ten below first.
  if (b < 10) {
    const down = a % 10;
    const ten = a - down;
    const rest = b - down;
    return {
      method: "Drop to the ten below, then the rest",
      idea: "Round numbers are easy to take away from. So get to the ten below first, then take what's left.",
      steps: [
        step(`Split ${b} into ${down} and ${rest}. Take ${down} first to land on ${ten}.`, `${a} − ${down} = ${ten}`),
        step(`Now take the ${rest} that's left.`, `${ten} − ${rest} = ${diff}`),
      ],
      check,
      remember: "Take away down to the round ten first, then the rest.",
      hint: `Take ${down} away from ${a} first to land on ${ten}.`,
    };
  }

  // General: take away the big part of b, then the ones.
  const roundPart = b - (b % 10);
  const ones = b % 10;
  const mid = a - roundPart;
  const steps = [step(`Take away the round part of ${b}, which is ${roundPart}.`, `${a} − ${roundPart} = ${mid}`)];
  if (ones > 0) steps.push(step(`Then take away the ${ones} ones.`, `${mid} − ${ones} = ${diff}`));
  return {
    method: "Take away the tens, then the ones",
    idea: `Taking away ${b} all at once is hard. Taking ${roundPart} and then ${ones || "nothing"} is two easy jumps.`,
    steps,
    check,
    remember: "Split the number you take away into tens and ones, and take them one at a time.",
    hint: `Take away ${roundPart} first.`,
  };
}

/* Multiplication -------------------------------------------------------- */

function timesHelper(n: number, by: number): string | null {
  if (by === 2) return `Double ${n}.`;
  if (by === 4) return `Double ${n} to get ${n * 2}, then double again.`;
  if (by === 5) return `${n} × 10 = ${n * 10}, then halve it.`;
  if (by === 10) return `Put a 0 on the end of ${n}.`;
  return null;
}

function multiplicationTip(a: number, b: number): CoachingTip {
  const product = a * b;
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const check = `Check: ${product} ÷ ${small} should give ${big}.`;

  const special = [10, 2, 5, 4, 9].find((t) => a === t || b === t);
  if (special !== undefined) {
    const other = a === special ? b : a;
    switch (special) {
      case 10:
        return {
          method: "×10: add a zero",
          idea: "Ten lots of a number just shifts it up one place, so a 0 appears on the end.",
          steps: [step(`Write ${other} with a 0 on the end.`, `${other} × 10 = ${product}`)],
          check,
          remember: "Times 10? Put a 0 on the end.",
          hint: `What happens when you put a 0 on the end of ${other}?`,
        };
      case 2:
        return {
          method: "×2 is doubling",
          idea: "Two lots of a number is the number added to itself.",
          steps: [step(`Add ${other} to itself.`, `${other} + ${other} = ${product}`)],
          check,
          remember: "Times 2 means double it.",
          hint: `Add ${other} to itself.`,
        };
      case 5:
        return {
          method: "×5 is half of ×10",
          idea: "5 is half of 10, so 5 lots is half of 10 lots, and ×10 is easy.",
          steps: [
            step(`First times by 10: add a 0.`, `${other} × 10 = ${other * 10}`),
            step("Then cut it in half.", `${other * 10} ÷ 2 = ${product}`),
          ],
          check,
          remember: "Times 5? Times 10, then halve.",
          hint: `Work out ${other} × 10 first.`,
        };
      case 4:
        return {
          method: "×4 is double, then double again",
          idea: "4 is 2 × 2, so doubling twice is the same as ×4.",
          steps: [step(`Double ${other}.`, `${other} × 2 = ${other * 2}`), step("Double that again.", `${other * 2} × 2 = ${product}`)],
          check,
          remember: "Times 4? Double it, then double again.",
          hint: `Double ${other} first.`,
        };
      case 9:
        return {
          method: "×9 is ×10, minus one lot",
          idea: "9 lots is one lot fewer than 10 lots, and ×10 is easy.",
          steps: [
            step("Times by 10 first: add a 0.", `${other} × 10 = ${other * 10}`),
            step(`Take away one ${other}.`, `${other * 10} − ${other} = ${product}`),
          ],
          check,
          remember: "Times 9? Times 10, then take away one lot.",
          hint: `Work out ${other} × 10 first.`,
        };
    }
  }

  // ×11 with a two-digit number: put the digit sum in the middle.
  if ((a === 11 || b === 11) && Math.max(a, b) >= 12 && Math.max(a, b) <= 99) {
    const n = a === 11 ? b : a;
    const t = Math.floor(n / 10);
    const o = n % 10;
    const mid = t + o;
    const steps =
      mid < 10
        ? [
            step(`Split ${n} into its digits: ${t} and ${o}.`),
            step("Add the two digits.", `${t} + ${o} = ${mid}`),
            step(`Put that in the middle: ${t}, then ${mid}, then ${o}.`, `${n} × 11 = ${product}`),
          ]
        : [
            step(`Split ${n} into its digits: ${t} and ${o}.`),
            step("Add the two digits.", `${t} + ${o} = ${mid}`),
            step(`${mid} is too big for the middle, so keep the ${mid % 10} and carry the 1 onto the ${t}.`, `${t} + 1 = ${t + 1}`),
            step(`Put it together: ${t + 1}, then ${mid % 10}, then ${o}.`, `${n} × 11 = ${product}`),
          ];
    return {
      method: "×11: add the digits, put it in the middle",
      idea: `${n} × 11 is ${n} × 10 plus ${n}. That always works out as the two digits with their sum squeezed in between.`,
      steps,
      check: `Check: ${n} × 10 = ${n * 10}, plus ${n} is ${product}.`,
      remember: "Two-digit number × 11? Add the digits and put the sum in the middle (carry if it's 10 or more).",
      hint: `Add the two digits of ${n} together.`,
    };
  }

  // Round tens × a single digit: hide the zero.
  if (big >= 20 && big % 10 === 0 && small <= 10) {
    const core = big / 10;
    return {
      method: "Hide the zero",
      idea: `${big} is ${core} tens. So ${big} × ${small} is just ${core} × ${small}, in tens.`,
      steps: [
        step(`Cover the 0 and multiply.`, `${core} × ${small} = ${core * small}`),
        step("Put the 0 back on the end.", `${core * small} × 10 = ${product}`),
      ],
      check,
      remember: "Multiplying a round number? Hide the zeros, multiply, then put them back.",
      hint: `Ignore the 0 in ${big}. What's ${core} × ${small}?`,
    };
  }

  // Both single digits: build from a fact you know (×5 or ×2).
  if (big <= 10) {
    const base = big > 5 ? 5 : 2;
    const restCount = big - base;
    return {
      method: "Build it from an easier fact",
      idea: `${big} × ${small} means ${big} lots of ${small}. Split it into ${base} lots and ${restCount} lots, which are easier.`,
      steps: [
        step(`${base} lots of ${small}.`, `${base} × ${small} = ${base * small}`),
        step(`${restCount} more lots of ${small}.`, `${restCount} × ${small} = ${restCount * small}`),
        step("Add them together.", `${base * small} + ${restCount * small} = ${product}`),
      ],
      check,
      remember: `This is a times-table fact worth learning by heart: ${big} × ${small} = ${product}.`,
      hint: `Start with ${base} × ${small}.`,
    };
  }

  // Split one number into tens and ones, multiply each, then add.
  const splitNum = b >= 10 && a < 10 ? b : a >= 10 && b < 10 ? a : small;
  const keep = splitNum === a ? b : a;
  const tens = tensOf(splitNum);
  const ones = splitNum - tens;
  const tensPart = tens * keep;
  const onesPart = ones * keep;
  const helper = timesHelper(keep, ones);
  const steps = [step(`Split ${splitNum} into ${tens} and ${ones}. Times the ${tens} first.`, `${tens} × ${keep} = ${tensPart}`)];
  if (ones > 0) {
    steps.push(step(helper ? `Now the ${ones}. ${helper}` : `Now times the ${ones}.`, `${ones} × ${keep} = ${onesPart}`));
    steps.push(step("Add the two parts.", `${tensPart} + ${onesPart} = ${product}`));
  }
  return {
    method: "Split into tens and ones",
    idea: `${splitNum} is ${tens} + ${ones}. Multiplying each piece separately gives two easy sums instead of one hard one.`,
    steps,
    check: `Estimate: about ${Math.round(a / 10) * 10 || a} × ${Math.round(b / 10) * 10 || b}, so the answer should be in that area.`,
    remember: "Split one number into tens and ones, multiply both pieces, then add.",
    hint: `Split ${splitNum} into ${tens} and ${ones}, and start with ${tens} × ${keep}.`,
  };
}

/* Division ------------------------------------------------------------- */

function divisionTip(dividend: number, divisor: number): CoachingTip {
  const q = dividend / divisor;
  const idea = `${dividend} ÷ ${divisor} asks: how many ${divisor}s fit into ${dividend}? It's the same as asking ${divisor} × ? = ${dividend}.`;
  const check = `Check: ${divisor} × ${nf(q)} should give ${dividend}.`;

  if (divisor === 10) {
    return {
      method: "÷10: remove a zero",
      idea,
      steps: [step(`Take the 0 off the end of ${dividend}.`, `${dividend} ÷ 10 = ${q}`)],
      check,
      remember: "Divide by 10? Take a 0 off the end.",
      hint: `What's ${dividend} without its last 0?`,
    };
  }
  if (divisor === 2 || divisor === 4 || divisor === 8) {
    const halvings = divisor === 2 ? 1 : divisor === 4 ? 2 : 3;
    const steps: CoachingStep[] = [];
    let cur = dividend;
    for (let i = 0; i < halvings; i++) {
      steps.push(step(i === 0 ? `Cut ${cur} in half.` : "Cut that in half again.", `${cur} ÷ 2 = ${cur / 2}`));
      cur /= 2;
    }
    return {
      method: divisor === 2 ? "÷2 is halving" : `÷${divisor} is halving ${halvings} times`,
      idea: divisor === 2 ? "Dividing by 2 means splitting into two equal halves." : `${divisor} is ${Array(halvings).fill(2).join(" × ")}, so halving ${halvings} times is the same as ÷${divisor}.`,
      steps,
      check,
      remember: divisor === 2 ? "Divide by 2? Halve it." : `Divide by ${divisor}? Halve it ${halvings === 2 ? "twice" : "three times"}.`,
      hint: `Cut ${dividend} in half first.`,
    };
  }
  if (divisor === 5) {
    return {
      method: "÷5 is double, then remove a zero",
      idea: "Dividing by 5 is the same as doubling and then dividing by 10.",
      steps: [step(`Double ${dividend}.`, `${dividend} × 2 = ${dividend * 2}`), step("Take the 0 off the end.", `${dividend * 2} ÷ 10 = ${q}`)],
      check,
      remember: "Divide by 5? Double it, then take a 0 off.",
      hint: `Double ${dividend} first.`,
    };
  }

  // Small answers: walk up the times table.
  if (q <= 10) {
    const start = q > 5 ? 5 : 1;
    const steps = [step(`Think: ${divisor} × what = ${dividend}?`)];
    if (start === 5) {
      steps.push(step(`Start from a fact you know.`, `${divisor} × 5 = ${divisor * 5}`));
      for (let k = 6; k <= q; k++) steps.push(step(`Add another ${divisor}.`, `${divisor} × ${k} = ${divisor * k}`));
    } else {
      for (let k = 1; k <= q; k++) steps.push(step(k === 1 ? `Count up in ${divisor}s.` : `Add another ${divisor}.`, `${divisor} × ${k} = ${divisor * k}`));
    }
    steps.push(step(`You reached ${dividend} after ${q} lots of ${divisor}, so that's the answer.`, `${dividend} ÷ ${divisor} = ${q}`));
    return {
      method: "Turn it into a times-table question",
      idea,
      steps,
      check,
      remember: "Division is times tables backwards. Ask: what times the small number gives the big one?",
      hint: `Count up in ${divisor}s until you reach ${dividend}.`,
    };
  }

  // Answer is a round number of tens (e.g. 180 ÷ 9): drop the zero, divide, put it back.
  if (q % 10 === 0 && dividend % 10 === 0) {
    const small = dividend / 10;
    return {
      method: "Hide the zero, then put it back",
      idea: `${idea} The 0 on the end just means everything is 10 times bigger, so you can ignore it, divide, and add it back.`,
      steps: [
        step(`Cover the 0 on ${dividend} and divide what's left.`, `${small} ÷ ${divisor} = ${small / divisor}`),
        step("Put the 0 back on.", `${small / divisor} × 10 = ${q}`),
      ],
      check,
      remember: "Numbers ending in 0? Hide the 0, divide, then put the 0 back.",
      hint: `Ignore the 0 on ${dividend} for now. What's ${small} ÷ ${divisor}?`,
    };
  }

  // Bigger answers: take out a big easy chunk (×10s) first.
  const tensCount = Math.floor(q / 10) * 10;
  const chunk = tensCount * divisor;
  const rest = dividend - chunk;
  const steps = [
    step(`Take out a big easy chunk: ${tensCount} lots of ${divisor}.`, `${divisor} × ${tensCount} = ${chunk}`),
    step(`See what's left over.`, `${dividend} − ${chunk} = ${rest}`),
  ];
  if (rest > 0) {
    steps.push(step(`How many ${divisor}s fit into ${rest}?`, `${rest} ÷ ${divisor} = ${rest / divisor}`));
    steps.push(step("Add the two counts.", `${tensCount} + ${rest / divisor} = ${q}`));
  }
  return {
    method: "Take out big chunks",
    idea: `${idea} Grab a big round chunk first (10s are easy), then deal with what's left.`,
    steps,
    check,
    remember: "Divide big numbers in chunks: take out lots of 10 first, then the rest.",
    hint: `How much is ${divisor} × ${tensCount}?`,
  };
}

/* Percentages ------------------------------------------------------------ */

const PER_CENT = "Per cent means 'out of 100'.";

/** Steps for p% of w when p is one of the easy anchors; null if it'd need decimals. */
function easyPercent(p: number, w: number): CoachingStep[] | null {
  if (p === 50 && w % 2 === 0) return [step(`50% is half. Halve ${w}.`, `${w} ÷ 2 = ${w / 2}`)];
  if (p === 25 && w % 4 === 0)
    return [step(`25% is a quarter: half, then half again.`, `${w} ÷ 2 = ${w / 2}`), step("Half again.", `${w / 2} ÷ 2 = ${w / 4}`)];
  if (p === 75 && w % 4 === 0)
    return [step(`75% is three quarters. Find a quarter first.`, `${w} ÷ 4 = ${w / 4}`), step("Three quarters is three of those.", `${w / 4} × 3 = ${(w / 4) * 3}`)];
  if (p === 10 && w % 10 === 0) return [step(`10% means divide by 10: take a 0 off.`, `${w} ÷ 10 = ${w / 10}`)];
  if (p === 20 && w % 5 === 0 && w % 10 !== 0)
    return [step("20% is one fifth, so divide by 5. Double it first...", `${w} × 2 = ${w * 2}`), step("...then take the 0 off.", `${w * 2} ÷ 10 = ${w / 5}`)];
  if (p === 20 && w % 10 === 0)
    return [step(`Find 10% first: take a 0 off.`, `${w} ÷ 10 = ${w / 10}`), step("20% is double that.", `${w / 10} × 2 = ${w / 5}`)];
  return null;
}

function percentageTip(pct: number, whole: number): CoachingTip {
  const answer = (whole * pct) / 100;
  const half = whole / 2;
  const check =
    pct === 50
      ? `Check: ${nf(answer)} + ${nf(answer)} = ${whole}, so it really is half.`
      : pct === 25
        ? `Check: 4 lots of ${nf(answer)} make ${whole}.`
        : pct === 10
          ? `Check: ${nf(answer)} × 10 = ${whole}.`
          : pct === 20
            ? `Check: 5 lots of ${nf(answer)} make ${whole}.`
            : pct < 50
              ? `Check: ${pct}% is less than half, so the answer must be less than ${nf(half)}.`
              : `Check: ${pct}% is more than half, so the answer must be more than ${nf(half)} but less than ${whole}.`;

  const direct = easyPercent(pct, whole);
  if (direct) {
    const names: Record<number, string> = {
      50: "50% is half",
      25: "25% is a quarter",
      75: "75% is three quarters",
      10: "10%: take a zero off",
      20: whole % 10 === 0 ? "20% is double 10%" : "20% is one fifth",
    };
    return {
      method: names[pct],
      idea: `${PER_CENT} ${pct === 50 ? "50 out of 100 is half." : pct === 25 ? "25 out of 100 is a quarter." : pct === 75 ? "75 out of 100 is three quarters." : "10 out of 100 is one tenth, so you divide by 10."}`,
      steps: direct,
      check,
      remember: pct === 10 || pct === 20 ? "To find 10%, divide by 10 (take a 0 off). Other percentages build from it." : "50% = half, 25% = quarter, 75% = three quarters.",
      hint:
        pct === 50
          ? `What is half of ${whole}?`
          : pct === 25
            ? `Halve ${whole}, then halve it again.`
            : pct === 75
              ? `Find a quarter of ${whole} first.`
              : pct === 10
                ? `Take a 0 off the end of ${whole}.`
                : whole % 10 === 0
                  ? `Find 10% of ${whole} first, then double it.`
                  : `20% is a fifth. Divide ${whole} by 5.`,
    };
  }

  // Swap trick: x% of y = y% of x (e.g. 12% of 25 = 25% of 12).
  const swapped = easyPercent(whole, pct);
  if (swapped) {
    return {
      method: "Swap the numbers",
      idea: `${PER_CENT} A neat trick: ${pct}% of ${whole} is exactly the same as ${whole}% of ${pct}, and that one is easy.`,
      steps: [step(`Swap them round.`, `${pct}% of ${whole} = ${whole}% of ${pct}`), ...swapped, step("Same answer either way.", `${pct}% of ${whole} = ${nf(answer)}`)],
      check,
      remember: "x% of y is the same as y% of x. Swap them when one way is easier.",
      hint: `Try ${whole}% of ${pct} instead. It's the same answer.`,
    };
  }

  // Build from 10% and 5% (when 10% is a whole number).
  if (whole % 10 === 0 && pct % 5 === 0) {
    const ten = whole / 10;
    const tens = Math.floor(pct / 10);
    const hasFive = pct % 10 === 5;
    const five = ten / 2;
    const steps = [step(`Find 10%: divide by 10.`, `${whole} ÷ 10 = ${nf(ten)}`)];
    if (hasFive) steps.push(step("5% is half of 10%.", `${nf(ten)} ÷ 2 = ${nf(five)}`));
    if (tens > 1) steps.push(step(`${tens * 10}% is ${tens} lots of 10%.`, `${nf(ten)} × ${tens} = ${nf(ten * tens)}`));
    if (hasFive && tens > 0) steps.push(step(`Add the 5%.`, `${nf(ten * tens)} + ${nf(five)} = ${nf(answer)}`));
    return {
      method: "Build it from 10% and 5%",
      idea: `${PER_CENT} 10% is easy (divide by 10) and 5% is half of that. ${pct}% = ${[tens > 0 ? `${tens} × 10%` : null, hasFive ? "5%" : null].filter(Boolean).join(" + ")}.`,
      steps,
      check,
      remember: "10% = divide by 10. 5% = half of 10%. Build other percentages from those.",
      hint: `Find 10% of ${whole} first.`,
    };
  }

  // 12%, 18%, 22%: use 10% (or 20%) and 2%, where 2% is a fifth of 10%.
  if ((pct === 12 || pct === 18 || pct === 22) && whole % 50 === 0) {
    const ten = whole / 10;
    const two = ten / 5;
    const base = pct === 12 ? 10 : 20;
    const baseVal = base === 10 ? ten : ten * 2;
    const add = pct !== 18;
    const steps = [step("Find 10%: divide by 10.", `${whole} ÷ 10 = ${ten}`)];
    if (base === 20) steps.push(step("20% is double that.", `${ten} × 2 = ${baseVal}`));
    steps.push(step("2% is a fifth of 10%.", `${ten} ÷ 5 = ${two}`));
    steps.push(step(add ? `${pct}% = ${base}% + 2%.` : "18% = 20% − 2%.", `${baseVal} ${add ? "+" : "−"} ${two} = ${nf(answer)}`));
    return {
      method: add ? `${base}% plus 2%` : "20% minus 2%",
      idea: `${PER_CENT} ${pct}% is close to ${base}%, which is easy. 2% is a small fix: a fifth of 10%.`,
      steps,
      check,
      remember: "10% = divide by 10. 2% = a fifth of 10%. Nudge up or down from 10% or 20%.",
      hint: `Find 10% of ${whole} first.`,
    };
  }

  // Multiples of 4% when the whole is a multiple of 25: 4% is ÷25.
  if (pct % 4 === 0 && whole % 25 === 0) {
    const four = whole / 25;
    const times = pct / 4;
    return {
      method: "Use 4%: divide by 25",
      idea: `${PER_CENT} 4 out of 100 is the same as 1 out of 25, so 4% means divide by 25. ${pct}% is ${times} lots of 4%.`,
      steps: [
        step(`How many 25s fit in ${whole}? That's 4%.`, `${whole} ÷ 25 = ${four}`),
        step(`${pct}% is ${times} lots of 4%.`, `${four} × ${times} = ${nf(answer)}`),
      ],
      check,
      remember: "4% is the same as dividing by 25. Handy when the number is a multiple of 25.",
      hint: `How many 25s fit into ${whole}?`,
    };
  }

  // Build from 1% (when 1% is a whole number).
  if (whole % 100 === 0) {
    const one = whole / 100;
    return {
      method: "Find 1% first",
      idea: `${PER_CENT} So 1% is ${whole} split into 100 equal parts, and ${pct}% is ${pct} of those parts.`,
      steps: [step(`Find 1%: divide by 100 (take two 0s off).`, `${whole} ÷ 100 = ${one}`), step(`${pct}% is ${pct} lots of 1%.`, `${one} × ${pct} = ${nf(answer)}`)],
      check,
      remember: "1% = divide by 100. Then multiply by the percentage.",
      hint: `Find 1% of ${whole} first by taking two 0s off.`,
    };
  }

  // Fallback: 10% and 1% (may use decimals).
  const ten = whole / 10;
  const one = whole / 100;
  const tens = Math.floor(pct / 10);
  const ones = pct % 10;
  return {
    method: "Build it from 10% and 1%",
    idea: `${PER_CENT} 10% is divide by 10 and 1% is divide by 100. ${pct}% = ${tens} × 10% + ${ones} × 1%.`,
    steps: [
      step("Find 10% and 1%.", `10% = ${nf(ten)}, 1% = ${nf(one)}`),
      step(`Make ${tens * 10}%.`, `${nf(ten)} × ${tens} = ${nf(ten * tens)}`),
      step(`Make ${ones}%.`, `${nf(one)} × ${ones} = ${nf(one * ones)}`),
      step("Add them.", `${nf(ten * tens)} + ${nf(one * ones)} = ${nf(answer)}`),
    ],
    check,
    remember: "10% = divide by 10, 1% = divide by 100. Build any percentage from those.",
    hint: `Find 10% of ${whole} first.`,
  };
}

/** "240 + 5%" (add VAT) or "350 − 20%" (discount): find the part, then add or take it away. */
function percentChangeTip(pct: number, whole: number, mode: number): CoachingTip {
  const part = (whole * pct) / 100;
  const total = mode === 1 ? whole + part : whole - part;
  const base = percentageTip(pct, whole);
  const add = mode === 1;
  return {
    method: add ? `Add ${pct}% on top` : `Take ${pct}% off`,
    idea: add
      ? `Adding ${pct}% means: work out ${pct}% of ${whole}, then add it to ${whole}.`
      : `${pct}% off means: work out ${pct}% of ${whole}, then take it away from ${whole}.`,
    steps: [
      ...base.steps,
      step(add ? `Add that onto the price.` : "Take that off the price.", `${whole} ${add ? "+" : "−"} ${nf(part)} = ${nf(total)}`),
    ],
    check: add ? `Check: the total must be a little more than ${whole}.` : `Check: the sale price must be less than ${whole}.`,
    remember: add
      ? "Adding VAT? 5% is half of 10%. Find it, then add it on."
      : "Discount? Work out the percentage, then take it off the price.",
    hint: `First find ${pct}% of ${whole}.`,
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
      return ops[2] === 1 || ops[2] === -1 ? percentChangeTip(x, y, ops[2]) : percentageTip(x, y);
    default:
      return null;
  }
}
