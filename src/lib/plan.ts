export type PreviewPlan = "off" | "free" | "pro";

export type PlanFields = {
  is_pro?: boolean | null;
  preview_plan?: string | null;
};

/**
 * Effective plan = admin preview override (when set) ?? real is_pro flag.
 * Only admins can set preview_plan (enforced in admin.functions.ts).
 */
export function resolveIsPro(profile: PlanFields | null | undefined): boolean {
  const preview = profile?.preview_plan;
  if (preview === "free") return false;
  if (preview === "pro") return true;
  return Boolean(profile?.is_pro);
}

export const PLAN_SELECT = "is_pro, preview_plan";
