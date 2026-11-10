export type PlanFields = { is_pro?: boolean | null };

/** Whether the user has Pro (granted by a coupon today; In-App Purchase later). */
export function resolveIsPro(profile: PlanFields | null | undefined): boolean {
  return Boolean(profile?.is_pro);
}

export const PLAN_SELECT = "is_pro";
