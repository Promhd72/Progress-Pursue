import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CoachingReview, CoachingToggle, useCoachingPreference } from "@/components/Coaching";
import { DrillHeader, DrillRunner, type DrillAnswer } from "@/components/DrillRunner";
import { LearnCard, hasLearned, markLearned } from "@/components/LearnCard";
import { Button, ErrorState, IconBadge, Ionicons, Loading, Muted, Row, Stars, Txt } from "@/components/ui";
import {
  FREE_MAX_LEVEL,
  MAX_LEVEL,
  PASS_THRESHOLD,
  TRACK_LABELS,
  TRACKS,
  generateLesson,
  levelSummary,
  starsFor,
  type SkillTrack,
} from "@/lib/curriculum";
import { getLessonAccess, submitLesson } from "@/lib/backend";
import { finishHaptic, shareText } from "@/lib/native";
import { useOverview } from "@/lib/queries";
import { useQuitGuard } from "@/lib/useQuitGuard";
import { colors, fonts, radius } from "@/theme";

type Result = { correct: number; total: number; durationMs: number; xpEarned: number; passed: boolean };

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ track: string; level: string }>();
  const track = TRACKS.includes(params.track as SkillTrack) ? (params.track as SkillTrack) : null;
  const level = Number(params.level);
  const valid = track && Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/train"));
  // Leaving mid-lesson asks first; the lesson is discarded and doesn't use a daily lesson.
  const guard = useQuitGuard(
    "Quit this lesson?",
    "Your answers so far won't be saved, and it won't use one of today's free lessons.",
    "Quit lesson",
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.bar}>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={28} color={colors.mutedForeground} />
        </Pressable>
        <Txt variant="label">{valid ? `${TRACK_LABELS[track]} · Level ${level}` : "Lesson"}</Txt>
        {guard.active ? (
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Quit lesson">
            <Txt variant="label" color={colors.destructive}>Quit</Txt>
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>
      {valid ? (
        <LessonGate track={track} level={level} onClose={close} onProgress={guard.setActive} />
      ) : (
        <ErrorState message="That lesson doesn't exist." onRetry={close} />
      )}
    </SafeAreaView>
  );
}

function LessonGate({
  track,
  level,
  onClose,
  onProgress,
}: {
  track: SkillTrack;
  level: number;
  onClose: () => void;
  onProgress: (inProgress: boolean) => void;
}) {
  const accessQ = useQuery({
    queryKey: ["lesson-access", track, level],
    queryFn: () => getLessonAccess({ data: { track, level } }),
  });
  if (accessQ.isLoading) return <Loading />;
  if (accessQ.error || !accessQ.data) return <ErrorState message="Check your connection and try again." onRetry={() => accessQ.refetch()} />;
  const a = accessQ.data;
  if (!a.allowed) return <Locked reason={a.reason} track={track} level={level} onClose={onClose} />;
  return <LessonRunner track={track} level={level} onClose={onClose} onProgress={onProgress} />;
}

function Locked({
  reason,
  track,
  level,
  onClose,
}: {
  reason: "ok" | "locked_pro" | "locked_progression" | "daily_limit";
  track: SkillTrack;
  level: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, body, icon] =
    reason === "locked_pro"
      ? [`Level ${level} is Pro-only`, `Free covers ${TRACK_LABELS[track]} Levels 1–${FREE_MAX_LEVEL}. Levels ${FREE_MAX_LEVEL + 1}–10 come with Pro. Try it free for 3 days.`, "diamond-outline" as const]
      : reason === "locked_progression"
        ? ["Finish earlier levels first", `Pass the previous level (80% or more) to unlock Level ${level}.`, "lock-closed-outline" as const]
        : ["That's today's free lessons", "Free includes 3 lessons a day. Come back tomorrow, or go unlimited with Pro.", "moon-outline" as const];
  return (
    <View style={styles.centerBox}>
      <IconBadge name={icon} size={64} />
      <Txt variant="title" center style={{ marginTop: 20 }}>{title}</Txt>
      <Muted center style={{ marginTop: 8 }}>{body}</Muted>
      {reason === "locked_pro" || reason === "daily_limit" ? (
        <Button title="Try Pro free for 3 days" icon="diamond-outline" onPress={() => router.push("/pro")} style={{ marginTop: 28, alignSelf: "stretch" }} />
      ) : null}
      <Button
        title="Back to training"
        variant={reason === "locked_pro" || reason === "daily_limit" ? "ghost" : "secondary"}
        onPress={onClose}
        style={{ marginTop: reason === "locked_pro" || reason === "daily_limit" ? 8 : 28, alignSelf: "stretch" }}
      />
    </View>
  );
}

function LessonRunner({
  track,
  level,
  onClose,
  onProgress,
}: {
  track: SkillTrack;
  level: number;
  onClose: () => void;
  onProgress: (inProgress: boolean) => void;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const coaching = useCoachingPreference();
  const { data: overview } = useOverview();
  const isPro = Boolean(overview?.isPro);
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => generateLesson(track, level), [track, level, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [review, setReview] = useState<DrillAnswer[]>([]);
  const [saving, setSaving] = useState(false);
  const [learning, setLearning] = useState(() => !hasLearned(track, level));

  async function finish(answers: DrillAnswer[]) {
    onProgress(false);
    const correct = answers.filter((a) => a.correct).length;
    const durationMs = Date.now() - startedAt;
    setReview(answers);
    setSaving(true);
    try {
      const res = await submitLesson({ data: { track, level, correct, total: questions.length, durationMs } });
      setResult({ correct, total: questions.length, durationMs, xpEarned: res.xpEarned, passed: res.passed });
      void qc.invalidateQueries();
    } catch (err) {
      Alert.alert("Couldn't save this lesson", err instanceof Error ? err.message : "Check your connection.");
      setResult({ correct, total: questions.length, durationMs, xpEarned: 0, passed: correct / questions.length >= PASS_THRESHOLD });
    } finally {
      setSaving(false);
      finishHaptic();
    }
  }

  if (learning) {
    return (
      <View style={styles.runner}>
        <LearnCard
          track={track}
          level={level}
          onStart={() => {
            markLearned(track, level);
            setLearning(false);
            setStartedAt(Date.now());
          }}
        />
      </View>
    );
  }
  if (saving) return <Loading />;
  if (result) {
    const nextLevel = Math.min(level + 1, MAX_LEVEL);
    // Free users can't open Pro levels, so don't offer a button that leads to a lock screen.
    const canPlayNext = isPro || nextLevel <= FREE_MAX_LEVEL;
    return (
      <Results
        track={track}
        level={level}
        result={result}
        review={review}
        proLocked={!canPlayNext}
        onReplay={() => {
          setResult(null);
          setReview([]);
          setStartedAt(Date.now());
          setSeed((s) => s + 1);
        }}
        onNext={
          result.passed && nextLevel !== level && canPlayNext
            ? () => router.replace({ pathname: "/lesson/[track]/[level]", params: { track, level: String(nextLevel) } })
            : undefined
        }
        onClose={onClose}
      />
    );
  }

  return (
    <View style={styles.runner}>
      <DrillRunner
        key={seed}
        questions={questions}
        coaching={coaching.enabled}
        teach
        onAnswer={() => onProgress(true)}
        onDone={finish}
        header={({ index, correct }) => (
          <DrillHeader
            left={`Question ${index + 1} of ${questions.length} · ${correct} correct`}
            right={
              <Row gap={8}>
                {index === 0 && correct === 0 && (
                  <Pressable onPress={() => setLearning(true)} hitSlop={8} accessibilityLabel="See the trick">
                    <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold }}>
                      The trick
                    </Txt>
                  </Pressable>
                )}
                <CoachingToggle enabled={coaching.enabled} onToggle={coaching.toggle} />
              </Row>
            }
          />
        )}
      />
    </View>
  );
}

function Results({
  track,
  level,
  result,
  review,
  onReplay,
  onNext,
  onClose,
  proLocked,
}: {
  track: SkillTrack;
  level: number;
  result: Result;
  proLocked?: boolean;
  review: DrillAnswer[];
  onReplay: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const accuracy = Math.round((result.correct / result.total) * 100);
  const avgSec = result.durationMs / result.total / 1000;
  const avg = avgSec.toFixed(1);
  const info = levelSummary(track, level);
  const stars = starsFor(track, level, result.passed, avgSec);
  const nextInfo = level < MAX_LEVEL ? levelSummary(track, level + 1) : null;
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <Txt style={{ fontSize: 56 }}>{result.passed ? "🎉" : "💪"}</Txt>
        <Txt variant="title" center style={{ marginTop: 8 }}>
          {result.passed ? `${info.name}: passed!` : "Not quite. Try again."}
        </Txt>
        {result.passed && (
          <View style={{ marginTop: 10, alignItems: "center", gap: 6 }}>
            <Stars count={stars} size={30} />
            <Muted variant="caption" center>
              {stars === 3
                ? `Under ${info.targetSec}s per question. Full marks for speed.`
                : `${avg}s per question. Beat ${stars === 2 ? info.targetSec : Math.round(info.targetSec * 1.5 * 10) / 10}s for ${stars + 1} stars.`}
            </Muted>
          </View>
        )}
        <Muted center style={{ marginTop: 6 }}>
          {result.passed
            ? level >= MAX_LEVEL
              ? "You've finished this track."
              : proLocked
                ? `Levels ${level + 1}–10 come with Pro. Try it free for 3 days.`
                : `Unlocked: Level ${level + 1}, ${nextInfo?.name ?? ""}.`
            : `You need ${Math.round(PASS_THRESHOLD * 100)}% to advance.`}
        </Muted>
      </View>

      {!result.passed && (
        <View style={{ backgroundColor: colors.amberSoft, borderRadius: radius.md, padding: 14 }}>
          <Txt variant="caption" color={colors.amberText} style={{ fontSize: 14, lineHeight: 20 }}>
            Speed comes with reps. Every lesson you finish makes the next one easier.
          </Txt>
        </View>
      )}

      {result.passed && (
        <View style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: 14, flexDirection: "row", gap: 10 }}>
          <Ionicons name="ribbon-outline" size={20} color={colors.success} />
          <Txt style={{ flex: 1, fontSize: 15, lineHeight: 21 }}>
            <Txt style={{ fontFamily: fonts.semibold, fontSize: 15 }}>New skill: </Txt>
            {info.outcome}
          </Txt>
        </View>
      )}

      <Row gap={10}>
        <StatBox label="Accuracy" value={`${accuracy}%`} />
        <StatBox label="Avg time" value={`${avg}s`} />
        <StatBox label="XP" value={`+${result.xpEarned}`} accent />
      </Row>

      <Button
        title="Share result"
        icon="share-outline"
        variant="secondary"
        onPress={() =>
          shareText(
            `I just passed "${info.name}" (${TRACK_LABELS[track]} Level ${level}) in Rapid Math: ${accuracy}% at ${avg}s per answer. 🧠⚡`,
          )
        }
      />

      <CoachingReview items={review} />

      <View style={{ gap: 10 }}>
        {onNext && <Button title={`Next: ${nextInfo?.name ?? `Level ${level + 1}`}`} icon="arrow-forward" onPress={onNext} />}
        {result.passed && proLocked && level < MAX_LEVEL && (
          <Button title={`Unlock Level ${level + 1} with Pro`} icon="diamond-outline" onPress={() => router.push("/pro")} />
        )}
        <Button title="Try again" variant={onNext ? "secondary" : "primary"} onPress={onReplay} />
        <Button title="Done" variant="ghost" onPress={onClose} />
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.muted, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" }}>
      <Txt style={{ fontFamily: fonts.displayBold, fontSize: 26 }} color={accent ? colors.primary : colors.foreground}>
        {value}
      </Txt>
      <Muted variant="caption" style={{ marginTop: 2 }}>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  runner: { flex: 1, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 4 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
});
