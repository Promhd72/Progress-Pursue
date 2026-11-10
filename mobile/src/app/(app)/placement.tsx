import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CoachingReview } from "@/components/Coaching";
import { DrillHeader, DrillRunner, type DrillAnswer } from "@/components/DrillRunner";
import { Button, Card, IconBadge, Ionicons, Loading, Muted, Row, Txt } from "@/components/ui";
import { PLACEMENT_LENGTH, TRACK_LABELS, TRACKS, buildPlacement, type SkillTrack } from "@/lib/curriculum";
import { submitPlacement } from "@/lib/backend";
import { finishHaptic } from "@/lib/native";
import { useQuitGuard } from "@/lib/useQuitGuard";
import { colors, fonts } from "@/theme";

type Phase = "intro" | "running" | "saving" | "done";

export default function PlacementScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const questions = useMemo(() => buildPlacement(), []);
  const [phase, setPhase] = useState<Phase>("intro");
  const [levels, setLevels] = useState<Record<SkillTrack, number> | null>(null);
  const [review, setReview] = useState<DrillAnswer[]>([]);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/train"));
  const guard = useQuitGuard("Quit the placement test?", "Your placement won't be saved. You can take it again anytime.", "Quit test");

  async function finish(answers: DrillAnswer[]) {
    guard.setActive(false);
    setReview(answers);
    setPhase("saving");
    const perSkill = {} as Record<SkillTrack, { score: number; max: number }>;
    for (const t of TRACKS) perSkill[t] = { score: 0, max: 0 };
    questions.forEach((q, i) => {
      perSkill[q.track].max += q.weight;
      if (answers[i]?.correct) perSkill[q.track].score += q.weight;
    });
    try {
      const res = await submitPlacement({
        data: { perSkill, totalCorrect: answers.filter((a) => a.correct).length, total: questions.length },
      });
      setLevels(res.startingLevels);
      void qc.invalidateQueries();
      finishHaptic();
      setPhase("done");
    } catch (err) {
      Alert.alert("Couldn't save your placement", err instanceof Error ? err.message : "Check your connection.");
      setPhase("intro");
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.bar}>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={28} color={colors.mutedForeground} />
        </Pressable>
        <Txt variant="label">Placement test</Txt>
        {guard.active ? (
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Quit placement test">
            <Txt variant="label" color={colors.destructive}>Quit</Txt>
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {phase === "intro" && (
        <View style={{ flex: 1, padding: 24 }}>
          <View style={{ flex: 1 }}>
            <IconBadge name="speedometer-outline" size={60} />
            <Txt variant="title" style={{ marginTop: 20 }}>Find your starting level</Txt>
            <Muted style={{ marginTop: 8 }}>
              {PLACEMENT_LENGTH} questions across all five tracks, easy to hard. Takes about two minutes.
            </Muted>
            <View style={{ marginTop: 24, gap: 12 }}>
              <Tip icon="flash-outline" text="Answer as fast as you comfortably can." />
              <Tip icon="help-circle-outline" text="Not sure? Tap ✓ to skip. Skips count as wrong." />
              <Tip icon="refresh-outline" text="You can retake it anytime from Profile." />
            </View>
          </View>
          <Button title="Start" icon="arrow-forward" onPress={() => setPhase("running")} />
        </View>
      )}

      {phase === "running" && (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 12 }}>
          <DrillRunner
            questions={questions}
            allowSkipHint
            onAnswer={() => guard.setActive(true)}
            onDone={finish}
            header={({ index, correct }) => (
              <DrillHeader
                left={`Question ${index + 1} of ${questions.length} · ${TRACK_LABELS[questions[index].track]}`}
                right={<Muted variant="caption">{correct} correct</Muted>}
              />
            )}
          />
        </View>
      )}

      {phase === "saving" && <Loading />}

      {phase === "done" && levels && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View>
            <Txt variant="title">Your starting line</Txt>
            <Muted style={{ marginTop: 6 }}>Here's where you'll start on each track. You can always replay earlier levels.</Muted>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
            {TRACKS.map((t) => (
              <Card key={t} style={{ width: "48.3%", padding: 14 }}>
                <Muted variant="caption" style={{ fontFamily: fonts.semibold, fontSize: 12 }}>{TRACK_LABELS[t].toUpperCase()}</Muted>
                <Txt style={{ fontFamily: fonts.displayBold, fontSize: 24, marginTop: 4 }}>Level {levels[t]}</Txt>
              </Card>
            ))}
          </View>
          <CoachingReview items={review} />
          <Button title="Open my curriculum" icon="arrow-forward" onPress={() => router.replace("/train")} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Tip({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return (
    <Row gap={12}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Muted style={{ flex: 1 }}>{text}</Muted>
    </Row>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
});
