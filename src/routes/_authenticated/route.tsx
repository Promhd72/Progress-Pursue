import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, History, User, LogOut, Shield } from "lucide-react";
import { getAdminStatus, setPreviewPlan } from "@/lib/admin.functions";
import { PaymentTestModeBanner } from "@/components/UpgradeButton";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminFn = useServerFn(getAdminStatus);
  const previewFn = useServerFn(setPreviewPlan);
  const { data: admin } = useQuery({ queryKey: ["admin", "status"], queryFn: () => adminFn() });
  const setPreview = useMutation({
    mutationFn: (plan: "off" | "free" | "pro") => previewFn({ data: { plan } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">R</div>
            <span className="font-display text-lg font-semibold">Rapid Math</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" icon={LayoutDashboard} label="Curriculum" />
            <NavLink to="/history" icon={History} label="History" />
            <NavLink to="/profile" icon={User} label="Profile" />
            {admin?.isAdmin && <NavLink to="/admin" icon={Shield} label="Admin" />}
            <button
              onClick={signOut}
              className="ml-2 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      {admin?.isAdmin && (
        <div className="border-b border-border bg-accent/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Preview as</span>
            <div className="flex gap-1 rounded-md border border-border bg-card p-0.5">
              {(["off", "free", "pro"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreview.mutate(p)}
                  disabled={setPreview.isPending}
                  className={`rounded px-2.5 py-1 font-medium capitalize ${
                    (admin.previewPlan ?? "off") === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "off" ? "My account" : p}
                </button>
              ))}
            </div>
            <span className="text-muted-foreground">
              Real plan: {admin.realIsPro ? "Pro" : "Free"}
              {admin.previewPlan !== "off" ? ` · viewing as ${admin.previewPlan}` : ""}
            </span>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-accent text-foreground" }}
      inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-accent" }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
