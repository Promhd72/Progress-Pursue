import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTour } from "@/components/AppTour";
import { ConfidencePicker } from "@/components/Confidence";
import { Button, Card, ChoiceCard, IconBadge, KeyValue, Muted, Txt } from "@/components/ui";
import { updateProfile } from "@/lib/account";
import { CHECKIN_DAYS, getConfidence, saveConfidence } from "@/lib/confidence";
import { getReminderPrefs, updateReminderPrefs } from "@/lib/native";
import { dailyTargetFor, focusTrackFor, getOnboarding, saveOnboarding } from "@/lib/onboarding";
import { useOverview, useProfile } from "@/lib/queries";
import { colors } from "@/theme";
import { mark, tr } from "@/lib/i18n";

const TIMES = [
  { label: "Morning", sub: "8 AM", hour: 8, icon: "sunny" as const },
  { label: "Lunch break", sub: "1 PM", hour: 13, icon: "restaurant" as const },
  { label: "Evening", sub: "8 PM", hour: 20, icon: "moon" as const },
];

/** After sign-up: reminder time + notification permission, then the placement test. */
export default function Onboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: overview } = useOverview();
  const [step, setStep] = useState<"tour" | "confidence" | "reminder" | "level">("tour");
  const [confidence, setConfidence] = useState<number | null>(() => getConfidence().before?.value ?? null);
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
        <AppTour onDone={() => setStep(getConfidence().before ? "reminder" : "confidence")} doneLabel="Set up my plan" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {step === "confidence" ? (
          <>
            <IconBadge name="pulse-outline" size={56} />
            <Txt variant="title" style={{ marginTop: 20 }}>
              How confident do you feel with numbers?
            </Txt>
            <Muted style={{ marginTop: 8 }}>
              Think of a meeting or a quick conversation where someone throws a number at you. Be honest: we'll
              ask again in {CHECKIN_DAYS} days so you can see how far you've come.
            </Muted>
            <View style={{ marginTop: 24 }}>
              <ConfidencePicker value={confidence} onChange={setConfidence} />
            </View>
          </>
        ) : step === "reminder" ? (
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
                  icon={t.icon}
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
                value={mark(`${target.minutes} min · ${target.lessons === 1 ? tr("1 lesson") : tr("{n} lessons", { n: target.lessons })}`)}
              />
            </Card>
          </>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {step === "confidence" ? (
          <Button
            title="Continue"
            disabled={confidence === null}
            onPress={() => {
              if (confidence !== null) saveConfidence(confidence);
              setStep("reminder");
            }}
          />
        ) : step === "reminder" ? (
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
