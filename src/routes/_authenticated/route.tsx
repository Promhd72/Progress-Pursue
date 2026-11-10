import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  History,
  User,
  LogOut,
  Shield,
  BarChart3,
  X,
  WifiOff,
  GraduationCap,
} from "lucide-react";
import { getAdminStatus, setPreviewPlan } from "@/lib/admin.functions";
import { getProfile } from "@/lib/rapid-math.functions";
import { PaymentTestModeBanner } from "@/components/UpgradeButton";
import {
  isNativeApp,
  keyHaptic,
  scheduleStreakReminders,
  trainedTodayFrom,
  useOnline,
} from "@/lib/native";
import { getOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: isNativeApp() ? "/welcome" : "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  // This route is client-only (ssr: false), so it's safe to read this synchronously
  // and avoid flashing the website header inside the app.
  const [native] = useState(isNativeApp);
  return native ? <AppLayout /> : <WebLayout />;
}

/* ------------------------------------------------------------------ */
/* iOS app: title bar + bottom tab bar                                 */
/* ------------------------------------------------------------------ */

const TABS = [
  { to: "/dashboard", label: "Train", icon: GraduationCap },
  { to: "/advanced", label: "Advanced", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

// Full-screen "focus" routes: no tab bar, just a close button.
const FOCUS_PREFIXES = ["/lesson/", "/placement"];

function AppLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();
  const profileFn = useServerFn(getProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const focus = FOCUS_PREFIXES.some((p) => pathname.startsWith(p));
  const onboarding = pathname.startsWith("/onboarding");

  // New users (or anyone opening the app for the first time) go through onboarding.
  useEffect(() => {
    if (!profile || onboarding || focus) return;
    if (!profile.onboarding_completed && !getOnboarding().completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, onboarding, focus, navigate]);

  // Keep reminders in sync: skip today's once the user has trained.
  const lastActive = profile?.last_active_date as string | null | undefined;
  useEffect(() => {
    if (profile) void scheduleStreakReminders(trainedTodayFrom(lastActive));
  }, [profile, lastActive]);

  const title =
    TABS.find((t) => pathname.startsWith(t.to))?.label ??
    (pathname.startsWith("/placement") ? "Placement" : pathname.startsWith("/lesson") ? "Lesson" : "");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Title bar (extends under the status bar) */}
      <header className="pt-safe sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="relative flex h-11 items-center justify-center px-4">
          {focus && (
            <button
              onClick={() => {
                keyHaptic();
                navigate({ to: "/dashboard" });
              }}
              aria-label="Close"
              className="absolute left-2 grid h-10 w-10 place-items-center rounded-full text-muted-foreground active:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <span className="text-[17px] font-semibold">{onboarding ? "Getting started" : title}</span>
          {profile && !focus && !onboarding && profile.current_streak > 0 && (
            <span className="absolute right-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-500">
              🔥 <span className="tabular">{profile.current_streak}</span>
            </span>
          )}
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-700">
            <WifiOff className="h-3.5 w-3.5" /> You're offline. Progress will sync when you reconnect.
          </div>
        )}
      </header>

      <main
        className={`mx-auto w-full max-w-2xl flex-1 px-4 pt-5 ${
          focus || onboarding ? "pb-safe-4" : "pb-tabbar"
        }`}
      >
        <Outlet />
      </main>

      {!focus && !onboarding && (
        <nav
          className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl"
          aria-label="Tabs"
        >
          <div className="mx-auto grid h-[52px] max-w-2xl grid-cols-4">
            {TABS.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => !active && keyHaptic()}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Website: original header layout                                     */
/* ------------------------------------------------------------------ */

function WebLayout() {
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
