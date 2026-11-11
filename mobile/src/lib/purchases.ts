// Pro subscriptions through the App Store, using RevenueCat.
//
// The app never writes Pro itself. After a purchase or restore it asks the
// `revenuecat` Edge Function to check the subscription with RevenueCat and
// update the profile (see supabase/functions/revenuecat).
//
// Without a RevenueCat key (web preview, demo mode) purchases are simulated so
// the whole flow can be tried without a store.

import { Platform } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "./backend";
import { demoSetPro } from "./demo";

export const ENTITLEMENT = "pro";
export const TRIAL_DAYS = 3;
export const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? "";
export const MANAGE_URL = "https://apps.apple.com/account/subscriptions";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

export type PlanId = "annual" | "monthly";
export interface Plan {
  id: PlanId;
  title: string;
  /** Localised store price, e.g. "$29.99" or "AED 109.99". */
  price: string;
  period: "year" | "month";
  /** For the yearly plan, the monthly equivalent. */
  perMonth: string | null;
  trialDays: number | null;
  pkg?: PurchasesPackage;
}

/** Fallback prices shown when there's no store (web preview, demo). */
const FALLBACK: Plan[] = [
  { id: "annual", title: "Yearly", price: "$29.99", period: "year", perMonth: "$2.50", trialDays: TRIAL_DAYS },
  { id: "monthly", title: "Monthly", price: "$4.99", period: "month", perMonth: null, trialDays: TRIAL_DAYS },
];

/** True when real App Store purchases are possible. */
export const storeEnabled = Platform.OS === "ios" && !!IOS_KEY && !DEMO_MODE;

let configured = false;
let loggedInAs: string | null = null;

async function sdk() {
  return (await import("react-native-purchases")).default;
}

/** Call once a user is signed in, so purchases are tied to their account. */
export async function initPurchases(userId: string | null) {
  if (!storeEnabled || !userId) return;
  const Purchases = await sdk();
  if (!configured) {
    Purchases.configure({ apiKey: IOS_KEY!, appUserID: userId });
    configured = true;
    loggedInAs = userId;
  } else if (loggedInAs !== userId) {
    await Purchases.logIn(userId);
    loggedInAs = userId;
  }
}

export async function signOutPurchases() {
  if (!storeEnabled || !configured || !loggedInAs) return;
  const Purchases = await sdk();
  await Purchases.logOut().catch(() => {});
  loggedInAs = null;
}

function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const n = intro.periodNumberOfUnits;
  switch (intro.periodUnit) {
    case "DAY":
      return n;
    case "WEEK":
      return n * 7;
    default:
      return null;
  }
}

export async function getPlans(): Promise<Plan[]> {
  if (!storeEnabled) return FALLBACK;
  const Purchases = await sdk();
  const offering = (await Purchases.getOfferings()).current;
  const plans: Plan[] = [];
  if (offering?.annual) {
    const p = offering.annual;
    plans.push({
      id: "annual",
      title: "Yearly",
      price: p.product.priceString,
      period: "year",
      perMonth: p.product.pricePerMonthString ?? null,
      trialDays: trialDaysOf(p),
      pkg: p,
    });
  }
  if (offering?.monthly) {
    const p = offering.monthly;
    plans.push({ id: "monthly", title: "Monthly", price: p.product.priceString, period: "month", perMonth: null, trialDays: trialDaysOf(p), pkg: p });
  }
  if (plans.length === 0) throw new Error("Subscriptions aren't available right now. Please try again later.");
  // People who already used a free trial in this subscription group don't get another.
  try {
    const ids = plans.map((p) => p.pkg!.product.identifier);
    const elig = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
    for (const p of plans) {
      if (elig[p.pkg!.product.identifier]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE) p.trialDays = null;
    }
  } catch {
    // Unknown: keep what the store product says. Apple's payment sheet shows the real terms.
  }
  return plans;
}

/** Asks the server to check the subscription with RevenueCat and update Pro. */
export async function syncPro(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ isPro: boolean }>("revenuecat", { body: {} });
  if (error) throw new Error("Your purchase went through, but we couldn't update your account yet. Tap Restore purchases in a minute.");
  return !!data?.isPro;
}

export type BuyResult = "purchased" | "cancelled";

export async function buy(plan: Plan): Promise<BuyResult> {
  if (!storeEnabled) {
    demoSetPro(true);
    return "purchased";
  }
  if (!plan.pkg) throw new Error("This plan isn't available right now.");
  const Purchases = await sdk();
  try {
    await Purchases.purchasePackage(plan.pkg);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return "cancelled";
    throw new Error((e as Error).message || "The purchase didn't go through.");
  }
  await syncPro();
  return "purchased";
}

/** Restores an existing subscription (new phone, reinstall). Returns whether Pro is active. */
export async function restore(): Promise<boolean> {
  if (!storeEnabled) return false;
  const Purchases = await sdk();
  const info = await Purchases.restorePurchases();
  const active = !!info.entitlements.active[ENTITLEMENT];
  await syncPro();
  return active;
}
