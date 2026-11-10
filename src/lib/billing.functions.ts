import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveIsPro } from "@/lib/plan";


const PRO_PRICE_EXTERNAL_ID = "pro_monthly";

let cached: { priceId: string; at: number } | null = null;

/**
 * Returns everything the browser needs to open the Paddle overlay checkout:
 * the environment-specific price id for the Pro plan plus the buyer's email.
 */
export const getCheckoutInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientToken =
      (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined) ??
      process.env["VITE_PAYMENTS_CLIENT_TOKEN"] ??
      "";
    const isSandbox = !clientToken.startsWith("live_");
    const connectionKey = isSandbox
      ? process.env["PADDLE_SANDBOX_API_KEY"]
      : process.env["PADDLE_LIVE_API_KEY"];

    let priceId: string | null =
      cached && Date.now() - cached.at < 10 * 60_000 ? cached.priceId : null;

    if (!priceId && connectionKey && process.env["LOVABLE_API_KEY"]) {
      const res = await fetch(
        "https://connector-gateway.lovable.dev/paddle/prices?per_page=100",
        {
          headers: {
            Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
            "X-Connection-Api-Key": connectionKey,
          },
        },
      );
      if (res.ok) {
        const json = (await res.json()) as {
          data?: {
            id: string;
            status?: string;
            import_meta?: { external_id?: string } | null;
          }[];
        };
        const active = (json.data ?? []).filter((p) => p.status !== "archived");
        const match =
          active.find((p) => p.import_meta?.external_id === PRO_PRICE_EXTERNAL_ID) ??
          active[0];
        priceId = match?.id ?? null;
        if (priceId) cached = { priceId, at: Date.now() };
      }
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email, is_pro, preview_plan")
      .eq("id", context.userId)
      .maybeSingle();

    return {
      priceId,
      environment: isSandbox ? ("sandbox" as const) : ("production" as const),
      email: (profile?.email as string | undefined) ?? "",
      userId: context.userId,
      isPro: resolveIsPro(profile as { is_pro?: boolean; preview_plan?: string } | null),
    };

  });
