import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AdvancedVisual } from "@/components/AdvancedVisual";
import { Button, Card, ErrorState, IconBadge, Ionicons, Loading, Muted, ProgressBar, Row, Txt } from "@/components/ui";
import { ADVANCED_DOMAINS, ADVANCED_DOMAIN_LABELS, type AdvancedDomain } from "@/lib/advanced-domains";
import { type AdvancedAccess, type AdvancedAnswerResult } from "@/lib/advanced.functions";
import { getAdvancedAccess, getAdvancedProgress, submitAdvancedAnswer } from "@/lib/backend";
import { answerHaptic, keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

export default function Advanced() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ domain?: string }>();
  const domain = (ADVANCED_DOMAINS as readonly string[]).includes(params.domain ?? "")
    ? (params.domain as AdvancedDomain)
    : null;

  const accessQ = useQuery({
    queryKey: ["advanced-access", domain ?? "all"],
    queryFn: () => getAdvancedAccess({ data: { domain } }),
    refetchOnWindowFocus: false,
  });
  const progressQ = useQuery({ queryKey: ["advanced-progress"], queryFn: () => getAdvancedProgress() });
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AdvancedAnswerResult | null>(null);
  const [hints, setHints] = useState(0);

  const submitM = useMutation({
    mutationFn: (input: { questionId: string; selectedIndex: number }) => submitAdvancedAnswer({ data: input }),
    onSuccess: (data) => {
      setResult(data);
      answerHaptic(data.correct);
      void progressQ.refetch();
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => Alert.alert("Couldn't submit", err instanceof Error ? err.message : "Try again."),
  });

  function reset() {
    setSelected(null);
    setResult(null);
    setHints(0);
    submitM.reset();
  }

  function next() {
    reset();
    void accessQ.refetch();
  }

  const progress = progressQ.data ? (domain ? progressQ.data.byDomain[domain] : progressQ.data.overall) : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Txt variant="title">Real-life scenarios</Txt>
        <Muted style={{ marginTop: 4 }}>
          Work situations with real numbers. Read the story, scan the chart or table, and pick the answer.
        </Muted>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[null, ...ADVANCED_DOMAINS].map((d) => {
          const on = d === domain;
          return (
            <Pressable
              key={d ?? "all"}
              onPress={() => {
                keyHaptic();
                reset();
                router.setParams({ domain: d ?? undefined });
              }}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Txt variant="caption" color={on ? colors.white : colors.foreground} style={{ fontFamily: fonts.semibold, fontSize: 14 }}>
                {d ? ADVANCED_DOMAIN_LABELS[d] : "All"}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      {progress && (
        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Txt variant="label">
              {progress.mastered} of {progress.total} scenarios solved
            </Txt>
            <Muted variant="caption">
              {progress.accuracy === null ? "No answers yet" : `${progress.accuracy}% right`}
            </Muted>
          </Row>
          <ProgressBar value={progress.total > 0 ? progress.mastered / progress.total : 0} />
          <Muted variant="caption" style={{ fontSize: 13 }}>
            {progress.total > 0 && progress.mastered === progress.total
              ? "You've solved every scenario here. Replays keep you sharp."
              : "A scenario counts as solved once you get it right. Solve them all to complete this topic."}
          </Muted>
        </Card>
      )}

      {accessQ.isLoading ? (
        <Loading />
      ) : accessQ.error || !accessQ.data ? (
        <ErrorState message="Check your connection and try again." onRetry={() => accessQ.refetch()} />
      ) : accessQ.data.locked || !accessQ.data.question ? (
        <Card style={{ alignItems: "center", gap: 10, padding: 24 }}>
          <IconBadge name="moon-outline" size={56} />
          <Txt variant="heading" center>That's today's free scenarios</Txt>
          <Muted center>Free gives you three each day. Come back tomorrow for more.</Muted>
          <Button title="Run a regular lesson" variant="secondary" onPress={() => router.navigate("/train")} style={{ alignSelf: "stretch", marginTop: 6 }} />
        </Card>
      ) : (
        <Question
          access={accessQ.data}
          selected={selected}
          setSelected={setSelected}
          result={result}
          submitting={submitM.isPending}
          hints={hints}
          onHint={() => setHints((h) => h + 1)}
          onSubmit={() => {
            if (selected === null || !accessQ.data?.question) return;
            submitM.mutate({ questionId: accessQ.data.question.id, selectedIndex: selected });
          }}
          onNext={next}
        />
      )}
    </ScrollView>
  );
}

function Question({
  access,
  selected,
  setSelected,
  result,
  submitting,
  hints,
  onHint,
  onSubmit,
  onNext,
}: {
  access: AdvancedAccess;
  selected: number | null;
  setSelected: (n: number) => void;
  result: AdvancedAnswerResult | null;
  submitting: boolean;
  hints: number;
  onHint: () => void;
  onSubmit: () => void;
  onNext: () => void;
}) {
  const q = access.question!;
  const remaining = result ? result.remainingToday : access.isPro ? null : access.remainingToday;
  return (
    <Card style={{ gap: 16 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Muted variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 1 }}>{q.topic.toUpperCase()}</Muted>
        {remaining !== null && remaining !== undefined && Number.isFinite(remaining) && (
          <Muted variant="caption">{remaining} left today</Muted>
        )}
      </Row>
      <Txt style={{ fontSize: 17, lineHeight: 25 }}>{q.scenario}</Txt>
      {q.visual.kind !== "none" && (
        <View style={{ backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }}>
          <AdvancedVisual visual={q.visual} />
        </View>
      )}
      <Txt variant="heading">{q.question}</Txt>

      <View style={{ gap: 10 }}>
        {q.options.map((opt, i) => {
          const isSel = selected === i;
          const isRight = result && i === result.correctIndex;
          const isWrong = result && isSel && !result.correct;
          const border = isRight ? colors.success : isWrong ? colors.destructive : isSel ? colors.primary : colors.border;
          const bg = isRight ? colors.successSoft : isWrong ? colors.destructiveSoft : isSel ? colors.primarySoft : colors.card;
          return (
            <Pressable
              key={i}
              disabled={!!result || submitting}
              onPress={() => {
                keyHaptic();
                setSelected(i);
              }}
              style={[styles.option, { borderColor: border, backgroundColor: bg }, result && !isRight && !isWrong && { opacity: 0.6 }]}
            >
              <View style={[styles.letter, isSel && !result && { backgroundColor: colors.primary }]}>
                <Txt variant="caption" color={isSel && !result ? colors.white : colors.mutedForeground} style={{ fontFamily: fonts.bold }}>
                  {String.fromCharCode(65 + i)}
                </Txt>
              </View>
              <Txt variant="label" style={{ flex: 1, fontFamily: fonts.medium }}>{opt}</Txt>
              {isRight && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
              {isWrong && <Ionicons name="close-circle" size={22} color={colors.destructive} />}
            </Pressable>
          );
        })}
      </View>

      {!result && (hints > 0 || q.hints.length > 0) && (
        <View style={{ gap: 8 }}>
          {q.hints.slice(0, hints).map((h, i) => (
            <Row key={i} gap={10} style={{ alignItems: "flex-start" }}>
              <View style={styles.hintNum}>
                <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.bold, fontSize: 12 }}>{i + 1}</Txt>
              </View>
              <Muted style={{ flex: 1, fontSize: 15 }}>{h}</Muted>
            </Row>
          ))}
          {hints < q.hints.length && (
            <Pressable onPress={onHint} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="bulb-outline" size={18} color={colors.primary} />
              <Txt variant="label" color={colors.primary}>
                {hints === 0 ? `Stuck? Get a hint (${q.hints.length} available)` : `Next hint (${q.hints.length - hints} left)`}
              </Txt>
            </Pressable>
          )}
        </View>
      )}

      {result ? (
        <View style={{ gap: 14 }}>
          <View style={{ backgroundColor: result.correct ? colors.successSoft : colors.destructiveSoft, borderRadius: radius.md, padding: 14 }}>
            <Txt variant="label" color={result.correct ? colors.success : colors.destructive}>
              {result.correct ? "Nice, correct." : "Not quite."}
            </Txt>
            <Txt style={{ marginTop: 4, fontSize: 15, lineHeight: 22 }}>{result.explanation}</Txt>
          </View>
          <View style={{ gap: 8 }}>
            <Txt variant="label">How to do it in your head{result.technique ? ` · ${result.technique}` : ""}</Txt>
            {result.steps.map((s, i) => (
              <Row key={i} gap={10} style={{ alignItems: "flex-start" }}>
                <View style={styles.hintNum}>
                  <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.bold, fontSize: 12 }}>{i + 1}</Txt>
                </View>
                <Muted style={{ flex: 1, fontSize: 15 }}>{s}</Muted>
              </Row>
            ))}
          </View>
          <Button
            title={result.isPro || (result.remainingToday ?? 0) > 0 ? "Next scenario" : "Done for today"}
            icon="arrow-forward"
            onPress={onNext}
          />
        </View>
      ) : (
        <Button title="Submit answer" disabled={selected === null} loading={submitting} onPress={onSubmit} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  hintNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
});
