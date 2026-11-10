import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, TrendingUp, Gift } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rapid Math — Mental math training that actually sticks" },
      {
        name: "description",
        content:
          "Short, daily mental math drills for professionals. Build real speed for percentages, estimates, and sanity checks — in 5 minutes a day.",
      },
      { property: "og:title", content: "Rapid Math — Think faster. Talk numbers." },
      {
        property: "og:description",
        content:
          "Mental math training that converts curiosity into a daily habit. Free to start.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* TOP BAR */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
            R
          </div>
          <span className="font-display text-lg font-semibold">Rapid Math</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/quick-test"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block"
          >
            Test yourself
          </Link>
          <a
            href="#pricing"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block"
          >
            Pricing
          </a>
          <Link
            to="/auth"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>

          <Link
            to="/auth"
            search={{ mode: "signup" } as never}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 md:pt-20 md:pb-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Built for working professionals
              </div>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
                Think faster. <span className="text-primary">Talk numbers.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Rapid Math is mental math training for people who do percentages in
                meetings, sanity-check a number on the fly, and don't want to reach for
                the calculator. Five minutes a day, real fluency.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/auth"
                  search={{ mode: "signup" } as never}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Start training free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/quick-test"
                  className="inline-flex items-center rounded-md border border-input bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
                >
                  Take the 60-second test
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free forever · No card required
              </p>
            </div>

            <HeroDemo />
          </div>
        </section>

        {/* QUICK TEST PROMO */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Card className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10 bg-surface/40 border-dashed">
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-semibold">Not sure where you stand?</h3>
              <p className="text-muted-foreground max-w-md">
                Find your baseline level across addition, percentages, and division in under a minute.
              </p>
            </div>
            <Link
              to="/quick-test"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-4 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
            >
              Test yourself in 60 seconds <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>

        {/* BENEFITS */}
        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-2xl">
              <SectionEyebrow label="Outcomes" />
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                What changes after two weeks of five-minute sessions.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Free is enough to build the habit. Pro is for the moment you want to
                actually move the curve.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {/* Feature card */}
              <div className="md:col-span-2 rounded-2xl border border-border bg-card p-8">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <TrendingUp className="h-4 w-4" />
                  The thing people notice first
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold">
                  Faster percentages in meetings, without breaking eye contact.
                </h3>
                <p className="mt-3 text-muted-foreground">
                  15%, 18%, 35%, a quick "is that roughly right?" — the small calculations
                  that show up constantly stop costing you a beat. Most users feel it on
                  day six.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <Stat value="−38%" label="Avg response time" />
                  <Stat value="+22%" label="Accuracy" />
                  <Stat value="14 days" label="Until it sticks" />
                </div>
              </div>

              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <h3 className="font-display text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <SectionEyebrow label="From the field" />
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Built for the meeting, not the classroom.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <figure className="md:col-span-2 flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8">
              <blockquote className="font-display text-2xl leading-snug text-foreground">
                "I tried two other math apps and bounced. The five-minute format is the
                only thing that's stuck for me — and I actually do quick percentages on
                calls now without reaching for the calculator. It feels embarrassingly
                good."
              </blockquote>
              <figcaption className="mt-6 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">Daniel K.</div>
                <div>Senior product manager, fintech</div>
              </figcaption>
            </figure>

            <div className="flex flex-col gap-5">
              <figure className="flex-1 rounded-2xl border border-border bg-card p-6">
                <blockquote className="text-foreground">
                  "Cheap, focused, no fluff. My mental arithmetic is the sharpest it's
                  been since school."
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">Priya S.</div>
                  <div>Founder</div>
                </figcaption>
              </figure>
              <figure className="flex-1 rounded-2xl border border-border bg-card p-6">
                <blockquote className="text-foreground">
                  "The adaptive drills on Pro caught a real weak spot — I was slow on
                  divisions. Fixed in a week."
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">Maya R.</div>
                  <div>Strategy consultant</div>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* OBJECTIONS */}
        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <div>
              <SectionEyebrow label="Questions" />
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Honest answers, before you sign up.
              </h2>
            </div>
            <Accordion type="single" collapsible className="mt-10">
              {objections.map((o) => (
                <AccordionItem key={o.q} value={o.q}>
                  <AccordionTrigger className="text-left font-medium">
                    {o.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {o.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-20 scroll-mt-20">

          <div className="text-center">
            <SectionEyebrow label="Pricing" centered />
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Start free. Upgrade when you want to level up.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              The free plan isn't a trial. It's a real product. Pro exists for the moment
              you want adaptive drills and the harder feedback loop.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                For the daily habit
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold tabular">Free</span>
                <span className="text-muted-foreground">forever</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                A daily taste of the product — enough to build a streak and feel the gains.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <Feature>
                  <strong className="text-foreground">Placement test</strong> to set
                  your starting level on every track
                </Feature>
                <Feature>
                  <strong className="text-foreground">Levels 1–2 on all five tracks</strong>{" "}
                  — addition, subtraction, multiplication, division, percentages
                </Feature>
                <Feature>
                  <strong className="text-foreground">3 lessons per day</strong> to build the habit
                </Feature>
                <Feature>XP, levels, and streak tracking</Feature>
                <Feature>
                  <strong className="text-foreground">3 Advanced scenarios per day</strong>{" "}
                  — boardroom-style story + chart questions
                </Feature>
                <Feature>
                  <span className="inline-flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-primary" />
                    7-day Speed Sprint starter program
                  </span>
                </Feature>
              </ul>

              <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                Levels 1–2 give you the feel. Most people upgrade once they want to
                push past Level 2 on a track — that's where real speed compounds.
              </div>


              <Link
                to="/auth"
                search={{ mode: "signup" } as never}
                className="mt-6 inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
              >
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-8 shadow-sm">
              <div className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                For people who want to get measurably faster
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Pro
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold tabular">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Billed monthly. Cancel anytime.
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                <Feature>
                  <strong className="text-foreground">All 10 levels on all 5 tracks</strong>{" "}
                  — the full curriculum, end to end
                </Feature>
                <Feature>
                  <strong className="text-foreground">Unlimited lessons per day</strong> —
                  train as much as you want
                </Feature>
                <Feature>Everything in Free</Feature>
                <Feature>
                  <strong className="text-foreground">Unlimited Advanced scenarios</strong> —
                  story + chart questions with multiple-choice answers
                </Feature>
                <Feature>
                  <strong className="text-foreground">Adaptive engine</strong> that tracks
                  your weakest operations and drills them harder
                </Feature>
                <Feature>
                  <strong className="text-foreground">Boardroom mode</strong>: 60-second
                  sprints around realistic business numbers
                </Feature>
                <Feature>Weekly progress report with percentile vs other pros</Feature>
                <Feature>Unlimited history and CSV export</Feature>
              </ul>
              <Link
                to="/auth"
                search={{ mode: "signup", plan: "pro" } as never}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Go Pro <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                30-day refund, no questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="mx-auto max-w-4xl px-6 py-24">
          <div className="rounded-3xl bg-foreground p-10 text-center text-background md:p-14">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Five minutes today. Sharper tomorrow.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-background/70">
              Start your streak now and feel the difference in your next meeting.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-xs text-background/60">
              Free forever · No card required · Upgrade only if you want to
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Rapid Math</span>
          <span>Think faster. Talk numbers.</span>
        </div>
      </footer>
    </div>
  );
}

function SectionEyebrow({ label, centered }: { label: string; centered?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground ${centered ? "justify-center" : ""}`}
    >
      <span className="h-px w-6 bg-primary" />
      {label}
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-3">
      <div className="font-display text-xl font-semibold tabular text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

const objections = [
  {
    q: "I don't have time for this.",
    a: "A session is 5 minutes. You can finish one on the walk to a meeting or on the train. The whole loop is designed around the days you'd rather skip.",
  },
  {
    q: "I've tried apps like this — they didn't stick.",
    a: "Most are built for kids learning multiplication. Rapid Math is built for adults: short sessions, real percentages, a streak loop that respects your time.",
  },
  {
    q: "I'm rusty. Will I keep up?",
    a: "Yes — difficulty starts gentle and adapts. The first week is intentionally easy so the habit lands before the challenge does.",
  },
  {
    q: "How is the app structured?",
    a: "You start with a 10-question placement test that sets your level on each of five tracks (addition, subtraction, multiplication, division, percentages). Each track has 10 levels — finish a 10-question lesson at 80%+ to unlock the next. No menus of difficulty/length to fiddle with; just open the app and continue where the curriculum left you.",
  },
  {
    q: "How is Pro different from Free?",
    a: "Free covers Levels 1–2 on every track, capped at 3 lessons a day — enough to feel the gains. Pro unlocks Levels 3–10 on all five tracks, removes the daily cap, and turns on the adaptive engine, Boardroom mode, and the weekly report. Most people start on Free and upgrade once Level 2 stops feeling sharp.",
  },
  {
    q: "I'm not sure this is right for me.",
    a: "If you do mental math in meetings — percentages, quick estimates, sanity checks on a number someone just said — this is for you. If you're prepping for a math exam, it isn't.",
  },
];

const benefits = [
  {
    title: "Sharper estimates",
    body: "Spot a wrong number the moment it leaves someone's mouth.",
  },
  {
    title: "A habit that sticks",
    body: "Streaks and XP designed for adults, not gamified to death.",
  },
  {
    title: "Measured progress",
    body: "Accuracy, average time, XP per session — tracked every time.",
  },
  {
    title: "Six drill types",
    body: "Addition, subtraction, multiplication, division, percentages, mixed.",
  },
];
