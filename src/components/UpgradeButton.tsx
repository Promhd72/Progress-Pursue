import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { toast } from "sonner";
import { ArrowRight, Crown } from "lucide-react";
import { getCheckoutInfo } from "@/lib/billing.functions";
import { isNativeApp, useIsNativeApp } from "@/lib/native";

let paddlePromise: Promise<Paddle | undefined> | null = null;

function loadPaddle(environment: "sandbox" | "production") {
  if (!paddlePromise) {
    const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
    paddlePromise = initializePaddle({ environment, token: token ?? "" });
  }
  return paddlePromise;
}

export function isTestPayments() {
  const token = (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined) ?? "";
  return token.startsWith("test_");
}

export function PaymentTestModeBanner() {
  const native = useIsNativeApp();
  if (native || !isTestPayments()) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-1.5 text-center text-xs text-amber-700 dark:text-amber-300">
      Test mode — payments use test cards, no real money is charged.
    </div>
  );
}

export function UpgradeButton({
  label = "Upgrade to Pro",
  className,
  variant = "primary",
}: {
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
}) {
  const native = useIsNativeApp();
  const infoFn = useServerFn(getCheckoutInfo);
  const { data } = useQuery({
    queryKey: ["checkout-info"],
    queryFn: () => infoFn(),
    enabled: !native && !isNativeApp(),
  });
  const [busy, setBusy] = useState(false);

  async function openCheckout() {
    if (!data?.priceId) {
      toast.error("Checkout isn't available right now. Please try again shortly.");
      return;
    }
    setBusy(true);
    try {
      const paddle = await loadPaddle(data.environment);
      if (!paddle) throw new Error("Checkout failed to load");
      paddle.Checkout.open({
        items: [{ priceId: data.priceId, quantity: 1 }],
        customer: data.email ? { email: data.email } : undefined,
        customData: { user_id: data.userId },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/dashboard?upgraded=1`,
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open checkout");
    } finally {
      setBusy(false);
    }
  }

  // App Store guideline 3.1.1: no external checkout inside the iOS app.
  if (native || data?.isPro) return null;

  const base =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-input bg-background text-foreground hover:bg-accent";

  return (
    <button
      onClick={openCheckout}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50 ${base} ${className ?? ""}`}
    >
      <Crown className="h-4 w-4" />
      {busy ? "Opening…" : label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
