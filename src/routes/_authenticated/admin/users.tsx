import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listUsers } from "@/lib/admin.functions";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin users — Rapid Math" }] }),
  component: AdminUsers,
});

type SortKey = "created_at" | "xp" | "current_streak" | "last_active_date";

function AdminUsers() {
  const fn = useServerFn(listUsers);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("created_at");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => fn({ data: { search, limit: 200 } }),
  });

  const rows = [...(data ?? [])].sort((a: any, b: any) => {
    const av = a[sort] ?? "";
    const bv = b[sort] ?? "";
    if (typeof av === "number" && typeof bv === "number") return bv - av;
    return String(bv).localeCompare(String(av));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="created_at">Newest</option>
          <option value="xp">Most XP</option>
          <option value="current_streak">Longest current streak</option>
          <option value="last_active_date">Recently active</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">No users found.</td></tr>
            )}
            {rows.map((u: any) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className="px-4 py-3">
                  <Link to="/admin/user/$id" params={{ id: u.id }} className="font-medium text-primary hover:underline">
                    {u.name || "—"}
                  </Link>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  {u.is_pro ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Pro{u.pro_source ? ` · ${u.pro_source}` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular">{u.xp}</td>
                <td className="px-4 py-3 tabular">{u.current_streak}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.last_active_date ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{String(u.created_at).slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
