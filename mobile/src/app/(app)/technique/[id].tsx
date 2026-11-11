import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { TipCard } from "@/components/Coaching";
import { DrillHeader, DrillRunner, type DrillAnswer } from "@/components/DrillRunner";
import { Button, Card, ErrorState, Ionicons, Muted, Row, Txt } from "@/components/ui";
import { buildQuestion, levelSummary, TRACK_LABELS } from "@/lib/curriculum";
import { finishHaptic } from "@/lib/native";
import { markTechniqueLearned, techniqueById } from "@/lib/techniques";
import { useOverview } from "@/lib/queries";
import { colors, fonts, radius } from "@/theme";

const TRY_COUNT = 3;

/** One technique: when to use it, why it works, worked examples, and a quick try. */
export default function TechniqueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = techniqueById(id ?? "");
  const { data: overview } = useOverview();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<"read" | "try" | "done">("read");
  const [seed, setSeed] = useState(0);
  const [score, setScore] = useState(0);
  const tryQuestions = useMemo(
    () => (t ? Array.from({ length: TRY_COUNT }, () => buildQuestion(t.track, t.gen())) : []),
    [t, seed], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!t) return <ErrorState message="That technique doesn't exist." onRetry={() => router.back()} />;
  const examples = t.examples.map((ops) => buildQuestion(t.track, ops));

  if (phase === "try") {
    return (
      <View style={{ flex: 1, padding: 20, paddingBottom: 12, backgroundColor: colors.background }}>
        <DrillRunner
          key={seed}
          questions={tryQuestions}
          teach
          onDone={(answers: DrillAnswer[]) => {
            setScore(answers.filter((a) => a.correct).length);
            markTechniqueLearned(t.id);
            void qc.invalidateQueries({ queryKey: ["learned-techniques"] });
            finishHaptic();
            setPhase("done");
          }}
          header={({ index }) => <DrillHeader left={`Try it · ${index + 1} of ${TRY_COUNT}`} />}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={{ gap: 6 }}>
        <Muted variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 0.8 }}>
          {TRACK_LABELS[t.track].toUpperCase()} TECHNIQUE
        </Muted>
        <Txt variant="title">{t.name}</Txt>
        <Muted style={{ fontSize: 17 }}>{t.tagline}</Muted>
      </View>

      {phase === "done" && (
        <View style={styles.doneBox}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Txt variant="label">Technique learned</Txt>
            <Muted variant="caption" style={{ fontSize: 14 }}>
              You got {score} of {TRY_COUNT}. Practise it in the levels below to make it automatic.
            </Muted>
          </View>
        </View>
      )}

      <Card style={{ gap: 14 }}>
        <Section icon="time-outline" title="Use it when">
          <Txt style={{ fontSize: 16, lineHeight: 23 }}>{t.when}</Txt>
        </Section>
        <Section icon="bulb-outline" title="Why it works">
          <Txt style={{ fontSize: 16, lineHeight: 23 }}>{t.why}</Txt>
        </Section>
        <Section icon="list-outline" title="The method">
          <View style={{ gap: 8 }}>
            {t.steps.map((s, i) => (
              <Row key={i} gap={10} style={{ alignItems: "flex-start" }}>
                <View style={styles.num}>
                  <Txt variant="caption" color={colors.white} style={{ fontFamily: fonts.bold, fontSize: 12 }}>
                    {i + 1}
                  </Txt>
                </View>
                <Txt style={{ flex: 1, fontSize: 16, lineHeight: 22 }}>{s}</Txt>
              </Row>
            ))}
          </View>
        </Section>
      </Card>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">Worked examples</Txt>
        {examples.map((q, i) => (
          <TipCard key={i} track={t.track} ops={q.ops} prompt={q.prompt} answer={q.answer} />
        ))}
      </View>

      <Button
        title={phase === "done" ? "Try 3 more" : "Try it: 3 quick questions"}
        icon="flash-outline"
        onPress={() => {
          setSeed((s) => s + 1);
          setPhase("try");
        }}
      />
      <Muted variant="caption" center style={{ marginTop: -8 }}>
        Practice here doesn't use up your daily lessons.
      </Muted>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">Practise it in your curriculum</Txt>
        {t.levels.map((l) => {
          const info = levelSummary(t.track, l);
          const row = overview?.tracks.find((r) => r.track === t.track);
          const open = (row?.current_level ?? 1) >= l && (overview?.isPro || l <= 2);
          return (
            <Button
              key={l}
              variant="secondary"
              title={`Level ${l}: ${info.name}`}
              icon={open ? "arrow-forward" : "lock-closed-outline"}
              onPress={() =>
                open
                  ? router.push({ pathname: "/lesson/[track]/[level]", params: { track: t.track, level: String(l) } })
                  : router.push({ pathname: "/curriculum", params: { track: t.track } })
              }
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

function Section({ icon, title, children }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Row gap={6}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold, letterSpacing: 0.5 }}>
          {title.toUpperCase()}
        </Txt>
      </Row>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 18 },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 1 },
  doneBox: { flexDirection: "row", gap: 10, backgroundColor: colors.successSoft, borderRadius: radius.md, padding: 14, alignItems: "center" },
});
