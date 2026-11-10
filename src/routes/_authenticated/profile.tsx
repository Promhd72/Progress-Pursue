import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteAccount, getProfile, redeemCoupon } from "@/lib/rapid-math.functions";
import { getCurriculumOverview } from "@/lib/curriculum.functions";
import { supabase } from "@/integrations/supabase/client";
import { levelForXp } from "@/lib/drill-engine";
import { TRACKS, TRACK_LABELS, MAX_LEVEL } from "@/lib/curriculum";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Ticket, Sparkles, ArrowRight } from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { AppOnly, WebOnly, trainedTodayFrom } from "@/lib/native";
import { ReminderSettings } from "@/components/native/ReminderSettings";
import { resolveIsPro } from "@/lib/plan";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Rapid Math" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const fn = useServerFn(getProfile);
  const overviewFn = useServerFn(getCurriculumOverview);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fn() });
  const overviewQ = useQuery({ queryKey: ["curriculum"], queryFn: () => overviewFn() });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.name) setName(data.name);
  }, [data?.name]);

  if (isLoading || !data) return <div className="text-muted-foreground">Loading…</div>;
  const lvl = levelForXp(data.xp);
  const isPro = resolveIsPro(data as { is_pro?: boolean; preview_plan?: string });
  const tracks = overviewQ.data?.tracks ?? [];

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name }).eq("id", data!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Profile</h1>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Plan
          </div>
          {isPro ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Crown className="h-3 w-3" /> Pro
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              Free
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <Mini label="Level" value={`L${lvl.level}`} />
          <Mini label="Total XP" value={data.xp.toLocaleString()} />
          <Mini label="Longest streak" value={`${data.longest_streak}d`} />
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <div className="mt-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
              {data.email}
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={signOut}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Sign out
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <AppOnly>
        <ReminderSettings trainedToday={trainedTodayFrom(data.last_active_date)} />
      </AppOnly>

      {/* Curriculum summary */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Curriculum progress</h2>
          <Link
            to="/placement"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" /> Retake placement
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {TRACKS.map((t) => {
            const row = tracks.find((r) => r.track === t);
            const current = row?.current_level ?? 1;
            const passed = row?.highest_level_passed ?? 0;
            return (
              <div key={t} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{TRACK_LABELS[t]}</span>
                <span className="text-muted-foreground tabular">
                  L{Math.min(current, MAX_LEVEL)} · {passed}/{MAX_LEVEL} passed
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade — only for free users */}
      {!isPro && (
        <WebOnly>
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Go Pro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            $10/month. All 10 levels on every track, unlimited lessons and unlimited
            Advanced scenarios. Cancel anytime.
          </p>
          <UpgradeButton label="Upgrade to Pro — $10/mo" className="mt-4 px-5 py-2.5" />
        </div>
        </WebOnly>
      )}

      {/* Coupon redemption — only for free users */}
      {!isPro && <CouponCard />}

      <DeleteAccountCard />
    </div>
  );
}

function DeleteAccountCard() {
  const deleteFn = useServerFn(deleteAccount);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await deleteFn();
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success(res.message);
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete your account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account, progress, streaks and history. Any active Pro
        subscription is cancelled. This can't be undone.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={deleting}
            className="mt-4 rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              All your Rapid Math data will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CouponCard() {
  const redeemFn = useServerFn(redeemCoupon);
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function onRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await redeemFn({ data: { code } });
      if (res.ok) {
        toast.success(res.message);
        setCode("");
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["curriculum"] });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't redeem code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Ticket className="h-3.5 w-3.5 text-primary" /> Have a coupon?
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Got a Pro coupon? Enter it here to unlock unlimited lessons and the full curriculum.
      </p>
      <form onSubmit={onRedeem} className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm tracking-wide outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter code"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "…" : "Redeem"}
        </button>
      </form>
      <WebOnly>
      <Link
        to="/"
        hash="pricing"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        Or see Pro pricing <ArrowRight className="h-3 w-3" />
      </Link>
      </WebOnly>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="font-display text-2xl font-semibold tabular">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
