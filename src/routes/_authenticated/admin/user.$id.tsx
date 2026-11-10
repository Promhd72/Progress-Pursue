import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUserDetail } from "@/lib/admin.functions";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/user/$id")({
  head: () => ({ meta: [{ title: "User detail — Rapid Math admin" }] }),
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getUserDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => fn({ data: { userId: id } }),
  });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading user…</div>;
  const p: any = data.profile;

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">{p?.name || "—"}</h2>
            <p className="text-sm text-muted-foreground">{p?.email}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              p?.is_pro ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {p?.is_pro ? `Pro${p?.pro_source ? ` · ${p.pro_source}` : ""}` : "Free"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat label="XP" value={String(p?.xp ?? 0)} />
          <Stat label="Current streak" value={`${p?.current_streak ?? 0}d`} />
          <Stat label="Longest streak" value={`${p?.longest_streak ?? 0}d`} />
          <Stat label="Last active" value={p?.last_active_date ?? "—"} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Lessons completed" value={String(data.stats.lessonsCompleted)} />
        <Stat label="Lessons passed" value={String(data.stats.lessonsPassed)} />
        <Stat label="Accuracy" value={`${data.stats.accuracy}%`} />
        <Stat
          label="Avg time / question"
          value={data.stats.avgMsPerQuestion ? `${(data.stats.avgMsPerQuestion / 1000).toFixed(1)}s` : "—"}
        />
      </div>

      <Panel title="Track progress">
        {data.progress.length === 0 ? (
          <Empty>No tracks started.</Empty>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.progress.map((t: any) => (
              <div key={t.track} className="rounded-lg border border-border px-4 py-3">
                <div className="text-sm font-medium capitalize">{t.track}</div>
                <div className="text-xs text-muted-foreground">
                  Level {t.current_level} · {t.lessons_passed ?? 0} lessons passed
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Recent lessons">
        {data.lessons.length === 0 ? (
          <Empty>No lessons yet.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Track</th>
                <th className="py-2">Level</th>
                <th className="py-2">Score</th>
                <th className="py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {data.lessons.slice(0, 20).map((l: any) => (
                <tr key={l.id} className="border-t border-border/60">
                  <td className="py-2 text-muted-foreground">{String(l.created_at).slice(0, 10)}</td>
                  <td className="py-2 capitalize">{l.track}</td>
                  <td className="py-2 tabular">{l.level}</td>
                  <td className="py-2 tabular">{l.correct}/{l.total}</td>
                  <td className="py-2">
                    <span className={l.passed ? "text-primary" : "text-muted-foreground"}>
                      {l.passed ? "Passed" : "Retry"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Subscriptions">
        {data.subscriptions.length === 0 ? (
          <Empty>No subscriptions.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.subscriptions.map((s: any) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border px-4 py-3">
                <span className="font-medium">{s.price_id}</span>
                <span className="text-muted-foreground">
                  {s.status} · {s.environment} · renews {s.current_period_end ? String(s.current_period_end).slice(0, 10) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="font-display text-xl font-semibold tabular">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
