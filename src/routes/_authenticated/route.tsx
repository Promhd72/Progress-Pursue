import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/api";
import {
  History,
  User,
  BarChart3,
  X,
  WifiOff,
  GraduationCap,
} from "lucide-react";
import { getProfile } from "@/lib/rapid-math.functions";
import {
  keyHaptic,
  scheduleStreakReminders,
  trainedTodayFrom,
  useOnline,
} from "@/lib/native";
import { getOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Local session check: works offline and doesn't hit the network on every screen.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/welcome" });
    return { user: data.session.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return <AppLayout />;
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
