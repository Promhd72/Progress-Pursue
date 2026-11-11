import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ErrorState, Ionicons, Loading, Muted, Row, Txt, type IconName } from "@/components/ui";
import { FREE_MAX_LEVEL, MAX_LEVEL } from "@/lib/curriculum";
import { finishHaptic, keyHaptic } from "@/lib/native";
import { PRIVACY_URL, TERMS_URL, buy, getPlans, restore, storeEnabled, type Plan, type PlanId } from "@/lib/purchases";
import { useProfile } from "@/lib/queries";
import { colors, fonts, radius } from "@/theme";

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: "rocket-outline", title: `Levels ${FREE_MAX_LEVEL + 1} to ${MAX_LEVEL} on every skill`, text: "Work-ready and expert levels: bigger numbers, real meeting maths." },
  { icon: "infinite-outline", title: "Unlimited lessons", text: "Train as much as you like, no daily cap." },
  { icon: "briefcase-outline", title: "Unlimited scenarios", text: "All 100 real-life problems, any time." },
];

const periodWord = (p: Plan) => (p.period === "year" ? "year" : "month");

/** Rapid Math Pro: plans, free trial, purchase and restore. */
export default function ProScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const plansQ = useQuery({ queryKey: ["pro-plans"], queryFn: getPlans, staleTime: 5 * 60_000 });
  const [selected, setSelected] = useState<PlanId>("annual");
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/train"));

  if (profile?.is_pro) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.done}>
          <View style={styles.crown}>
            <Ionicons name="diamond" size={40} color={colors.white} />
          </View>
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
  const trial = plan.trialDays;

  async function purchase() {
    setBusy("buy");
    try {
      const res = await buy(plan);
      if (res === "purchased") {
        await qc.invalidateQueries();
        finishHaptic();
      }
    } catch (e) {
      Alert.alert("Purchase didn't go through", (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function restorePurchases() {
    setBusy("restore");
    try {
      const active = await restore();
      await qc.invalidateQueries();
      Alert.alert(active ? "Pro restored" : "Nothing to restore", active ? "Welcome back. Everything is unlocked." : "We couldn't find an active Rapid Math Pro subscription for this Apple ID.");
    } catch (e) {
      Alert.alert("Couldn't restore", (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.bar}>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={28} color={colors.mutedForeground} />
        </Pressable>
        <Pressable onPress={restorePurchases} hitSlop={10} disabled={!!busy}>
          <Txt variant="label" color={colors.primary} style={{ fontSize: 15 }}>
            {busy === "restore" ? "Restoring…" : "Restore"}
          </Txt>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.crown, { width: 60, height: 60, borderRadius: 18 }]}>
          <Ionicons name="diamond" size={28} color={colors.white} />
        </View>
        <Txt variant="title" center style={{ marginTop: 12 }}>
          Rapid Math Pro
        </Txt>
        <Muted center style={{ marginTop: 6 }}>
          Go from quick to confident: unlock every level and train without limits.
        </Muted>

        <View style={{ marginTop: 18, gap: 12 }}>
          {BENEFITS.map((b) => (
            <Row key={b.title} gap={12} style={{ alignItems: "flex-start" }}>
              <Ionicons name={b.icon} size={22} color={colors.primary} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Txt variant="label">{b.title}</Txt>
                <Muted variant="caption" style={{ fontSize: 14 }}>
                  {b.text}
                </Muted>
              </View>
            </Row>
          ))}
        </View>

        <View style={{ marginTop: 20, gap: 10 }}>
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
                onPress={() => {
                  keyHaptic();
                  setSelected(p.id);
                }}
                style={[styles.plan, on && styles.planOn]}
              >
                <View style={[styles.radio, on && styles.radioOn]}>{on && <Ionicons name="checkmark" size={14} color={colors.white} />}</View>
                <View style={{ flex: 1 }}>
                  <Row gap={8}>
                    <Txt variant="label">{p.title}</Txt>
                    {saving ? (
                      <View style={styles.save}>
                        <Txt style={{ fontFamily: fonts.semibold, fontSize: 12 }} color={colors.white}>
                          SAVE {saving}%
                        </Txt>
                      </View>
                    ) : null}
                  </Row>
                  <Muted variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
                    {p.trialDays ? `${p.trialDays}-day free trial, then ` : ""}
                    {p.price}/{periodWord(p)}
                  </Muted>
                </View>
                {p.perMonth ? (
                  <Muted variant="caption" style={{ fontSize: 13 }}>
                    {p.perMonth}/mo
                  </Muted>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title={trial ? `Start my ${trial}-day free trial` : `Subscribe for ${plan.price}/${periodWord(plan)}`}
          loading={busy === "buy"}
          disabled={!!busy}
          onPress={purchase}
        />
        <Muted variant="caption" center style={{ fontSize: 12, lineHeight: 17, marginTop: 8 }}>
          {trial
            ? `Free for ${trial} days, then ${plan.price} per ${periodWord(plan)}. `
            : `${plan.price} per ${periodWord(plan)}. `}
          Renews automatically until you cancel. Cancel anytime in Settings at least 24 hours before{" "}
          {trial ? "the trial ends" : "the renewal date"} and you won't be charged.
          {!storeEnabled ? " (Preview: no real payment is taken.)" : ""}
        </Muted>
        <Row gap={18} style={{ justifyContent: "center", marginTop: 8 }}>
          <Pressable onPress={() => void Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Muted variant="caption" style={styles.link}>
              Terms of Use
            </Muted>
          </Pressable>
          {PRIVACY_URL ? (
            <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Muted variant="caption" style={styles.link}>
                Privacy Policy
              </Muted>
            </Pressable>
          ) : null}
        </Row>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  content: { paddingHorizontal: 24, paddingBottom: 16 },
  done: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  crown: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    backgroundColor: colors.card,
  },
  planOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  save: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  actions: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8 },
  link: { textDecorationLine: "underline" },
});
