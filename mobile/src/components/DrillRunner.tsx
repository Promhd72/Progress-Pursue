import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { NumericKeypad } from "@/components/NumericKeypad";
import { HintText, TipCard, type ReviewItem } from "@/components/Coaching";
import { Button, Ionicons, Muted, ProgressBar, Row, Txt } from "@/components/ui";
import type { Question } from "@/lib/curriculum";
import { answerHaptic, keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

export type DrillAnswer = ReviewItem & { index: number };

/**
 * Shared question-by-question runner for lessons and the placement test:
 * big prompt, answer box, on-screen keypad, instant right/wrong feedback.
 *
 * With `teach` on (lessons): a wrong answer pauses on a step-by-step
 * walkthrough, and a Hint button can show the first step before answering.
 * `coaching` additionally pauses after right answers too.
 */
export function DrillRunner({
  questions,
  header,
  coaching,
  teach,
  allowSkipHint,
  onAnswer,
  onDone,
}: {
  questions: Question[];
  header: (state: { index: number; correct: number }) => React.ReactNode;
  coaching?: boolean;
  teach?: boolean;
  allowSkipHint?: boolean;
  onAnswer?: (a: DrillAnswer) => void;
  onDone: (answers: DrillAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [paused, setPaused] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const answers = useRef<DrillAnswer[]>([]);
  const shake = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const q = questions[index];
  const compact = useWindowDimensions().height < 720;
  const correctSoFar = answers.current.filter((a) => a.correct).length;
  const isLast = index + 1 >= questions.length;

  function advance() {
    setFlash(null);
    setPaused(false);
    setHintShown(false);
    setInput("");
    if (!isLast) setIndex((i) => i + 1);
    else onDone(answers.current);
  }

  function submit() {
    if (flash || paused || !q) return;
    const trimmed = input.trim();
    const isOk = trimmed !== "" && Number(trimmed) === q.answer;
    const answer: DrillAnswer = {
      index,
      prompt: q.prompt,
      answer: q.answer,
      given: trimmed,
      correct: isOk,
      track: q.track,
      ops: q.ops,
      usedHint: hintShown,
    };
    answers.current = [...answers.current, answer];
    onAnswer?.(answer);
    setFlash(isOk ? "ok" : "bad");
    answerHaptic(isOk);
    if (!isOk) {
      Animated.sequence(
        [8, -8, 6, -6, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true })),
      ).start();
    }
    // Lessons: always explain mistakes; explain right answers too if tips are on.
    if (teach && (!isOk || coaching)) {
      timer.current = setTimeout(() => setPaused(true), isOk ? 250 : 650);
      return;
    }
    timer.current = setTimeout(advance, isOk ? 300 : 800);
  }

  if (!q) return null;
  const border = flash === "ok" ? colors.success : flash === "bad" ? colors.destructive : colors.accent;
  const lastAnswer = answers.current[answers.current.length - 1];

  if (paused) {
    const wasRight = lastAnswer?.correct;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ gap: 10 }}>
          {header({ index, correct: correctSoFar })}
          <ProgressBar value={(index + 1) / questions.length} height={6} />
        </View>
        <ScrollView style={{ flex: 1, marginTop: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
          <Row gap={8}>
            <Ionicons
              name={wasRight ? "checkmark-circle" : "close-circle"}
              size={22}
              color={wasRight ? colors.success : colors.destructive}
            />
            <Txt variant="label" color={wasRight ? colors.success : colors.destructive}>
              {wasRight
                ? "Correct! Here's the quick way to think about it."
                : lastAnswer?.given
                  ? `Not quite. You said ${lastAnswer.given}. Let's walk through it.`
                  : "Let's walk through it."}
            </Txt>
          </Row>
          <TipCard track={q.track} ops={q.ops} prompt={q.prompt} answer={q.answer} />
        </ScrollView>
        <Button title={isLast ? "Got it, see results" : "Got it, next question"} icon="arrow-forward" onPress={advance} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: 10 }}>
        {header({ index, correct: correctSoFar })}
        <ProgressBar value={index / questions.length} height={6} />
      </View>

      <View style={[styles.center, compact && { gap: 10, paddingVertical: 6 }]}>
        <Txt style={[styles.prompt, compact && { fontSize: 46 }]} adjustsFontSizeToFit numberOfLines={1}>
          {q.prompt}
        </Txt>
        <Animated.View style={[styles.answer, compact && { height: 60 }, { borderColor: border, transform: [{ translateX: shake }] }]}>
          <Txt style={[styles.answerText, !input && { color: "#b4bfca" }]}>{input || "?"}</Txt>
          {flash === "ok" && <Ionicons name="checkmark-circle" size={30} color={colors.success} style={styles.mark} />}
          {flash === "bad" && <Ionicons name="close-circle" size={30} color={colors.destructive} style={styles.mark} />}
        </Animated.View>
        <View style={{ minHeight: 28, justifyContent: "center", alignItems: "center", alignSelf: "stretch" }}>
          {flash === "bad" ? (
            <Muted>
              Answer: <Txt variant="label">{String(q.answer)}</Txt>
            </Muted>
          ) : flash ? null : teach && hintShown ? (
            <HintText track={q.track} ops={q.ops} />
          ) : teach ? (
            <Pressable
              onPress={() => {
                keyHaptic();
                setHintShown(true);
              }}
              hitSlop={8}
              style={styles.hintButton}
              accessibilityLabel="Show a hint"
            >
              <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold, fontSize: 14 }}>
                Hint
              </Txt>
            </Pressable>
          ) : allowSkipHint ? (
            <Muted variant="caption">Not sure? Tap ✓ to skip</Muted>
          ) : null}
        </View>
      </View>

      <NumericKeypad
        disabled={!!flash}
        onDigit={(d) => setInput((v) => (v + d).slice(0, 7))}
        onBackspace={() => setInput((v) => v.slice(0, -1))}
        onSubmit={submit}
      />
    </View>
  );
}

export function DrillHeader({ left, right }: { left: string; right?: React.ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <Muted variant="caption" style={{ fontFamily: fonts.semibold }}>
        {left}
      </Muted>
      {right}
    </Row>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 12 },
  prompt: { fontFamily: fonts.displayBold, fontSize: 60, letterSpacing: -1.5, fontVariant: ["tabular-nums"] },
  answer: {
    minWidth: 220,
    height: 76,
    borderRadius: radius.lg,
    borderWidth: 2.5,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  answerText: { fontFamily: fonts.displayBold, fontSize: 38, fontVariant: ["tabular-nums"] },
  mark: { position: "absolute", right: 12 },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
});
