import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

type Scenario = {
  question: string;
  answer: string;
  qNumber: number;
  category: string;
  difficulty: string;
  time: string;
  accuracy: string;
  avg: string;
  xp: string;
  tipTitle: string;
  tipBody: React.ReactNode;
  next: string;
};

const scenarios: Scenario[] = [
  {
    question: "18% of 250",
    answer: "45",
    qNumber: 7,
    category: "Percentages",
    difficulty: "Medium",
    time: "00:42",
    accuracy: "96%",
    avg: "3.1s",
    xp: "+42",
    tipTitle: "Split the percent into 10% + half of 10%.",
    tipBody: (
      <>
        10% of 250 is <Num>25</Num>. Half of that is <Num>12.5</Num>. For 18%, you want
        10% + 8%: <Num>25 + 20 = 45</Num>.
      </>
    ),
    next: "Percentages · Medium · 10 Qs",
  },
  {
    question: "47 × 6",
    answer: "282",
    qNumber: 8,
    category: "Multiplication",
    difficulty: "Medium",
    time: "00:51",
    accuracy: "94%",
    avg: "3.4s",
    xp: "+38",
    tipTitle: "Round up, then subtract the difference.",
    tipBody: (
      <>
        Think <Num>50 × 6 = 300</Num>. You over-counted by <Num>3 × 6 = 18</Num>. So{" "}
        <Num>300 − 18 = 282</Num>.
      </>
    ),
    next: "Multiplication · Medium · 15 Qs",
  },
  {
    question: "1,240 ÷ 4",
    answer: "310",
    qNumber: 9,
    category: "Division",
    difficulty: "Medium",
    time: "01:03",
    accuracy: "95%",
    avg: "3.0s",
    xp: "+40",
    tipTitle: "Halve it twice — division by 4 made easy.",
    tipBody: (
      <>
        Half of <Num>1,240</Num> is <Num>620</Num>. Half of that is <Num>310</Num>. Two
        easy halvings beat one hard division.
      </>
    ),
    next: "Division · Medium · 12 Qs",
  },
  {
    question: "Tip 15% on $86",
    answer: "12.90",
    qNumber: 10,
    category: "Percentages",
    difficulty: "Hard",
    time: "01:18",
    accuracy: "97%",
    avg: "2.9s",
    xp: "+45",
    tipTitle: "10% + half of 10% — the restaurant shortcut.",
    tipBody: (
      <>
        10% of 86 is <Num>8.60</Num>. Half of that is <Num>4.30</Num>. Add:{" "}
        <Num>8.60 + 4.30 = 12.90</Num>.
      </>
    ),
    next: "Percentages · Hard · 10 Qs",
  },
];

function Num({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground tabular">{children}</span>;
}

export function HeroDemo() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold">("typing");
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [slideKey, setSlideKey] = useState(0);

  const goTo = (next: number, dir: 1 | -1 = 1) => {
    const normalized = ((next % scenarios.length) + scenarios.length) % scenarios.length;
    if (normalized === index) return;
    setPaused(true);
    setDirection(dir);
    setIndex(normalized);
    setSlideKey((key) => key + 1);
  };

  const goNext = () => goTo(index + 1, 1);
  const goPrev = () => goTo(index - 1, -1);

  const scenario = scenarios[index];

  // Typing effect for the answer
  useEffect(() => {
    setTyped("");
    setPhase("typing");
    let i = 0;
    const target = scenario.answer;
    const interval = setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(interval);
        setPhase("hold");
      }
    }, 140);
    return () => clearInterval(interval);
  }, [index, scenario.answer]);

  // Hold, then advance (skipped when user has taken control)
  useEffect(() => {
    if (phase !== "hold" || paused) return;
    const hold = setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % scenarios.length);
      setSlideKey((key) => key + 1);
    }, 2600);
    return () => clearTimeout(hold);
  }, [phase, paused]);

  const slideClass = direction === 1 ? "animate-slide-in-right" : "animate-slide-in-left";


  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />

      <div
        key={slideKey}
        className={`relative ${slideClass}`}
      >
        {/* Question card */}
        <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Question {scenario.qNumber} / 25 · {scenario.category} · {scenario.difficulty}
            </span>
            <span className="tabular">{scenario.time}</span>
          </div>
          <div className="mt-6 text-center">
            <div className="font-display text-5xl font-semibold tabular tracking-tight text-foreground md:text-6xl">
              {scenario.question}
            </div>
            <div className="mx-auto mt-5 inline-flex min-w-[7rem] items-baseline justify-center gap-2 rounded-xl border-2 border-primary/40 bg-background px-6 py-3">
              <span className="font-display text-3xl tabular text-primary">
                {typed || "\u00A0"}
              </span>
              <span
                className={`h-6 w-px bg-primary ${phase === "typing" ? "animate-pulse" : "opacity-60 animate-pulse"}`}
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="font-display text-base text-foreground tabular">
                {scenario.accuracy}
              </div>
              Accuracy
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="font-display text-base text-foreground tabular">
                {scenario.avg}
              </div>
              Avg
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="font-display text-base text-foreground tabular">
                {scenario.xp}
              </div>
              XP
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="relative my-2 flex items-center justify-center">
          <div className="h-px flex-1 bg-border" />
          <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Then — coaching
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Training / tip card */}
        <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Lightbulb className="h-4 w-4" />
            Trainer tip
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
            {scenario.tipTitle}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{scenario.tipBody}</p>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <span>Next drill suggestion</span>
            <span className="font-medium text-foreground">{scenario.next}</span>
          </div>
        </div>
      </div>

      {/* Navigation: arrows + dots */}
      <div className="relative z-10 mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous drill"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:-translate-x-0.5 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {scenarios.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i, i > index ? 1 : -1)}
              aria-label={`Show drill ${i + 1}: ${s.question}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 hover:bg-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                i === index ? "w-8 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next drill"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:translate-x-0.5 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
