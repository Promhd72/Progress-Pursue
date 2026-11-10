import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { getAdminStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const status = await getAdminStatus();
    if (!status.isAdmin) throw redirect({ to: "/dashboard" });
    return { adminStatus: status };
  },
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/coupons", label: "Coupons" },
] as const;

function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Site performance, users and coupons.</p>
        </div>
        <nav className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: Boolean((t as { exact?: boolean }).exact) }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
