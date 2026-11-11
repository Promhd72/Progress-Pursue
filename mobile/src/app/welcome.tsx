import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  ChoiceCard,
  IconBadge,
  Ionicons,
  KeyValue,
  Muted,
  ProgressBar,
  Txt,
  type IconName,
} from "@/components/ui";
import { keyHaptic } from "@/lib/native";
import {
  DAILY_TARGETS,
  GOALS,
  getOnboarding,
  saveOnboarding,
  type DailyTargetId,
  type GoalId,
} from "@/lib/onboarding";
import { colors, fonts } from "@/theme";

type Step = "intro" | "goal" | "target" | "ready";
const ORDER: Step[] = ["intro", "goal", "target", "ready"];

const TARGET_EMOJI: Record<DailyTargetId, string> = { casual: "🌱", regular: "⚡", serious: "🔥" };

export default function Welcome() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [goal, setGoal] = useState<GoalId | null>(() => getOnboarding().goal);
  const [target, setTarget] = useState<DailyTargetId>(() => getOnboarding().dailyTarget);
  const idx = ORDER.indexOf(step);

  const go = (s: Step) => {
    keyHaptic();
    setStep(s);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.top}>
        {idx > 0 ? (
          <Pressable onPress={() => go(ORDER[idx - 1])} hitSlop={12} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
        {idx > 0 && (
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ProgressBar value={idx / (ORDER.length - 1)} />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === "intro" && <Intro />}

        {step === "goal" && (
          <>
            <Txt variant="title">What do you want sharper numbers for?</Txt>
            <Muted style={styles.sub}>We'll shape your plan around it.</Muted>
            <View style={styles.list}>
              {GOALS.map((g) => (
                <ChoiceCard
                  key={g.id}
                  selected={goal === g.id}
                  onPress={() => setGoal(g.id)}
                  emoji={g.emoji}
                  title={g.title}
                  subtitle={g.blurb}
                />
              ))}
            </View>
          </>
        )}

        {step === "target" && (
          <>
            <Txt variant="title">Pick a daily goal</Txt>
            <Muted style={styles.sub}>Short and daily beats long and rare. You can change it anytime.</Muted>
            <View style={styles.list}>
              {DAILY_TARGETS.map((t) => (
                <ChoiceCard
                  key={t.id}
                  selected={target === t.id}
                  onPress={() => setTarget(t.id)}
                  emoji={TARGET_EMOJI[t.id]}
                  title={`${t.minutes} min a day`}
                  subtitle={`${t.label} · ${t.lessons} lesson${t.lessons === 1 ? "" : "s"}`}
                />
              ))}
            </View>
          </>
        )}

        {step === "ready" && <Ready goal={goal} target={target} />}
      </ScrollView>

      <View style={styles.actions}>
        {step === "intro" && (
          <>
            <Button title="Get started" onPress={() => go("goal")} />
            <Link href={{ pathname: "/auth", params: { mode: "signin" } }} asChild>
              <Pressable style={styles.link} hitSlop={8}>
                <Txt variant="label" color={colors.primary}>
                  I already have an account
                </Txt>
              </Pressable>
            </Link>
          </>
        )}
        {step === "goal" && (
          <Button
            title="Continue"
            disabled={!goal}
            onPress={() => {
              saveOnboarding({ goal });
              go("target");
            }}
          />
        )}
        {step === "target" && (
          <Button
            title="Continue"
            onPress={() => {
              saveOnboarding({ dailyTarget: target });
              go("ready");
            }}
          />
        )}
        {step === "ready" && (
          <Button
            title="Create my free account"
            onPress={() => router.push({ pathname: "/auth", params: { mode: "signup" } })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Intro() {
  return (
    <View style={{ paddingTop: 24 }}>
      <View style={styles.logo}>
        <Txt style={{ fontFamily: fonts.displayBold, fontSize: 40 }} color={colors.white}>
          R
        </Txt>
      </View>
      <Txt variant="hero" center style={{ marginTop: 28 }}>
        Think faster.{"\n"}Talk numbers.
      </Txt>
      <Muted center style={{ marginTop: 12, paddingHorizontal: 20 }}>
        Get quicker and more confident with numbers, in meetings and on the go. Five minutes a day.
      </Muted>
      <View style={{ marginTop: 36, gap: 18 }}>
        <Benefit icon="chatbubbles-outline" title="Speak up in meetings" text="18% of 250? Say it before the slide changes." />
        <Benefit icon="walk-outline" title="Numbers on the go" text="Split a bill, check a discount, size a deal. No calculator." />
        <Benefit icon="trending-up" title="Confidence that builds" text="Short daily lessons, streaks and progress you can see." />
      </View>
    </View>
  );
}

function Benefit({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
      <IconBadge name={icon} size={46} />
      <View style={{ flex: 1 }}>
        <Txt variant="label">{title}</Txt>
        <Muted variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
          {text}
        </Muted>
      </View>
    </View>
  );
}

function Ready({ goal, target }: { goal: GoalId | null; target: DailyTargetId }) {
  const g = GOALS.find((x) => x.id === goal);
  const t = DAILY_TARGETS.find((x) => x.id === target) ?? DAILY_TARGETS[1];
  return (
    <View style={{ paddingTop: 32, alignItems: "stretch" }}>
      <View style={{ alignItems: "center" }}>
        <IconBadge name="checkmark" color={colors.success} bg={colors.successSoft} size={64} />
        <Txt variant="title" center style={{ marginTop: 20 }}>
          Your plan is ready
        </Txt>
      </View>
      <Card style={{ marginTop: 28, gap: 14 }}>
        <KeyValue label="Focus" value={g ? `${g.emoji} ${g.title}` : "🧠 All-round speed"} />
        <KeyValue label="Daily goal" value={`${t.minutes} min · ${t.lessons} lesson${t.lessons === 1 ? "" : "s"}`} />
        <KeyValue label="First step" value="2-minute placement test" />
      </Card>
      <Muted center style={{ marginTop: 20 }}>
        Create a free account to save your streak and progress.
      </Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  sub: { marginTop: 8 },
  list: { marginTop: 24, gap: 12 },
  actions: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, gap: 4 },
  link: { alignItems: "center", paddingVertical: 14 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
});
