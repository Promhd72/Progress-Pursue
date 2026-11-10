import { serverFn, rpc } from "./api";
import { z } from "zod";

export const redeemCoupon = serverFn()
  .inputValidator((d: unknown) => z.object({ code: z.string().trim().min(1).max(64) }).parse(d))
  .handler(async ({ data }) =>
    rpc<{ ok: boolean; message: string }>("redeem_coupon", { p_code: data.code }),
  );

export const getProfile = serverFn()
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Profile not found. Please sign out and back in.");
    return data;
  });

export const getRecentSessions = serverFn()
  .inputValidator((d: { limit?: number } | undefined) => ({ limit: Math.min(d?.limit ?? 5, 100) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("drill_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getAllSessions = serverFn()
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("drill_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Permanently deletes the signed-in user's account and all their data.
 * Required by App Store guideline 5.1.1(v) for any app that lets people sign up.
 */
export const deleteAccount = serverFn().handler(async () => {
  await rpc<null>("delete_account");
  return { ok: true as const, message: "Your account has been deleted." };
});

export type FeedbackKind = "feature" | "problem" | "idea" | "other";

/** Sends feedback or a feature request to the team (stored in the feedback table). */
export const submitFeedback = serverFn()
  .inputValidator((d: unknown) =>
    z
      .object({
        kind: z.enum(["feature", "problem", "idea", "other"]),
        message: z.string().trim().min(1).max(2000),
        appVersion: z.string().max(20),
        platform: z.string().max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await rpc<null>("submit_feedback", {
      p_kind: data.kind,
      p_message: data.message,
      p_app_version: data.appVersion,
      p_platform: data.platform,
    });
    return { ok: true as const };
  });
