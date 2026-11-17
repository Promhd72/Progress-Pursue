import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  ChoiceCard,
  Gradient,
  IconBadge,
  Ionicons,
  KeyValue,
  Muted,
  ProgressBar,
  Txt,
  type IconName,
} from "@/components/ui";
import { LanguageToggle } from "@/components/LanguagePicker";
import { keyHaptic } from "@/lib/native";
import {
  DAILY_TARGETS,
  GOALS,
  getOnboarding,
  saveOnboarding,
  type DailyTargetId,
  type GoalId,
} from "@/lib/onboarding";
import { colors, fonts, radius } from "@/theme";
import { auto, mark, tr } from "@/lib/i18n";

type Step = "intro" | "goal" | "target" | "ready";
const ORDER: Step[] = ["intro", "goal", "target", "ready"];

const TARGET_ICON: Record<DailyTargetId, { icon: IconName; tint: { fg: string; bg: string } }> = {
  casual: { icon: "leaf", tint: { fg: "#15803d", bg: "#e2f6ec" } },
  regular: { icon: "flash", tint: { fg: "#1866d8", bg: "#e8f1ff" } },
  serious: { icon: "flame", tint: { fg: "#c2410c", bg: "#fff0e3" } },
};
const GOAL_ICON: Record<GoalId, { icon: IconName; tint: { fg: string; bg: string } }> = {
  meetings: { icon: "briefcase", tint: { fg: "#1866d8", bg: "#e8f1ff" } },
  interviews: { icon: "ribbon", tint: { fg: "#6d4ef0", bg: "#efebff" } },
  money: { icon: "wallet", tint: { fg: "#15803d", bg: "#e2f6ec" } },
  sharp: { icon: "bulb", tint: { fg: "#c2410c", bg: "#fff0e3" } },
};

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
      {idx === 0 && (
        <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 }}>
          <LanguageToggle />
        </View>
      )}
      <View style={[styles.top, idx === 0 && { height: 0 }]}>
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
                  icon={GOAL_ICON[g.id].icon}
                  tint={GOAL_ICON[g.id].tint}
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
                  icon={TARGET_ICON[t.id].icon}
                  tint={TARGET_ICON[t.id].tint}
                  title={`${t.minutes} min a day`}
                  subtitle={mark(`${auto(t.label)} · ${lessonCount(t.lessons)}`)}
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
              <Pressable style={styles.link} hitSlop={8} accessibilityRole="button">
                <Txt variant="label" color={colors.primary} style={{ fontSize: 16 }}>
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
    <View>
      <Gradient style={styles.hero}>
        <View style={styles.logo}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 30 }} color={colors.primary}>
            R
          </Txt>
        </View>
        <Txt variant="hero" color={colors.white} style={{ marginTop: 22 }}>
          Think faster.{"\n"}Talk numbers.
        </Txt>
        <Txt color="rgba(255,255,255,0.92)" style={{ marginTop: 10, fontSize: 16, lineHeight: 23 }}>
          Get quicker and more confident with numbers, in meetings and on the go. Five minutes a day.
        </Txt>
        <View style={styles.sums}>
          <Sum q="18% of 250" a="45" />
          <Sum q="$180 ÷ 4" a="$45" />
          <Sum q="64 × 5" a="320" />
        </View>
      </Gradient>
      <View style={{ marginTop: 24, gap: 16 }}>
        <Benefit icon="chatbubbles" title="Speak up in meetings" text="Have the number ready before the slide changes." />
        <Benefit icon="walk" title="Numbers on the go" text="Split a bill, check a discount, size a deal. No calculator." />
        <Benefit icon="trending-up" title="Confidence that builds" text="Short daily lessons, streaks and progress you can see." />
      </View>
    </View>
  );
}

function Sum({ q, a }: { q: string; a: string }) {
  return (
    <View style={styles.sum}>
      <Txt style={{ fontFamily: fonts.semibold, fontSize: 13 }} color="rgba(255,255,255,0.92)">
        {q} ={" "}
      </Txt>
      <Txt style={{ fontFamily: fonts.displayBold, fontSize: 14 }} color={colors.white}>
        {a}
      </Txt>
    </View>
  );
}

const lessonCount = (n: number) => (n === 1 ? tr("1 lesson") : tr("{n} lessons", { n }));

function Benefit({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
      <IconBadge name={icon} size={44} />
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
        <KeyValue label="Focus" value={g ? auto(g.title) : "All-round speed"} />
        <KeyValue label="Daily goal" value={mark(`${t.minutes} min · ${lessonCount(t.lessons)}`)} />
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
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  sub: { marginTop: 8 },
  list: { marginTop: 24, gap: 12 },
  actions: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 4 },
  link: { alignItems: "center", paddingVertical: 14 },
  hero: { borderRadius: radius.xl + 4, padding: 24, paddingTop: 26 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sums: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 },
  sum: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
});
