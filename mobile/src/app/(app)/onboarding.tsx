import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTour } from "@/components/AppTour";
import { Button, Card, ChoiceCard, IconBadge, KeyValue, Muted, Txt } from "@/components/ui";
import { updateProfile } from "@/lib/account";
import { getReminderPrefs, updateReminderPrefs } from "@/lib/native";
import { dailyTargetFor, focusTrackFor, getOnboarding, saveOnboarding } from "@/lib/onboarding";
import { useOverview, useProfile } from "@/lib/queries";
import { colors } from "@/theme";

const TIMES = [
  { label: "Morning", sub: "8:00", hour: 8, emoji: "☀️" },
  { label: "Lunch break", sub: "13:00", hour: 13, emoji: "🥗" },
  { label: "Evening", sub: "20:00", hour: 20, emoji: "🌙" },
];

/** After sign-up: reminder time + notification permission, then the placement test. */
export default function Onboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: overview } = useOverview();
  const [step, setStep] = useState<"tour" | "reminder" | "level">("tour");
  const [time, setTime] = useState(() => {
    const i = TIMES.findIndex((t) => t.hour === getReminderPrefs().hour);
    return i >= 0 ? i : 2;
  });
  const [busy, setBusy] = useState(false);

  const prefs = getOnboarding();
  const target = dailyTargetFor(prefs.dailyTarget);

  async function chooseReminder(enabled: boolean) {
    setBusy(true);
    await updateReminderPrefs({ enabled, hour: TIMES[time].hour, minute: 0 }, false);
    setBusy(false);
    setStep("level");
  }

  async function finish(to: "/placement" | "/train") {
    setBusy(true);
    saveOnboarding({ completed: true });
    if (profile?.id) {
      await updateProfile(profile.id, { onboarding_completed: true }).catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
    router.replace(to);
  }

  if (step === "tour") {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <AppTour onDone={() => setStep("reminder")} doneLabel="Set up my plan" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {step === "reminder" ? (
          <>
            <IconBadge name="notifications-outline" color={colors.warm} bg={colors.warmSoft} size={56} />
            <Txt variant="title" style={{ marginTop: 20 }}>
              When should we nudge you?
            </Txt>
            <Muted style={{ marginTop: 8 }}>
              A daily nudge makes it much easier to keep your streak. We'll skip it on days you've already
              trained.
            </Muted>
            <View style={{ marginTop: 24, gap: 12 }}>
              {TIMES.map((t, i) => (
                <ChoiceCard
                  key={t.label}
                  selected={time === i}
                  onPress={() => setTime(i)}
                  emoji={t.emoji}
                  title={t.label}
                  right={t.sub}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <IconBadge name="speedometer-outline" size={56} />
            <Txt variant="title" style={{ marginTop: 20 }}>
              {overview?.hasPlacement ? "You're all set" : "Let's find your level"}
            </Txt>
            <Muted style={{ marginTop: 8 }}>
              {overview?.hasPlacement
                ? "Your starting levels are already saved. Jump into your first lesson."
                : "A quick 2-minute test across all five tracks, so lessons start at the right difficulty. No pressure: skipping a question is fine."}
            </Muted>
            <Card style={{ marginTop: 24, gap: 14 }}>
              <KeyValue label="Focus" value={focusTrackFor(prefs.goal)} />
              <KeyValue
                label="Daily goal"
                value={`${target.minutes} min · ${target.lessons} lesson${target.lessons === 1 ? "" : "s"}`}
              />
            </Card>
          </>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {step === "reminder" ? (
          <>
            <Button title="Turn on reminders" loading={busy} onPress={() => chooseReminder(true)} />
            <Button title="Not now" variant="ghost" disabled={busy} onPress={() => chooseReminder(false)} />
          </>
        ) : overview?.hasPlacement ? (
          <Button title="Start training" loading={busy} onPress={() => finish("/train")} />
        ) : (
          <>
            <Button title="Start the placement test" loading={busy} onPress={() => finish("/placement")} />
            <Button title="Skip, start at Level 1" variant="ghost" disabled={busy} onPress={() => finish("/train")} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  actions: { paddingHorizontal: 24, paddingBottom: 8, gap: 4 },
});
