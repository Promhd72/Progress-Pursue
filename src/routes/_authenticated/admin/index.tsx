import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMetrics } from "@/lib/admin.functions";
import { Users, Crown, DollarSign, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — Rapid Math" }] }),
  component: AdminOverview,
});

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function AdminOverview() {
  const fn = useServerFn(getAdminMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading metrics…</div>;

  const maxSignups = Math.max(1, ...data.trend.map((t) => t.signups));

  return (
    <div className="space-y-6">
      <Section title="Users" icon={Users}>
        <Stat label="Total users" value={String(data.users.total)} />
        <Stat label="Pro users" value={String(data.users.pro)} sub={`${data.users.conversionRate}% conversion`} />
        <Stat label="Paid Pro" value={String(data.users.paid)} sub={`${data.users.coupon} via coupon`} />
        <Stat label="New (7d)" value={String(data.users.newLast7)} />
      </Section>

      <Section title="Revenue" icon={DollarSign}>
        <Stat label="MRR" value={money(data.revenue.mrrCents)} />
        <Stat label="ARR (run rate)" value={money(data.revenue.arrCents)} />
        <Stat label="Active subscriptions" value={String(data.revenue.activeSubscriptions)} />
        <Stat
          label="This month"
          value={`+${data.revenue.newSubsThisMonth}`}
          sub={`${data.revenue.churnedThisMonth} churned`}
        />
      </Section>

      <Section title="Activity" icon={Activity}>
        <Stat label="Active today" value={String(data.users.activeToday)} />
        <Stat label="Active (7d)" value={String(data.users.active7)} />
        <Stat label="Active (30d)" value={String(data.users.active30)} />
        <Stat label="Placement tests" value={String(data.engagement.placementTests)} />
      </Section>

      <Section title="Learning" icon={Crown}>
        <Stat label="Lessons completed" value={String(data.engagement.lessonsCompleted)} sub={`${data.engagement.lessonsPassed} passed`} />
        <Stat label="Questions answered" value={data.engagement.questionsAnswered.toLocaleString()} />
        <Stat label="Avg accuracy" value={`${data.engagement.accuracy}%`} />
        <Stat
          label="Avg time / question"
          value={data.engagement.avgMsPerQuestion ? `${(data.engagement.avgMsPerQuestion / 1000).toFixed(1)}s` : "—"}
        />
        <Stat label="Advanced attempts" value={String(data.engagement.advancedAttempts)} sub={`${data.engagement.advancedAccuracy}% correct`} />
        <Stat label="Coupon redemptions" value={String(data.engagement.couponRedemptions)} />
      </Section>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Signups &amp; new subscriptions — last 30 days
        </h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {data.trend.map((t) => (
            <div key={t.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-primary/25"
                style={{ height: `${(t.signups / maxSignups) * 100}%`, minHeight: t.signups ? 4 : 1 }}
              />
              {t.newSubs > 0 && (
                <div
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${(t.newSubs / maxSignups) * 100}%`, minHeight: 4 }}
                />
              )}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                {t.date}: {t.signups} signup{t.signups === 1 ? "" : "s"}, {t.newSubs} sub
                {t.newSubs === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary/25" /> Signups</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> New subscriptions</span>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="font-display text-2xl font-semibold tabular">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{sub}</div>}
    </div>
  );
}
