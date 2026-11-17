import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorState, Gradient, Ionicons, Loading, Muted, Row, Txt, type IconName } from "@/components/ui";
import { FREE_MAX_LEVEL, MAX_LEVEL } from "@/lib/curriculum";
import { finishHaptic, keyHaptic } from "@/lib/native";
import { DEMO_MODE } from "@/lib/backend";
import { buy, getPlans, restore, type Plan, type PlanId } from "@/lib/purchases";
import { useProfile } from "@/lib/queries";
import { colors, elevation, fonts, gradients, radius } from "@/theme";
import { alertT, auto, mark, tr } from "@/lib/i18n";

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: "rocket", title: `Levels ${FREE_MAX_LEVEL + 1} to ${MAX_LEVEL} on every skill`, text: "Work-ready and expert levels: bigger numbers, real meeting maths." },
  { icon: "infinite", title: "Unlimited lessons", text: "Train as much as you like, no daily cap." },
  { icon: "briefcase", title: "Unlimited scenarios", text: "All 100 real-life problems, any time." },
];

const periodWord = (p: Plan) => (p.period === "year" ? "year" : "month");

/** Rapid Math Pro: plans, purchase and restore. */
export default function ProScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const plansQ = useQuery({ queryKey: ["pro-plans"], queryFn: getPlans, staleTime: 5 * 60_000 });
  const [selected, setSelected] = useState<PlanId>("annual");
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const compact = useWindowDimensions().height < 720;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/train"));

  if (profile?.is_pro) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.done}>
          <Gradient colors={gradients.ink} orbs={false} style={styles.crown}>
            <Ionicons name="diamond" size={40} color={colors.gold} />
          </Gradient>
          <Txt variant="title" center style={{ marginTop: 20 }}>
            You're Pro
          </Txt>
          <Muted center style={{ marginTop: 8 }}>
            Every level and unlimited practice are unlocked. Thanks for supporting Rapid Math.
          </Muted>
          <View style={{ alignSelf: "stretch", marginTop: 28 }}>
            <Button title="Start training" icon="arrow-forward" onPress={() => router.replace("/train")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (plansQ.isLoading) return <Loading />;
  if (plansQ.error || !plansQ.data) {
    return <ErrorState message={(plansQ.error as Error)?.message ?? "Couldn't load plans."} onRetry={() => plansQ.refetch()} />;
  }

  const plans = plansQ.data;
  const plan = plans.find((p) => p.id === selected) ?? plans[0];
  const monthly = plans.find((p) => p.id === "monthly");

  async function purchase() {
    setBusy("buy");
    try {
      const res = await buy(plan);
      if (res === "purchased") {
        await qc.invalidateQueries();
        finishHaptic();
      }
    } catch (e) {
      alertT("Purchase didn't go through", (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function restorePurchases() {
    setBusy("restore");
    try {
      const active = await restore();
      await qc.invalidateQueries();
      alertT(active ? "Pro restored" : "Nothing to restore", active ? "Welcome back. Everything is unlocked." : "We couldn't find an active Rapid Math Pro subscription for this Apple ID.");
    } catch (e) {
      alertT("Couldn't restore", (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false} bounces={false}>
        <Gradient colors={gradients.ink} style={styles.hero}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.bar}>
              <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close" style={styles.round}>
                <Ionicons name="close" size={22} color={colors.white} />
              </Pressable>
              <Pressable onPress={restorePurchases} hitSlop={10} disabled={!!busy} accessibilityRole="button">
                <Txt variant="label" color="rgba(255,255,255,0.9)" style={{ fontSize: 15 }}>
                  {busy === "restore" ? "Restoring…" : "Restore purchases"}
                </Txt>
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: 24, paddingTop: compact ? 0 : 6, paddingBottom: compact ? 18 : 26 }}>
              {!compact && (
                <View style={styles.gem}>
                  <Ionicons name="diamond" size={26} color={colors.gold} />
                </View>
              )}
              <Txt variant="title" color={colors.white} style={{ marginTop: compact ? 4 : 14, fontSize: compact ? 26 : 30, lineHeight: compact ? 31 : 35 }}>
                Rapid Math Pro
              </Txt>
              <Txt color="rgba(255,255,255,0.92)" style={{ marginTop: 6 }}>
                Go from quick to confident. Unlock every level and train without limits.
              </Txt>
            </View>
          </SafeAreaView>
        </Gradient>

        <View style={[styles.benefits, compact && { marginTop: 14, gap: 10 }]}>
          {BENEFITS.map((b) => (
            <Row key={b.title} gap={12} style={{ alignItems: "flex-start" }}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="label">{b.title}</Txt>
                <Muted variant="caption" style={{ fontSize: 14 }}>
                  {b.text}
                </Muted>
              </View>
            </Row>
          ))}
        </View>

        <View style={{ marginTop: 18, gap: 10, paddingHorizontal: 20 }} accessibilityRole="radiogroup">
          {plans.map((p) => {
            const on = p.id === plan.id;
            const saving =
              p.id === "annual" && monthly && p.pkg && monthly.pkg
                ? Math.round((1 - p.pkg.product.price / (monthly.pkg.product.price * 12)) * 100)
                : p.id === "annual"
                  ? 50
                  : null;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${auto(p.title)}. ${p.price} ${p.period === "year" ? tr("per year") : tr("per month")}`}
                onPress={() => {
                  keyHaptic();
                  setSelected(p.id);
                }}
                style={[styles.plan, on && styles.planOn]}
              >
                <View style={[styles.radio, on && styles.radioOn]}>{on && <Ionicons name="checkmark" size={14} color={colors.white} />}</View>
                <View style={{ flex: 1 }}>
                  <Row gap={8}>
                    <Txt variant="label" style={{ fontSize: 16 }}>{p.title}</Txt>
                    {saving && saving > 0 ? (
                      <View style={styles.save}>
                        <Txt style={{ fontFamily: fonts.bold, fontSize: 11 }} color={colors.ink}>
                          SAVE {saving}%
                        </Txt>
                      </View>
                    ) : null}
                  </Row>
                  <Muted variant="caption" style={{ fontSize: 13, marginTop: 2 }}>
                    {p.period === "year" ? tr("Billed yearly. Cancel anytime.") : tr("Billed monthly. Cancel anytime.")}
                  </Muted>
                </View>
                {/* The amount actually billed is the most prominent price. */}
                <View style={{ alignItems: "flex-end" }}>
                  <Txt style={{ fontFamily: fonts.displayBold, fontSize: 19 }}>{p.price}</Txt>
                  <Muted variant="caption" style={{ fontSize: 12 }}>
                    {mark(
                      (p.period === "year" ? tr("per year") : tr("per month")) +
                        (p.perMonth ? ` · ${tr("{price}/mo", { price: p.perMonth })}` : ""),
                    )}
                  </Muted>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actions}>
        <Button
          title={tr("Subscribe for {price}/{period}", { price: plan.price, period: tr(periodWord(plan)) })}
          loading={busy === "buy"}
          disabled={!!busy}
          onPress={purchase}
        />
        <Muted variant="caption" center style={{ fontSize: 12, lineHeight: 17, marginTop: 8 }}>
          {mark(
            tr(
              "{price} per {period}. Renews automatically until you cancel. Cancel anytime in Settings at least 24 hours before the renewal date and you won't be charged.",
              { price: plan.price, period: tr(periodWord(plan)) },
            ) + (DEMO_MODE ? ` ${tr("(Demo: no real payment is taken.)")}` : ""),
          )}
        </Muted>
        <Row gap={18} style={{ justifyContent: "center", marginTop: 8 }}>
          <Pressable onPress={() => router.push("/legal/terms")} hitSlop={8} accessibilityRole="link">
            <Muted variant="caption" style={styles.link}>
              Terms of Use
            </Muted>
          </Pressable>
          <Pressable onPress={() => router.push("/legal/privacy")} hitSlop={8} accessibilityRole="link">
            <Muted variant="caption" style={styles.link}>
              Privacy Policy
            </Muted>
          </Pressable>
        </Row>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  round: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  gem: { width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  benefits: { marginTop: 20, gap: 14, paddingHorizontal: 22 },
  benefitIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  done: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  crown: { width: 84, height: 84, borderRadius: 26, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  planOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft, ...elevation },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  save: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  actions: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 10, backgroundColor: colors.background },
  link: { textDecorationLine: "underline" },
});
