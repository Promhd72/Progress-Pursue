import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { NumericKeypad } from "@/components/NumericKeypad";
import { TipCard, type ReviewItem } from "@/components/Coaching";
import { Button, Ionicons, Muted, ProgressBar, Row, Txt } from "@/components/ui";
import type { Question } from "@/lib/curriculum";
import { answerHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

export type DrillAnswer = ReviewItem & { index: number };

/**
 * Shared question-by-question runner for lessons and the placement test:
 * big prompt, answer box, on-screen keypad, instant right/wrong feedback.
 */
export function DrillRunner({
  questions,
  header,
  coaching,
  allowSkipHint,
  onAnswer,
  onDone,
}: {
  questions: Question[];
  header: (state: { index: number; correct: number }) => React.ReactNode;
  coaching?: boolean;
  allowSkipHint?: boolean;
  onAnswer?: (a: DrillAnswer) => void;
  onDone: (answers: DrillAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [paused, setPaused] = useState(false);
  const answers = useRef<DrillAnswer[]>([]);
  const shake = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const q = questions[index];
  const correctSoFar = answers.current.filter((a) => a.correct).length;

  function advance() {
    setFlash(null);
    setPaused(false);
    setInput("");
    if (index + 1 < questions.length) setIndex((i) => i + 1);
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
    if (coaching) {
      setPaused(true);
      return;
    }
    timer.current = setTimeout(advance, isOk ? 300 : 800);
  }

  if (!q) return null;
  const border = flash === "ok" ? colors.success : flash === "bad" ? colors.destructive : colors.accent;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: 10 }}>
        {header({ index, correct: correctSoFar })}
        <ProgressBar value={index / questions.length} height={6} />
      </View>

      <View style={styles.center}>
        <Txt style={styles.prompt} adjustsFontSizeToFit numberOfLines={1}>
          {q.prompt}
        </Txt>
        <Animated.View style={[styles.answer, { borderColor: border, transform: [{ translateX: shake }] }]}>
          <Txt style={[styles.answerText, !input && { color: "#b4bfca" }]}>{input || "?"}</Txt>
          {flash === "ok" && <Ionicons name="checkmark-circle" size={30} color={colors.success} style={styles.mark} />}
          {flash === "bad" && <Ionicons name="close-circle" size={30} color={colors.destructive} style={styles.mark} />}
        </Animated.View>
        <View style={{ height: 24, justifyContent: "center" }}>
          {flash === "bad" ? (
            <Muted>
              Answer: <Txt variant="label">{String(q.answer)}</Txt>
            </Muted>
          ) : allowSkipHint && !flash ? (
            <Muted variant="caption">Not sure? Tap ✓ to skip</Muted>
          ) : null}
        </View>
      </View>

      {paused ? (
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <TipCard track={q.track} ops={q.ops} />
          <Button title={index + 1 < questions.length ? "Next question" : "See results"} icon="arrow-forward" onPress={advance} />
        </View>
      ) : (
        <NumericKeypad
          disabled={!!flash}
          onDigit={(d) => setInput((v) => (v + d).slice(0, 7))}
          onBackspace={() => setInput((v) => v.slice(0, -1))}
          onSubmit={submit}
        />
      )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, paddingVertical: 12 },
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
});
