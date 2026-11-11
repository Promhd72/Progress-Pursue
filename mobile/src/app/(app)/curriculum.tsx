import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, ErrorState, Ionicons, Loading, Muted, ProgressBar, Row, Stars, Txt, type IconName } from "@/components/ui";
import { ADVANCED_DOMAINS, ADVANCED_DOMAIN_LABELS, ADVANCED_DOMAIN_SYMBOL } from "@/lib/advanced-domains";
import { getAdvancedProgress } from "@/lib/backend";
import {
  FREE_MAX_LEVEL,
  MAX_LEVEL,
  TRACK_LABELS,
  TRACK_SYMBOL,
  TRACKS,
  levelSummary,
  type SkillTrack,
} from "@/lib/curriculum";
import { keyHaptic } from "@/lib/native";
import { useLevelStats, useOverview } from "@/lib/queries";
import { colors, fonts, radius } from "@/theme";

type Status = "passed" | "next" | "open" | "locked" | "pro";

const STAGES = [
  { from: 1, to: 2, name: "Foundations", blurb: "Get comfortable with the basics." },
  { from: 3, to: 5, name: "Building speed", blurb: "Bigger numbers, same tricks, faster." },
  { from: 6, to: 8, name: "Work-ready", blurb: "The kind of numbers you meet in meetings." },
  { from: 9, to: 10, name: "Expert", blurb: "Fast, confident answers to tough sums." },
];

function statusFor(level: number, current: number, highest: number, isPro: boolean): Status {
  if (level <= highest) return "passed";
  if (!isPro && level > FREE_MAX_LEVEL) return "pro";
  if (level === current) return "next";
  if (level < current) return "open"; // skipped ahead via placement; replayable
  return "locked";
}

const STATUS_STYLE: Record<Status, { icon: IconName; color: string; bg: string; label: string }> = {
  passed: { icon: "checkmark", color: colors.white, bg: colors.success, label: "Passed" },
  next: { icon: "play", color: colors.white, bg: colors.primary, label: "Next up" },
  open: { icon: "play-outline", color: colors.primary, bg: colors.primarySoft, label: "Open" },
  locked: { icon: "lock-closed", color: colors.mutedForeground, bg: colors.muted, label: "Locked" },
  pro: { icon: "diamond-outline", color: colors.mutedForeground, bg: colors.muted, label: "Pro" },
};

/** The whole curriculum, start to finish: every track and level, and where you are. */
export default function Curriculum() {
  const router = useRouter();
  const params = useLocalSearchParams<{ track?: string }>();
  const overviewQ = useOverview();
  const statsQ = useLevelStats();
  const advancedQ = useQuery({ queryKey: ["advanced-progress"], queryFn: () => getAdvancedProgress() });
  const initial = TRACKS.includes(params.track as SkillTrack)
    ? (params.track as SkillTrack)
    : (overviewQ.data?.recommended?.track ?? "addition");
  const [selected, setSelected] = useState<SkillTrack | null>(null);
  const track = selected ?? initial;

  if (overviewQ.isLoading) return <Loading />;
  if (!overviewQ.data) return <ErrorState message="Check your connection and try again." onRetry={() => overviewQ.refetch()} />;
  const { tracks, isPro } = overviewQ.data;
  const rowFor = (t: SkillTrack) => tracks.find((r) => r.track === t) ?? { track: t, current_level: 1, highest_level_passed: 0 };
  const totalPassed = tracks.reduce((s, r) => s + r.highest_level_passed, 0);
  const total = TRACKS.length * MAX_LEVEL;
  const sel = rowFor(track);
  const stats = statsQ.data ?? {};
  const trackStars = Array.from({ length: MAX_LEVEL }, (_, i) => stats[`${track}-${i + 1}`]?.stars ?? 0).reduce((a, b) => a + b, 0);

  const play = (level: number) =>
    router.push({ pathname: "/lesson/[track]/[level]", params: { track, level: String(level) } });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Txt variant="title">The whole journey</Txt>
        <Muted style={{ marginTop: 4 }}>
          5 tracks, 10 levels each. Score 80% on a level to unlock the next one.
        </Muted>
      </View>

      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt variant="label">
            {totalPassed} of {total} levels passed
          </Txt>
          <Muted variant="caption">{Math.round((totalPassed / total) * 100)}%</Muted>
        </Row>
        <ProgressBar value={totalPassed / total} />

        {/* Map: one row per track, one dot per level */}
        <View style={{ gap: 8, marginTop: 4 }}>
          {TRACKS.map((t) => {
            const r = rowFor(t);
            const on = t === track;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  keyHaptic();
                  setSelected(t);
                }}
                style={[styles.mapRow, on && { backgroundColor: colors.primarySoft }]}
                accessibilityLabel={`${TRACK_LABELS[t]}: ${r.highest_level_passed} of ${MAX_LEVEL} passed`}
              >
                <Txt style={{ width: 22, fontFamily: fonts.displayBold, fontSize: 17 }} color={colors.primary}>
                  {TRACK_SYMBOL[t]}
                </Txt>
                <View style={{ flex: 1, flexDirection: "row", gap: 3 }}>
                  {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => {
                    const st = statusFor(l, r.current_level, r.highest_level_passed, isPro);
                    const fill =
                      st === "passed" ? colors.success : st === "next" ? colors.primary : st === "open" ? colors.accent : colors.muted;
                    return <View key={l} style={[styles.dot, { backgroundColor: fill }]} />;
                  })}
                </View>
                <Muted variant="caption" style={{ width: 38, textAlign: "right", fontSize: 12 }}>
                  {r.highest_level_passed}/{MAX_LEVEL}
                </Muted>
              </Pressable>
            );
          })}
        </View>

        <Row gap={14} style={{ flexWrap: "wrap" }}>
          <Legend color={colors.success} label="Passed" />
          <Legend color={colors.primary} label="Next up" />
          <Legend color={colors.muted} label={isPro ? "Locked" : "Locked / Pro"} />
        </Row>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {TRACKS.map((t) => {
          const on = t === track;
          return (
            <Pressable
              key={t}
              onPress={() => {
                keyHaptic();
                setSelected(t);
              }}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Txt variant="caption" color={on ? colors.white : colors.foreground} style={{ fontFamily: fonts.semibold, fontSize: 14 }}>
                {TRACK_SYMBOL[t]}  {TRACK_LABELS[t]}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 4 }}>
        <Txt variant="heading">{TRACK_LABELS[track]}</Txt>
        <Row gap={10} style={{ flexWrap: "wrap" }}>
          <Muted variant="caption">
            You're on Level {sel.current_level} · {sel.highest_level_passed}/{MAX_LEVEL} passed
          </Muted>
          <Row gap={4}>
            <Ionicons name="star" size={13} color="#f5a524" />
            <Muted variant="caption">{trackStars}/{MAX_LEVEL * 3} stars</Muted>
          </Row>
        </Row>
      </View>

      {STAGES.map((stage) => (
        <View key={stage.name} style={{ gap: 8 }}>
          <View>
            <Muted variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 0.6 }}>
              LEVELS {stage.from}–{stage.to} · {stage.name.toUpperCase()}
            </Muted>
            <Muted variant="caption" style={{ fontSize: 13 }}>{stage.blurb}</Muted>
          </View>
          <Card style={{ padding: 0 }}>
            {Array.from({ length: stage.to - stage.from + 1 }, (_, i) => stage.from + i).map((level, i) => {
              const st = statusFor(level, sel.current_level, sel.highest_level_passed, isPro);
              const s = STATUS_STYLE[st];
              const info = levelSummary(track, level);
              const playable = st === "passed" || st === "next" || st === "open";
              return (
                <View key={level}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable
                    disabled={!playable}
                    onPress={() => {
                      keyHaptic();
                      play(level);
                    }}
                    style={({ pressed }) => [styles.levelRow, pressed && { backgroundColor: colors.muted }]}
                    accessibilityLabel={`Level ${level}, ${info.name}: ${info.outcome} ${s.label}`}
                  >
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      {st === "passed" || st === "next" ? (
                        <Ionicons name={s.icon} size={16} color={s.color} />
                      ) : (
                        <Txt style={{ fontFamily: fonts.displayBold, fontSize: 15 }} color={s.color}>
                          {level}
                        </Txt>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Row style={{ justifyContent: "space-between" }}>
                        <Txt variant="label" style={{ flex: 1 }}>
                          {info.name}
                        </Txt>
                        {(stats[`${track}-${level}`]?.stars ?? 0) > 0 && <Stars count={stats[`${track}-${level}`].stars} />}
                      </Row>
                      <Muted variant="caption" style={{ fontSize: 14, lineHeight: 19 }}>{info.outcome}</Muted>
                      <Muted variant="caption" style={{ fontSize: 13, marginTop: 2 }}>
                        Level {level}
                        {"  ·  "}★★★ under {info.targetSec}s per question
                      </Muted>
                    </View>
                    {playable ? (
                      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                    ) : (
                      <Ionicons name={s.icon} size={16} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      ))}

      {!isPro && (
        <Card style={{ gap: 10, alignItems: "center" }}>
          <Muted variant="caption" center style={{ fontSize: 14 }}>
            Levels 1–{FREE_MAX_LEVEL} are free on every track. Levels {FREE_MAX_LEVEL + 1}–10 come with Pro.
          </Muted>
          <Button title="Try Pro free for 3 days" icon="diamond-outline" onPress={() => router.push("/pro")} style={{ alignSelf: "stretch" }} />
        </Card>
      )}

      <View style={{ gap: 8 }}>
        <View>
          <Txt variant="heading">Then: Real-life scenarios</Txt>
          <Muted variant="caption" style={{ marginTop: 2 }}>
            Story questions with charts and tables that use all five skills together.
          </Muted>
        </View>
        <Card style={{ padding: 0 }}>
          {ADVANCED_DOMAINS.map((d, i) => {
            const p = advancedQ.data?.byDomain[d];
            return (
              <View key={d}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  onPress={() => router.navigate({ pathname: "/advanced", params: { domain: d } })}
                  style={({ pressed }) => [styles.levelRow, pressed && { backgroundColor: colors.muted }]}
                >
                  <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                    <Txt style={{ fontFamily: fonts.displayBold, fontSize: 15 }} color={colors.primary}>
                      {ADVANCED_DOMAIN_SYMBOL[d]}
                    </Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="label">{ADVANCED_DOMAIN_LABELS[d]}</Txt>
                    <Muted variant="caption">{p ? `${p.mastered} of ${p.total} solved` : "Not started"}</Muted>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Muted variant="caption" style={{ fontSize: 12 }}>{label}</Muted>
    </Row>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 18 },
  mapRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, paddingHorizontal: 6, borderRadius: radius.sm },
  dot: { flex: 1, height: 12, borderRadius: 3 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 60 },
});
