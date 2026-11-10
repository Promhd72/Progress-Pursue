import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/api";
import { getRecentLessons } from "@/lib/curriculum.functions";
import { TRACK_LABELS, type SkillTrack } from "@/lib/curriculum";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Rapid Math" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const fn = useServerFn(getRecentLessons);
  const { data, isLoading, error } = useQuery({
    queryKey: ["lessons", "all"],
    queryFn: () => fn({ data: { limit: 200 } }),
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">History</h1>
      <p className="text-muted-foreground">All your lesson attempts, newest first.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">Failed to load.</div>
        ) : !data || data.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No lessons yet.{" "}
            <Link to="/dashboard" className="text-primary hover:underline">
              Start your first lesson →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Result</th>
                <th className="px-4 py-3 text-right">Avg time</th>
                <th className="px-4 py-3 text-right">XP</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => {
                const acc = Math.round((s.correct / s.total) * 100);
                const avg = (s.duration_ms / s.total / 1000).toFixed(1);
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{TRACK_LABELS[s.track as SkillTrack] ?? s.track}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular">L{s.level}</td>
                    <td className="px-4 py-3 text-right tabular">
                      {s.correct}/{s.total} <span className="text-muted-foreground">({acc}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.passed ? (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Try again
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-muted-foreground">{avg}s</td>
                    <td className="px-4 py-3 text-right tabular font-medium text-primary">+{s.xp_earned}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
