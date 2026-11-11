// Rapid Math: keeps profiles.is_pro in sync with the App Store subscription.
//
// Two callers, one rule ("ask RevenueCat, then write"):
//   1. RevenueCat webhook: Authorization header is "Bearer <REVENUECAT_WEBHOOK_AUTH>".
//   2. The app, right after a purchase or restore: Authorization is the user's
//      Supabase session token, so a user can only sync themselves.
// Neither caller's claim is trusted: the function asks RevenueCat's API whether
// the "pro" entitlement is active, then calls set_store_pro() as the service role.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   REVENUECAT_SECRET_KEY    RevenueCat > Project settings > API keys > Secret API key
//   REVENUECAT_WEBHOOK_AUTH  any long random string; paste the same value into the
//                            RevenueCat webhook's "Authorization header value" as "Bearer <value>"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// Deploy with JWT verification OFF (the webhook doesn't send a Supabase token).

import { createClient } from "npm:@supabase/supabase-js@2";

const ENTITLEMENT = "pro";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Asks RevenueCat for the user's real subscription state and writes it. */
async function sync(userId: string): Promise<boolean> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("REVENUECAT_SECRET_KEY")}` },
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const body = await res.json();
  const ent = body?.subscriber?.entitlements?.[ENTITLEMENT];
  const expires: string | null = ent?.expires_date ?? null;
  const active = !!ent && (expires === null || new Date(expires).getTime() > Date.now());
  const { error } = await admin.rpc("set_store_pro", { p_user: userId, p_active: active, p_expires: expires });
  if (error) throw new Error(error.message);
  return active;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const webhookAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");

  try {
    // 1. Webhook from RevenueCat.
    if (webhookAuth && auth === `Bearer ${webhookAuth}`) {
      const event = (await req.json())?.event ?? {};
      const ids = new Set<string>(
        [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? []), ...(event.transferred_to ?? []), ...(event.transferred_from ?? [])]
          .filter((id: unknown): id is string => typeof id === "string" && UUID.test(id)),
      );
      for (const id of ids) await sync(id);
      return json({ ok: true, synced: ids.size });
    }

    // 2. The signed-in app user.
    const token = auth.replace(/^Bearer\s+/i, "");
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return json({ error: "Not signed in" }, 401);
    const isPro = await sync(data.user.id);
    return json({ isPro });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Sync failed" }, 500);
  }
});
