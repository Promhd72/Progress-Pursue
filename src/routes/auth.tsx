import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PrimaryButton } from "@/components/native/PrimaryButton";
import { keyHaptic } from "@/lib/native";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

type Mode = "signin" | "signup" | "code" | "verify" | "confirm-email";

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function run(fn: () => Promise<void>) {
    keyHaptic();
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const signUp = () =>
    run(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() || email.split("@")[0] } },
      });
      if (error) throw error;
      if (!data.session) {
        // Email confirmation is switched on in Supabase.
        setMode("confirm-email");
        return;
      }
      navigate({ to: "/onboarding", replace: true });
    });

  const signIn = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    });

  const sendCode = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setMode("verify");
      toast.success("Code sent. Check your email.");
    });

  const verifyCode = () =>
    run(async () => {
      const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    });

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to continue your streak."],
    signup: ["Create your account", "Free, and it saves your streak and progress."],
    code: ["Sign in with a code", "We'll email you a 6-digit code. No password needed."],
    verify: ["Enter your code", `Sent to ${email}.`],
    "confirm-email": [
      "Check your email",
      `We sent a confirmation link to ${email}. Open it, then sign in here.`,
    ],
  };
  const [title, subtitle] = titles[mode];

  return (
    <div className="pt-safe flex min-h-[100dvh] flex-col bg-background">
      <div className="flex h-14 items-center px-3">
        <Link
          to="/welcome"
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground active:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <main className="flex flex-1 flex-col px-6">
        {mode === "confirm-email" && (
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </span>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "signup") void signUp();
            else if (mode === "signin") void signIn();
            else if (mode === "code") void sendCode();
            else if (mode === "verify") void verifyCode();
            else setMode("signin");
          }}
        >
          {mode === "signup" && (
            <label className="block text-sm font-medium">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}
          {(mode === "signin" || mode === "signup" || mode === "code") && (
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@work.com"
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
              />
            </label>
          )}
          {(mode === "signin" || mode === "signup") && (
            <label className="block text-sm font-medium">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </label>
          )}
          {mode === "verify" && (
            <label className="block text-sm font-medium">
              6-digit code
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${inputClass} text-center font-display text-2xl tracking-[0.4em]`}
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
          )}

          <div className="pt-2">
            <PrimaryButton disabled={loading} onClick={() => {}} type="submit">
              {loading
                ? "Working…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "signin"
                    ? "Sign in"
                    : mode === "code"
                      ? "Email me a code"
                      : mode === "verify"
                        ? "Sign in"
                        : "Back to sign in"}
            </PrimaryButton>
          </div>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          {mode === "signin" && (
            <button onClick={() => setMode("code")} className="font-medium text-primary">
              Forgot password? Sign in with an email code
            </button>
          )}
          {(mode === "code" || mode === "verify") && (
            <button onClick={() => setMode("signin")} className="font-medium text-primary">
              Use my password instead
            </button>
          )}
          {(mode === "signin" || mode === "signup") && (
            <p className="text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "New to Rapid Math?"}{" "}
              <button
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="font-medium text-primary"
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
