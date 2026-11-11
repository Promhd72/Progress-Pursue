import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TipCard } from "@/components/Coaching";
import { NumericKeypad } from "@/components/NumericKeypad";
import { Button, Card, IconBadge, Ionicons, Muted, ProgressBar, Row, Txt } from "@/components/ui";
import { MEETING_SECONDS, buildMeetingRound, getMeetingStats, recordMeetingRound, type MeetingQuestion } from "@/lib/meeting";
import { answerHaptic, finishHaptic, keyHaptic } from "@/lib/native";
import { useQuitGuard } from "@/lib/useQuitGuard";
import { colors, fonts, radius } from "@/theme";

type Answered = MeetingQuestion & { given: string; correct: boolean };
type Phase = "intro" | "running" | "done";

/** 60 seconds of work-style questions. Practice only: stats stay on the device. */
export default function MeetingWarmup() {
  const router = useRouter();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState<MeetingQuestion[]>([]);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [result, setResult] = useState<{ correct: number; previousBest: number; best: number } | null>(null);
  const guard = useQuitGuard("Stop the warm-up?", "This round won't be saved.", "Stop");
  const close = () => (router.canGoBack() ? router.back() : router.replace("/train"));
  const stats = getMeetingStats();

  function start() {
    setRound(buildMeetingRound());
    setAnswers([]);
    setResult(null);
    guard.setActive(true);
    setPhase("running");
  }

  function finish(all: Answered[]) {
    guard.setActive(false);
    const correct = all.filter((a) => a.correct).length;
    const { previousBest, stats: next } = recordMeetingRound(correct);
    setAnswers(all);
    setResult({ correct, previousBest, best: next.best });
    void qc.invalidateQueries({ queryKey: ["meeting-stats"] });
    finishHaptic();
    setPhase("done");
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.bar}>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={28} color={colors.mutedForeground} />
        </Pressable>
        <Txt variant="label">Meeting warm-up</Txt>
        <View style={{ width: 28 }} />
      </View>

      {phase === "intro" && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <IconBadge name="chatbubbles-outline" size={56} />
            <Txt variant="title" style={{ marginTop: 20 }}>
              Warm up before your next call
            </Txt>
            <Muted style={{ marginTop: 8 }}>
              {MEETING_SECONDS} seconds of numbers the way people actually say them: targets, discounts, budgets,
              splits and growth. Answer as many as you can.
            </Muted>
            <Card style={{ marginTop: 24, gap: 12 }}>
              <Example text={`"We're at 20% of our $300K target." How much is that, in $K?`} />
              <Example text="The bill is $180, split 4 ways. How much each?" />
              <Example text={`"Revenue went from $200K to $230K." Growth, in %?`} />
            </Card>
            {stats.rounds > 0 && (
              <Muted variant="caption" style={{ marginTop: 16 }}>
                Your best: {stats.best} correct · {stats.rounds} warm-up{stats.rounds === 1 ? "" : "s"} done
              </Muted>
            )}
          </ScrollView>
          <View style={styles.actions}>
            <Button title={`Start (${MEETING_SECONDS} seconds)`} icon="play" onPress={start} />
          </View>
        </>
      )}

      {phase === "running" && <Runner questions={round} onDone={finish} />}

      {phase === "done" && result && (
        <Results answers={answers} result={result} onAgain={start} onClose={close} />
      )}
    </SafeAreaView>
  );
}

function Example({ text }: { text: string }) {
  return (
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <Txt style={{ flex: 1 }}>{text}</Txt>
    </Row>
  );
}

function Runner({ questions, onDone }: { questions: MeetingQuestion[]; onDone: (a: Answered[]) => void }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [left, setLeft] = useState(MEETING_SECONDS);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const answers = useRef<Answered[]>([]);
  const done = useRef(false);
  const shake = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const end = () => {
    if (done.current) return;
    done.current = true;
    onDone(answers.current);
  };

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const remaining = Math.max(0, MEETING_SECONDS - Math.floor((Date.now() - started) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        end();
      }
    }, 250);
    return () => {
      clearInterval(id);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];
  const compact = useWindowDimensions().height < 720;

  function next() {
    setFlash(null);
    setInput("");
    if (index + 1 >= questions.length) end();
    else setIndex((i) => i + 1);
  }

  function submit(skip = false) {
    if (flash || !q || done.current) return;
    const given = skip ? "" : input.trim();
    if (!skip && given === "") return;
    const correct = given !== "" && Number(given) === q.answer;
    answers.current = [...answers.current, { ...q, given, correct }];
    setFlash(correct ? "ok" : "bad");
    answerHaptic(correct);
    if (!correct) {
      Animated.sequence(
        [8, -8, 6, -6, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true })),
      ).start();
    }
    timer.current = setTimeout(next, correct ? 300 : 1100);
  }

  if (!q) return null;
  const score = answers.current.filter((a) => a.correct).length;
  const border = flash === "ok" ? colors.success : flash === "bad" ? colors.destructive : colors.accent;

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={6}>
          <Ionicons name="timer-outline" size={18} color={left <= 10 ? colors.destructive : colors.mutedForeground} />
          <Txt variant="label" color={left <= 10 ? colors.destructive : colors.foreground} style={{ fontVariant: ["tabular-nums"] }}>
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </Txt>
        </Row>
        <Row gap={16}>
          <Txt variant="label" color={colors.success}>
            ✓ {score}
          </Txt>
          <Pressable
            onPress={() => {
              keyHaptic();
              submit(true);
            }}
            disabled={!!flash}
            hitSlop={10}
            accessibilityLabel="Skip this question"
          >
            <Txt variant="label" color={flash ? colors.mutedForeground : colors.primary}>
              Skip
            </Txt>
          </Pressable>
        </Row>
      </Row>
      <View style={{ marginTop: 10 }}>
        <ProgressBar value={left / MEETING_SECONDS} height={6} color={left <= 10 ? colors.destructive : colors.primary} />
      </View>

      <View style={[styles.center, compact && { gap: 8, paddingVertical: 6 }]}>
        <View style={[styles.bubble, compact && { padding: 12 }]}>
          <Txt style={[styles.say, compact && { fontSize: 17, lineHeight: 23 }]}>{q.say}</Txt>
        </View>
        <Animated.View style={[styles.answer, compact && { height: 54 }, { borderColor: border, transform: [{ translateX: shake }] }]}>
          <Txt style={[styles.answerText, !input && { color: "#b4bfca" }]}>{input || "?"}</Txt>
          {flash === "ok" && <Ionicons name="checkmark-circle" size={28} color={colors.success} style={styles.mark} />}
          {flash === "bad" && <Ionicons name="close-circle" size={28} color={colors.destructive} style={styles.mark} />}
        </Animated.View>
        <View style={{ minHeight: 22, justifyContent: "center" }}>
          {flash === "bad" ? (
            <Muted>
              {q.math} = <Txt variant="label">{String(q.answer)}</Txt>
            </Muted>
          ) : null}
        </View>
      </View>

      <NumericKeypad
        disabled={!!flash}
        onDigit={(d) => setInput((v) => (v + d).slice(0, 7))}
        onBackspace={() => setInput((v) => v.slice(0, -1))}
        onSubmit={() => submit()}
      />
    </View>
  );
}

function Results({
  answers,
  result,
  onAgain,
  onClose,
}: {
  answers: Answered[];
  result: { correct: number; previousBest: number; best: number };
  onAgain: () => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const newBest = result.correct > result.previousBest && result.previousBest > 0;
  const verdict =
    result.correct >= 8
      ? "Boardroom ready. You'd have answered before anyone opened a calculator."
      : result.correct >= 4
        ? "Solid. A few more warm-ups and these will feel automatic."
        : "Good start. Tap any question below to see the quick way to do it.";

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: "center" }}>
          <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold, letterSpacing: 1 }}>
            {newBest ? "NEW PERSONAL BEST" : "TIME'S UP"}
          </Txt>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 64, marginTop: 4 }}>{result.correct}</Txt>
          <Muted>correct in {MEETING_SECONDS} seconds · best {result.best}</Muted>
          <Txt center style={{ marginTop: 14 }}>
            {verdict}
          </Txt>
        </View>

        {answers.length > 0 && (
          <View style={{ marginTop: 24, gap: 10 }}>
            <Txt variant="heading">Your answers</Txt>
            {answers.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  keyHaptic();
                  setOpen(open === i ? null : i);
                }}
              >
                <Card style={{ gap: 8 }}>
                  <Row gap={10} style={{ alignItems: "flex-start" }}>
                    <Ionicons
                      name={a.correct ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={a.correct ? colors.success : colors.destructive}
                      style={{ marginTop: 1 }}
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt>{a.say}</Txt>
                      <Muted variant="caption">
                        {a.math} = {a.answer}
                        {a.correct ? "" : a.given ? ` · you said ${a.given}` : " · skipped"}
                      </Muted>
                    </View>
                    <Ionicons name={open === i ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                  </Row>
                  {open === i &&
                    (a.track ? (
                      <TipCard track={a.track} ops={a.ops} prompt={a.math} answer={a.answer} />
                    ) : (
                      <View style={styles.explain}>
                        {a.explain?.map((line, j) => (
                          <Txt key={j} style={{ fontSize: 15 }}>
                            {j + 1}. {line}
                          </Txt>
                        ))}
                      </View>
                    ))}
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <Button title="Go again" icon="refresh" onPress={onAgain} />
        <Button title="Done" variant="ghost" onPress={onClose} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  actions: { paddingHorizontal: 24, paddingBottom: 8, gap: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 12 },
  bubble: {
    alignSelf: "stretch",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  say: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 29 },
  answer: {
    minWidth: 200,
    height: 68,
    borderRadius: radius.lg,
    borderWidth: 2.5,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 44,
  },
  answerText: { fontFamily: fonts.displayBold, fontSize: 34, fontVariant: ["tabular-nums"] },
  mark: { position: "absolute", right: 12 },
  explain: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, gap: 6 },
});
