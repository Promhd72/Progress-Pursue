import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verify(signatureHeader: string | null, rawBody: string, secret: string) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim() ?? "", v?.trim() ?? ""];
    }),
  ) as { ts?: string; h1?: string };
  if (!parts.ts || !parts.h1) return false;
  const expected = createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(parts.h1);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = url.searchParams.get("env") === "live" ? "live" : "sandbox";
        const secret =
          env === "live"
            ? process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"]
            : process.env["PAYMENTS_SANDBOX_WEBHOOK_SECRET"];
        const rawBody = await request.text();

        if (!secret || !verify(request.headers.get("paddle-signature"), rawBody, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(rawBody) as {
          event_type?: string;
          data?: Record<string, any>;
        };
        const type = event.event_type ?? "";
        const d = event.data ?? {};

        if (!type.startsWith("subscription.")) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Resolve the app user: custom_data first, then customer email.
        let userId: string | null = (d["custom_data"]?.user_id as string | undefined) ?? null;
        if (!userId && d["customer_id"]) {
          const apiKey =
            env === "live"
              ? process.env["PADDLE_LIVE_API_KEY"]
              : process.env["PADDLE_SANDBOX_API_KEY"];
          const base = env === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
          if (apiKey) {
            const res = await fetch(`${base}/customers/${d["customer_id"]}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (res.ok) {
              const cust = (await res.json()) as { data?: { email?: string } };
              const email = cust.data?.email;
              if (email) {
                const { data: profile } = await supabaseAdmin
                  .from("profiles")
                  .select("id")
                  .ilike("email", email)
                  .maybeSingle();
                userId = (profile?.id as string | undefined) ?? null;
              }
            }
          }
        }
        if (!userId) return new Response("ok");

        const item = (d["items"] as any[] | undefined)?.[0];
        const price = item?.price ?? {};
        const status = (d["status"] as string | undefined) ?? "active";
        const amountCents = Number(price?.unit_price?.amount ?? 1000) || 1000;

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            paddle_subscription_id: String(d["id"]),
            paddle_customer_id: String(d["customer_id"] ?? ""),
            product_id: String(price?.product_id ?? item?.product?.id ?? ""),
            price_id: String(price?.id ?? ""),
            status,
            amount_cents: amountCents,
            currency: String(price?.unit_price?.currency_code ?? "USD"),
            current_period_start: d["current_billing_period"]?.starts_at ?? null,
            current_period_end: d["current_billing_period"]?.ends_at ?? null,
            cancel_at_period_end: Boolean(d["scheduled_change"]?.action === "cancel"),
            environment: env,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "paddle_subscription_id" },
        );

        const periodEnd = d["current_billing_period"]?.ends_at as string | undefined;
        const stillEntitled =
          ACTIVE.has(status) ||
          (status === "canceled" && periodEnd ? new Date(periodEnd) > new Date() : false);

        if (stillEntitled) {
          await supabaseAdmin
            .from("profiles")
            .update({ is_pro: true, pro_source: "paid" })
            .eq("id", userId);
        } else {
          // Only drop Pro if it came from a payment (coupon-granted Pro stays).
          await supabaseAdmin
            .from("profiles")
            .update({ is_pro: false, pro_source: null })
            .eq("id", userId)
            .eq("pro_source", "paid");
        }

        return new Response("ok");
      },
    },
  },
});
