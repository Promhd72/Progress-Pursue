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
  const roundable = (n: number) => (n < 100 ? n % 10 >= 8 : n % 100 >= 98);
  const near = roundable(b) ? b : roundable(a) ? a : null;
  if (near !== null) {
    const other = near === b ? a : b;
    const up = near < 100 ? nextTen(near) : Math.ceil(near / 100) * 100;
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
      remember: "Numbers just under a round number (like 29 or 498): round up, add, then take back the extra.",
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
  const steps = places.map((p) =>
    p.x > 0 && p.y > 0
      ? step(`Add the ${names[p.unit]}.`, `${p.x} + ${p.y} = ${p.x + p.y}`)
      : step(`Only one number has ${names[p.unit]}, so just keep ${p.x + p.y}.`),
  );
  if (subtotals.length > 1) {
    steps.push(step("Put the pieces together.", `${subtotals.join(" + ")} = ${sum}`));
  }
  const first = places.find((p) => p.x > 0 && p.y > 0) ?? places[0];
  return {
    method: places[0].unit === 100 ? "Hundreds, tens and ones separately" : "Tens first, then ones",
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

  // Both under 10: count back a little, or count up when the numbers are close.
  if (a < 10) {
    const up = diff <= b;
    return {
      method: up ? "Count up from the smaller number" : "Count back",
      idea: up ? `${b} and ${a} are close, so just count the steps from ${b} up to ${a}.` : `Start at ${a} and count back ${b} step${b === 1 ? "" : "s"}.`,
      steps: up
        ? [step(`Start at ${b} and count up to ${a}.`, `${b} + ${diff} = ${a}`), step(`That's ${diff} steps.`, `${a} − ${b} = ${diff}`)]
        : [step(`Start at ${a} and count back ${b}.`, `${a} − ${b} = ${diff}`)],
      check,
      remember: "Small numbers? Count back, or count up if they're close together.",
      hint: up ? `Count up from ${b} to ${a}.` : `Start at ${a} and count back ${b}.`,
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
  if ((b >= 10 && b < 100 && b % 10 >= 8) || (b >= 100 && b % 100 >= 98)) {
    const up = b < 100 ? nextTen(b) : Math.ceil(b / 100) * 100;
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
      remember: "Taking away a number just under a round one (like 29 or 198)? Take the round number, then give back the extra.",
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

  // General: take away b one place at a time (hundreds, tens, ones).
  const pieces = parts(b);
  const steps: CoachingStep[] = [];
  let cur = a;
  const label = (p: number) => (p >= 100 ? "hundreds" : p >= 10 ? "tens" : "ones");
  for (const p of pieces) {
    steps.push(step(steps.length === 0 ? `Take away the ${label(p)} first.` : `Then take away the ${label(p)}.`, `${cur} − ${p} = ${cur - p}`));
    cur -= p;
  }
  return {
    method: pieces.length > 2 ? "Hundreds, then tens, then ones" : "Take away the tens, then the ones",
    idea:
      pieces.length === 1
        ? `${b} is a round number, so only the ${label(b)} change.`
        : `Taking away ${b} all at once is hard. Taking it in pieces (${pieces.join(", then ")}) is a few small jumps.`,
    steps,
    check,
    remember: "Split the number you take away into pieces (hundreds, tens, ones) and take them one at a time.",
    hint: `Take away ${pieces[0]} first.`,
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
          idea: "Times 10 always just adds a 0 to the end of a whole number.",
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
    // Split the smaller of the two numbers above 5 (fewer extra steps), e.g. 7 × 8 → 5 × 8 + 2 × 8.
    const splitN = small > 5 ? small : big;
    const other = splitN === a ? b : a;
    const base = splitN > 5 ? 5 : 2;
    const restCount = splitN - base;
    const first = splitN === a ? `${base} × ${other}` : `${other} × ${base}`;
    const second = splitN === a ? `${restCount} × ${other}` : `${other} × ${restCount}`;
    return {
      method: "Build it from an easier fact",
      idea: `${a} × ${b} is the same as ${first} plus ${second}. Both of those are easy.`,
      steps: [
        step(`Start with the easy one.`, `${first} = ${base * other}`),
        step(`Then the ${restCount} that's left.`, `${second} = ${restCount * other}`),
        step("Add them together.", `${base * other} + ${restCount * other} = ${product}`),
      ],
      check,
      remember: `Worth learning by heart: ${a} × ${b} = ${product}.`,
      hint: `Start with ${first}.`,
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
  const fmt = (x: number) => (splitNum === a ? `${x} × ${keep}` : `${keep} × ${x}`);
  // When the other number has two digits too, show how to do each piece.
  const keepT = tensOf(keep);
  const keepO = keep - keepT;
  const tensHow = keep >= 10 ? ` (${keep} × ${tens / 10} = ${keep * (tens / 10)}, then add a 0)` : "";
  const onesHow = keep >= 10 && keepO > 0 && !helper ? ` (${ones} × ${keepT} = ${ones * keepT}, plus ${ones} × ${keepO} = ${ones * keepO})` : "";
  const steps = [step(`Split ${splitNum} into ${tens} and ${ones}. Do the ${tens} first${tens === 10 ? "" : tensHow}.`, `${fmt(tens)} = ${tensPart}`)];
  if (ones > 0) {
    steps.push(step(helper ? `Now the ${ones}. ${helper}` : `Now the ${ones}${onesHow}.`, `${fmt(ones)} = ${onesPart}`));
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
  if (divisor === 2) {
    return {
      method: "÷2 is halving",
      idea: "Dividing by 2 means splitting into two equal halves.",
      steps: [step(`Cut ${dividend} in half.`, `${dividend} ÷ 2 = ${q}`)],
      check,
      remember: "Divide by 2? Halve it.",
      hint: `What is half of ${dividend}?`,
    };
  }
  if (divisor === 5) {
    return {
      method: "÷5: double, then take a 0 off",
      idea: "Dividing by 5 gives the same answer as doubling and then dividing by 10.",
      steps: [step(`Double ${dividend}.`, `${dividend} × 2 = ${dividend * 2}`), step("Take the 0 off the end.", `${dividend * 2} ÷ 10 = ${q}`)],
      check,
      remember: "Divide by 5? Double it, then take a 0 off.",
      hint: `Double ${dividend} first.`,
    };
  }

  // Small answers: walk up the times table.
  if (q <= 10) {
    // Start from an easy fact (×1, ×5 or ×10) and move one step at a time.
    const start = q <= 3 ? 1 : q <= 7 ? 5 : 10;
    const steps = [step(`Think: ${divisor} × what = ${dividend}?`)];
    steps.push(step(start === 1 ? `Count up in ${divisor}s.` : `Start from an easy fact.`, `${divisor} × ${start} = ${divisor * start}`));
    for (let k = start + (q > start ? 1 : -1); q > start ? k <= q : k >= q; k += q > start ? 1 : -1) {
      steps.push(step(k > start ? `Add one more ${divisor}.` : `Take one ${divisor} away.`, `${divisor} × ${k} = ${divisor * k}`));
    }
    steps.push(step(`That's ${dividend}, so the answer is ${q}.`, `${dividend} ÷ ${divisor} = ${q}`));
    return {
      method: "Turn it into a times-table question",
      idea,
      steps,
      check,
      remember: "Division is times tables backwards. Ask: what times the small number gives the big one?",
      hint: `What times ${divisor} makes ${dividend}? Try ${divisor} × 5 or ${divisor} × 10 first.`,
    };
  }

  if (divisor === 4 && dividend < 200) {
    const half = dividend / 2;
    return {
      method: "÷4 is half, then half again",
      idea: "4 is 2 × 2, so halving twice gives the same answer as dividing by 4.",
      steps: [step(`Cut ${dividend} in half.`, `${dividend} ÷ 2 = ${half}`), step("Cut that in half again.", `${half} ÷ 2 = ${q}`)],
      check,
      remember: "Divide by 4? Halve it, then halve again.",
      hint: `Cut ${dividend} in half first.`,
    };
  }

  // Answer is a round number of tens (e.g. 180 ÷ 9): drop the zero, divide, put it back.
  if (q % 10 === 0 && dividend % 10 === 0) {
    const small = dividend / 10;
    return {
      method: "Hide the zero, then put it back",
      idea: `${dividend} is just ${small} tens. So divide ${small}, and the answer is that many tens.`,
      steps: [
        step(`Cover the 0 on ${dividend} and divide what's left.`, `${small} ÷ ${divisor} = ${small / divisor}`),
        step("Put the 0 back on.", `${small / divisor} × 10 = ${q}`),
      ],
      check,
      remember: "Numbers ending in 0? Hide the 0, divide, then put the 0 back.",
      hint: `Ignore the 0 on ${dividend} for now. What's ${small} ÷ ${divisor}?`,
    };
  }

  // Single-digit divisor: divide digit by digit from the left, carrying what's left over.
  if (divisor < 10) return digitByDigit(dividend, divisor, idea, check);

  // Bigger divisors: take out a big easy chunk (×10s) first.
  const tensCount = Math.floor(q / 10) * 10;
  const chunk = tensCount * divisor;
  const rest = dividend - chunk;
  const steps = [
    step(`Take out an easy chunk: ${tensCount} lots of ${divisor}.`, `${divisor} × ${tensCount} = ${chunk}`),
    step(`See what's left.`, `${dividend} − ${chunk} = ${rest}`),
  ];
  if (rest > 0) {
    steps.push(step(`How many ${divisor}s are in ${rest}?`, `${rest} ÷ ${divisor} = ${rest / divisor}`));
    steps.push(step("Add the two counts.", `${tensCount} + ${rest / divisor} = ${q}`));
  }
  return {
    method: "Take out an easy chunk",
    idea: `${divisor} × 10 is easy, so take out a big round chunk of ${divisor}s first. Then only a small piece is left to divide.`,
    steps,
    check,
    remember: "Dividing by a big number? Take out lots of 10 first, then the rest.",
    hint: `How much is ${divisor} × ${tensCount}?`,
  };
}

/** Short division in your head: 184 ÷ 8 → 18 ÷ 8 = 2, 2 left; 24 ÷ 8 = 3; answer 23. */
function digitByDigit(dividend: number, divisor: number, idea: string, check: string): CoachingTip {
  const digits = String(dividend).split("").map(Number);
  const steps: CoachingStep[] = [];
  const answer: number[] = [];
  let carry = 0;
  let i = 0;
  // First chunk: enough leading digits to fit the divisor at least once.
  let cur = digits[0];
  while (cur < divisor && i < digits.length - 1) {
    i += 1;
    cur = cur * 10 + digits[i];
  }
  const firstPart = cur;
  for (;;) {
    const qd = Math.floor(cur / divisor);
    carry = cur - qd * divisor;
    answer.push(qd);
    const isFirst = steps.length === 0;
    const say = isFirst
      ? i === 0
        ? `Start with the first digit, ${cur}. How many ${divisor}s are in ${cur}?`
        : `${digits[0]} is too small for ${divisor}, so start with ${firstPart}. How many ${divisor}s are in ${firstPart}?`
      : qd === 0
        ? `How many ${divisor}s are in ${cur}? None, so write 0.`
        : `How many ${divisor}s are in ${cur}?`;
    steps.push(step(say, carry > 0 ? `${cur} ÷ ${divisor} = ${qd}, ${carry} left over` : `${cur} ÷ ${divisor} = ${qd}`));
    if (i >= digits.length - 1) break;
    i += 1;
    const next = digits[i];
    const joined = carry * 10 + next;
    steps.push(
      step(
        carry > 0 ? `Put the ${carry} left over in front of the next digit, ${next}. That makes ${joined}.` : `Move on to the next digit, ${next}.`,
      ),
    );
    cur = joined;
  }
  const result = Number(answer.join(""));
  steps.push(step(`Put the answer digits side by side: ${answer.join(", ")}.`, `${dividend} ÷ ${divisor} = ${result}`));
  return {
    method: "Divide digit by digit",
    idea: `You don't have to divide ${dividend} all at once. Go from the left, one digit at a time, and carry anything left over to the next digit.`,
    steps,
    check,
    remember: "Big number ÷ a single digit? Go left to right, divide, and carry what's left over to the next digit.",
    hint: firstPart === digits[0] ? `How many ${divisor}s are in ${firstPart}?` : `Start with ${firstPart}. How many ${divisor}s are in it?`,
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
      idea: `${PER_CENT} ${pct === 50 ? "50 out of 100 is half." : pct === 25 ? "25 out of 100 is a quarter." : pct === 75 ? "75 out of 100 is three quarters." : pct === 20 ? "20 out of 100 is one fifth, or two lots of 10%." : "10 out of 100 is one tenth, so you divide by 10."}`,
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
      idea:
        tens === 0
          ? `${PER_CENT} 10% is easy (divide by 10), and 5% is half of that.`
          : `${PER_CENT} 10% is easy (divide by 10) and 5% is half of that. ${pct}% = ${[tens === 1 ? "10%" : `${tens} × 10%`, hasFive ? "5%" : null].filter(Boolean).join(" + ")}.`,
      steps,
      check,
      remember: "10% = divide by 10. 5% = half of 10%. Build other percentages from those.",
      hint: `Find 10% of ${whole} first.`,
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

  // The product lands on a round hundred (e.g. 8% of 125 → 8 × 125 = 1,000): multiply, then ÷100.
  if ((pct * whole) % 100 === 0 && pct * whole <= 5000) {
    const prod = pct * whole;
    return {
      method: "Multiply, then take two 0s off",
      idea: `${PER_CENT} So ${pct}% of ${whole} is ${pct} × ${whole}, then divided by 100.`,
      steps: [step(`Multiply the two numbers.`, `${pct} × ${whole} = ${prod}`), step("Divide by 100: take two 0s off.", `${prod} ÷ 100 = ${nf(answer)}`)],
      check,
      remember: "Any percentage: multiply the two numbers, then divide by 100.",
      hint: `Work out ${pct} × ${whole} first.`,
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
      ? `Adding ${pct}%? Work out ${pct}% first, then add it on.`
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
