// Hand-crafted "Advanced" questions: short business story + optional
// chart/table + 4-option multiple choice. Answers and step-by-step technique
// live in code (server-trusted).

export type ChartPoint = { label: string; value: number };
export type Visual =
  | { kind: "bar"; unit?: string; data: ChartPoint[] }
  | { kind: "line"; unit?: string; data: ChartPoint[] }
  | { kind: "table"; columns: string[]; rows: (string | number)[][] }
  | { kind: "none" };

export type { AdvancedDomain } from "./advanced-domains";
import type { AdvancedDomain } from "./advanced-domains";

export type AdvancedQuestion = {
  id: string;
  domain: AdvancedDomain;
  topic: string;            // e.g. "Pricing", "Forecasting"
  scenario: string;         // 1–3 sentence story
  visual: Visual;
  question: string;
  options: string[];        // 4 choices
  correctIndex: number;
  /** Progressive nudges the user can request BEFORE answering. 2–3 items, increasing in specificity. Never reveals the answer. */
  hints: string[];
  /** Headline takeaway shown after submission. */
  explanation: string;
  /** Step-by-step mental-math technique, shown after submission. Each step is one short move you'd actually do in your head. */
  steps: string[];
  /** One-line name of the technique, e.g. "Round-and-adjust". */
  technique?: string;
};

export const ADVANCED_QUESTIONS: AdvancedQuestion[] = [
  {
    id: "q-revenue-mix",
    domain: "finance",
    topic: "Revenue mix",
    scenario:
      "You're prepping for a Monday review. Q3 revenue came in across three product lines and the CEO wants the percentage Subscriptions contributed.",
    visual: {
      kind: "bar",
      unit: "$K",
      data: [
        { label: "Subscriptions", value: 480 },
        { label: "Services", value: 270 },
        { label: "Add-ons", value: 50 },
      ],
    },
    question: "Roughly what share of Q3 revenue came from Subscriptions?",
    options: ["48%", "60%", "55%", "40%"],
    correctIndex: 1,
    technique: "Round to a friendly total",
    hints: [
      "Don't try to divide 480 by the exact total. First, what's the total?",
      "The numbers round to a clean 800. Now compare Subscriptions to that.",
      "480 out of 800 — drop a zero from both. What's 48 / 80?",
    ],
    explanation: "480 of 800 → 60%.",
    steps: [
      "Add the parts in any order: 270 + 50 = 320, then 320 + 480 = 800.",
      "You want 480 ÷ 800. Strip a shared zero: 48 ÷ 80.",
      "48 ÷ 80 = 48 ÷ 8 ÷ 10 = 6 ÷ 10 = 0.6.",
      "0.6 → 60%.",
    ],
  },
  {
    id: "q-tip-split",
    domain: "general",
    topic: "Restaurant math",
    scenario:
      "Dinner with three colleagues. The bill below shows each person's order. You want to add an 18% tip and split the total evenly four ways.",
    visual: {
      kind: "table",
      columns: ["Person", "Order ($)"],
      rows: [
        ["You", 22],
        ["Alex", 28],
        ["Sam", 26],
        ["Jo", 24],
      ],
    },
    question: "What does each person pay (to the nearest dollar)?",
    options: ["$28", "$30", "$32", "$35"],
    correctIndex: 1,
    technique: "Pair to round, then 10% + half",
    hints: [
      "Pair numbers that round each other off: 22 + 28, 26 + 24.",
      "For 18%, take 10% (move the decimal) then add half of that — close enough.",
      "Once you have the tipped total, ÷4 is the same as ÷2 twice.",
    ],
    explanation: "Subtotal 100 → tip ~18 → 118 ÷ 4 ≈ $30.",
    steps: [
      "Pair to a clean subtotal: (22+28) + (26+24) = 50 + 50 = 100.",
      "10% of 100 = 10. Half of that = 5. 18% ≈ 10 + 5 + a hair = ~18.",
      "Total ≈ 118. Split four ways: 118 ÷ 2 = 59, then 59 ÷ 2 ≈ 29.5.",
      "Round up to the nearest dollar → $30 each.",
    ],
  },
  {
    id: "q-runway",
    domain: "finance",
    topic: "Cash runway",
    scenario:
      "A founder pings you mid-call: cash on hand is $1.2M and net burn has trended like this over the past four months. Estimate runway at the most recent burn rate.",
    visual: {
      kind: "line",
      unit: "$K/mo burn",
      data: [
        { label: "M1", value: 180 },
        { label: "M2", value: 200 },
        { label: "M3", value: 240 },
        { label: "M4", value: 300 },
      ],
    },
    question: "About how many months of runway remain?",
    options: ["3 months", "4 months", "5 months", "6 months"],
    correctIndex: 1,
    technique: "Match the units, then divide",
    hints: [
      "Runway = cash ÷ burn. Use the latest burn, not the average.",
      "Make units match: $1.2M = $1,200K.",
      "1,200 ÷ 300 — both end in zeros you can strip.",
    ],
    explanation: "$1,200K ÷ $300K/mo = 4 months at current burn.",
    steps: [
      "Convert to the same unit: $1.2M = $1,200K.",
      "Latest burn is $300K/mo (the most recent point matters most).",
      "1,200 ÷ 300: strip two zeros → 12 ÷ 3 = 4.",
      "Answer: ~4 months.",
    ],
  },
  {
    id: "q-discount-stack",
    domain: "sales",
    topic: "Pricing",
    scenario:
      "A vendor offers a 20% volume discount and then an additional 10% for paying upfront. The list price is $4,000.",
    visual: { kind: "none" },
    question: "What's the final price after both discounts?",
    options: ["$2,800", "$2,880", "$3,000", "$3,200"],
    correctIndex: 1,
    technique: "Multiply the survivors",
    hints: [
      "Stacked discounts don't add — they multiply. Don't do 30% off.",
      "After 20% off you keep 80%. After 10% off you keep 90%.",
      "So the price is 4,000 × 0.8 × 0.9. Do one step at a time.",
    ],
    explanation: "Stacked, not added: 4000 × 0.8 × 0.9 = 2880.",
    steps: [
      "Convert each discount to what you keep: 20% off → ×0.8, 10% off → ×0.9.",
      "Apply them in order: 4,000 × 0.8 = 3,200.",
      "3,200 × 0.9 = 3,200 − 320 = 2,880.",
      "Final: $2,880 (not $2,800 — that's the additive trap).",
    ],
  },
  {
    id: "q-conversion",
    domain: "marketing",
    topic: "Funnel",
    scenario:
      "Your team ran a landing page test. The funnel below shows visitors moving through each step. The PM asks for visit-to-purchase conversion.",
    visual: {
      kind: "table",
      columns: ["Step", "Users"],
      rows: [
        ["Visited", 12500],
        ["Signed up", 2500],
        ["Trialed", 750],
        ["Purchased", 250],
      ],
    },
    question: "What's the overall visit-to-purchase rate?",
    options: ["1%", "2%", "2.5%", "5%"],
    correctIndex: 1,
    technique: "End-to-end, not step-by-step",
    hints: [
      "Overall rate = bottom of the funnel ÷ top. Ignore the middle.",
      "250 ÷ 12,500. Cancel a shared zero: 25 ÷ 1,250.",
      "Cancel another: 1 ÷ 50 = 0.02.",
    ],
    explanation: "250 / 12,500 = 0.02 = 2%.",
    steps: [
      "Use only top and bottom: 250 purchased out of 12,500 visited.",
      "Strip one zero from each: 25 / 1,250.",
      "Notice 25 × 50 = 1,250, so 25 / 1,250 = 1 / 50.",
      "1 / 50 = 0.02 → 2%.",
    ],
  },
  {
    id: "q-cogs-margin",
    domain: "finance",
    topic: "Margins",
    scenario:
      "Quarterly numbers just dropped. The CFO wants gross margin in her head before the call starts.",
    visual: {
      kind: "bar",
      unit: "$M",
      data: [
        { label: "Revenue", value: 50 },
        { label: "COGS", value: 32 },
      ],
    },
    question: "What's the gross margin?",
    options: ["32%", "36%", "40%", "64%"],
    correctIndex: 1,
    technique: "Subtract first, then divide",
    hints: [
      "Gross margin = (Revenue − COGS) / Revenue. Do the subtraction first.",
      "50 − 32 = 18. Now you want 18 / 50.",
      "Dividing by 50 is the same as ×2 then ÷100.",
    ],
    explanation: "(50 − 32) / 50 = 18 / 50 = 36%.",
    steps: [
      "Gross profit = 50 − 32 = 18.",
      "Margin = 18 / 50. Trick: ÷50 = ×2 ÷100.",
      "18 × 2 = 36. 36 / 100 = 0.36.",
      "→ 36%.",
    ],
  },
  {
    id: "q-growth-rate",
    domain: "marketing",
    topic: "Forecasting",
    scenario:
      "MRR has compounded each month as shown. Investor asks for the average monthly growth rate.",
    visual: {
      kind: "line",
      unit: "$K MRR",
      data: [
        { label: "Jan", value: 100 },
        { label: "Feb", value: 110 },
        { label: "Mar", value: 121 },
        { label: "Apr", value: 133 },
      ],
    },
    question: "About what monthly growth rate is that?",
    options: ["5%", "8%", "10%", "12%"],
    correctIndex: 2,
    technique: "Look at one step",
    hints: [
      "You don't need a calculator. Compare two adjacent months.",
      "100 → 110 is +10 on a base of 100.",
      "If every step looks like ×1.1, the rate is the same each month.",
    ],
    explanation: "Each step is ~×1.1 (100→110→121→133), i.e. 10%/mo.",
    steps: [
      "Pick the simplest step: Jan → Feb is 100 → 110.",
      "Change ÷ base = 10 / 100 = 10%.",
      "Sanity check the next step: 110 × 1.1 = 121. ✓",
      "Same pattern holds → 10% per month.",
    ],
  },
  {
    id: "q-headcount",
    domain: "general",
    topic: "Hiring plan",
    scenario:
      "Team has 18 engineers today. Plan: add 4 per quarter for the next 3 quarters, but expect ~5% attrition each quarter on the current base.",
    visual: { kind: "none" },
    question: "Roughly how many engineers in 3 quarters?",
    options: ["27", "28", "30", "33"],
    correctIndex: 0,
    technique: "Adds and losses separately",
    hints: [
      "Handle the easy part first: total hires over 3 quarters.",
      "Attrition: 5% of 18 each quarter, three times — keep it simple.",
      "Net = start + hires − losses.",
    ],
    explanation: "Adds 12; losses ≈ 3 (5% × 3 × 18 ≈ 2.7). 18 + 12 − 3 ≈ 27.",
    steps: [
      "Hires: 4 × 3 = 12. Running total = 18 + 12 = 30.",
      "Attrition base = 18. 5% of 18 = 0.9 (think 10% = 1.8, then halve).",
      "Three quarters of attrition: 0.9 × 3 ≈ 2.7, round to ~3.",
      "30 − 3 = 27.",
    ],
  },
  {
    id: "q-unit-econ",
    domain: "finance",
    topic: "Unit economics",
    scenario:
      "Each customer pays $40/mo, costs you $10/mo to serve, and stays an average of 24 months. CAC is $300.",
    visual: { kind: "none" },
    question: "What's the LTV : CAC ratio?",
    options: ["2.0", "2.4", "2.8", "3.2"],
    correctIndex: 1,
    technique: "Margin × lifetime, then compare",
    hints: [
      "LTV uses margin per month, not revenue per month.",
      "Margin = 40 − 10 = 30. Multiply by lifetime months.",
      "Then divide LTV by CAC. 720 / 300 — strip a zero.",
    ],
    explanation: "Margin $30 × 24 mo = LTV $720. 720 / 300 = 2.4.",
    steps: [
      "Gross margin per month: 40 − 10 = $30.",
      "LTV = margin × lifetime = 30 × 24. Use 30 × 24 = 3 × 240 = 720.",
      "Ratio = 720 / 300. Strip a zero: 72 / 30 = 2.4.",
      "LTV : CAC = 2.4.",
    ],
  },
  {
    id: "q-discount-vs-volume",
    domain: "sales",
    topic: "Trade-offs",
    scenario:
      "A sales lead wants to offer a 15% discount expecting it'll lift volume by 25%. Current state: 200 units at $100 each.",
    visual: {
      kind: "table",
      columns: ["Metric", "Now", "After"],
      rows: [
        ["Unit price", "$100", "$85"],
        ["Units", 200, 250],
        ["Revenue", "?", "?"],
      ],
    },
    question: "What's the change in revenue?",
    options: ["+5.0%", "+6.25%", "+10%", "−2.5%"],
    correctIndex: 1,
    technique: "Multiply the two factors",
    hints: [
      "Skip the dollars. Revenue changes by (price factor) × (volume factor).",
      "Price ×0.85, volume ×1.25. Multiply those two.",
      "0.85 × 1.25 — turn it into 85 × 1.25 ÷ 100.",
    ],
    explanation: "0.85 × 1.25 = 1.0625 → +6.25%.",
    steps: [
      "Express each change as a multiplier: −15% → ×0.85, +25% → ×1.25.",
      "Combined factor = 0.85 × 1.25.",
      "Use 0.85 × 1.25 = 0.85 + (0.85 × 0.25) = 0.85 + 0.2125 = 1.0625.",
      "1.0625 → +6.25% revenue.",
    ],
  },
];

export type PublicAdvancedQuestion = Omit<
  AdvancedQuestion,
  "correctIndex" | "explanation" | "steps"
>;

export function toPublic(q: AdvancedQuestion): PublicAdvancedQuestion {
  const { correctIndex: _c, explanation: _e, steps: _s, ...rest } = q;
  return rest;
}
