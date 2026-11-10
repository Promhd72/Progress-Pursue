import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import {
  Button,
  Card,
  ErrorState,
  IconBadge,
  Ionicons,
  Loading,
  Muted,
  ProgressBar,
  Ring,
  Row,
  Txt,
  type IconName,
} from "@/components/ui";
import {
  ADVANCED_DOMAINS,
  ADVANCED_DOMAIN_BLURBS,
  ADVANCED_DOMAIN_LABELS,
  ADVANCED_DOMAIN_SYMBOL,
} from "@/lib/advanced-domains";
import { getAdvancedProgress } from "@/lib/backend";
import { FREE_MAX_LEVEL, MAX_LEVEL, TRACK_LABELS, TRACK_SYMBOL, type SkillTrack } from "@/lib/curriculum";
import { type TrackSpeedStat } from "@/lib/curriculum.functions";
import { getRecentLessons, getTrackSpeedStats } from "@/lib/backend";
import { levelForXp } from "@/lib/drill-engine";
import { dailyTargetFor, getOnboarding } from "@/lib/onboarding";
import { useOverview, useProfile } from "@/lib/queries";
import { colors, fonts, radius } from "@/theme";

export default function Train() {
  const router = useRouter();
  const profileQ = useProfile();
  const overviewQ = useOverview();
  const lessonsQ = useQuery({ queryKey: ["lessons", "recent"], queryFn: () => getRecentLessons({ data: { limit: 20 } }) });
  const speedQ = useQuery({ queryKey: ["lessons", "speed"], queryFn: () => getTrackSpeedStats() });
  const advancedQ = useQuery({ queryKey: ["advanced-progress"], queryFn: () => getAdvancedProgress() });
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([profileQ.refetch(), overviewQ.refetch(), lessonsQ.refetch(), speedQ.refetch(), advancedQ.refetch()]);
    setRefreshing(false);
  }

  if (profileQ.isLoading || overviewQ.isLoading) return <Loading />;
  if (profileQ.error || overviewQ.error || !profileQ.data || !overviewQ.data) {
    return <ErrorState message="Check your connection and try again." onRetry={refresh} />;
  }

  const profile = profileQ.data;
  const overview = overviewQ.data;
  const lvl = levelForXp(profile.xp);
  const lessons = lessonsQ.data ?? [];
  const totalCorrect = lessons.reduce((s, l) => s + l.correct, 0);
  const totalQs = lessons.reduce((s, l) => s + l.total, 0);
  const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null;
  const next =
    overview.recommended && (overview.isPro || overview.recommended.level <= FREE_MAX_LEVEL)
      ? overview.recommended
      : null;
  const openLesson = (track: SkillTrack, level: number) =>
    router.push({ pathname: "/lesson/[track]/[level]", params: { track, level: String(level) } });

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <View>
        <Txt variant="title">Hi {profile.name || "there"} 👋</Txt>
        <Muted style={{ marginTop: 4 }}>
          {profile.current_streak > 0
            ? `You're on a ${profile.current_streak}-day streak. Keep it going.`
            : "Pick a track and start your next lesson."}
        </Muted>
      </View>

      <DailyGoal
        lessonsToday={overview.lessonsUsedToday}
        streak={profile.current_streak}
        onStart={next ? () => openLesson(next.track, next.level) : undefined}
      />

      <View style={styles.grid}>
        <Stat icon="trophy-outline" label={`Level ${lvl.level}`} value={`${profile.xp.toLocaleString()} XP`} sub={`${lvl.toNext} XP to L${lvl.level + 1}`} tint={colors.primary} bg={colors.primarySoft} />
        <Stat icon="flame-outline" label="Streak" value={`${profile.current_streak}`} sub={`days · best ${profile.longest_streak}`} tint={colors.warm} bg={colors.warmSoft} />
        <Stat icon="locate-outline" label="Accuracy" value={accuracy === null ? "–" : `${accuracy}%`} sub={totalQs > 0 ? "last 20 lessons" : "run a lesson first"} />
        <Stat
          icon="checkmark-circle-outline"
          label="Today"
          value={overview.dailyLimit === null ? `${overview.lessonsUsedToday}` : `${overview.lessonsUsedToday}/${overview.dailyLimit}`}
          sub={overview.dailyLimit === null ? "lessons" : "free lessons used"}
        />
      </View>

      {!overview.hasPlacement && (
        <Card style={{ borderStyle: "dashed", borderColor: colors.primary, backgroundColor: colors.primarySoft, gap: 12 }}>
          <Row gap={12} style={{ alignItems: "flex-start" }}>
            <IconBadge name="sparkles-outline" size={40} bg={colors.white} />
            <View style={{ flex: 1 }}>
              <Txt variant="heading">Not sure where to start?</Txt>
              <Muted variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
                A 2-minute placement test sets a starting level on each track.
              </Muted>
            </View>
          </Row>
          <Button title="Take the placement test" onPress={() => router.push("/placement")} />
        </Card>
      )}

      <SpeedByTrack stats={speedQ.data ?? []} />

      <View style={{ gap: 12 }}>
        <View>
          <Txt variant="heading">Fundamentals</Txt>
          <Muted variant="caption" style={{ marginTop: 2 }}>
            {MAX_LEVEL} levels per track · score 80% to unlock the next
          </Muted>
        </View>
        {overview.tracks.map((t) => (
          <TrackCard
            key={t.track}
            track={t.track}
            currentLevel={t.current_level}
            highestPassed={t.highest_level_passed}
            isPro={overview.isPro}
            onPlay={() => openLesson(t.track, Math.min(t.current_level, overview.isPro ? MAX_LEVEL : FREE_MAX_LEVEL))}
          />
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <View>
          <Txt variant="heading">Advanced scenarios</Txt>
          <Muted variant="caption" style={{ marginTop: 2 }}>
            {advancedQ.data
              ? `${advancedQ.data.overall.mastered}/${advancedQ.data.overall.total} mastered · story questions with charts`
              : "Story questions with charts"}
          </Muted>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
          {ADVANCED_DOMAINS.map((d) => {
            const p = advancedQ.data?.byDomain[d];
            const pct = p && p.total > 0 ? p.mastered / p.total : 0;
            return (
              <Pressable
                key={d}
                onPress={() => router.push({ pathname: "/advanced", params: { domain: d } })}
                style={({ pressed }) => [styles.domain, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.symbol}>
                  <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18 }} color={colors.primary}>
                    {ADVANCED_DOMAIN_SYMBOL[d]}
                  </Txt>
                </View>
                <Txt variant="label" style={{ marginTop: 10 }}>{ADVANCED_DOMAIN_LABELS[d]}</Txt>
                <Muted variant="caption" numberOfLines={2} style={{ marginTop: 2, minHeight: 36 }}>
                  {ADVANCED_DOMAIN_BLURBS[d]}
                </Muted>
                <View style={{ marginTop: 10 }}>
                  <ProgressBar value={pct} height={6} />
                </View>
                <Muted variant="caption" style={{ marginTop: 6, fontSize: 12 }}>
                  {p && p.attempts > 0 ? `${p.mastered}/${p.total} mastered` : "Not started"}
                </Muted>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function DailyGoal({ lessonsToday, streak, onStart }: { lessonsToday: number; streak: number; onStart?: () => void }) {
  const target = dailyTargetFor(getOnboarding().dailyTarget);
  const done = Math.min(lessonsToday, target.lessons);
  const complete = lessonsToday >= target.lessons;
  return (
    <View style={styles.goal}>
      <Row gap={18}>
        <Ring value={done / target.lessons}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20 }} color={colors.white}>
            {complete ? "✓" : `${done}/${target.lessons}`}
          </Txt>
        </Ring>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="rgba(255,255,255,0.8)" style={{ fontFamily: fonts.semibold, letterSpacing: 0.8 }}>
            TODAY'S GOAL
          </Txt>
          <Txt variant="heading" color={colors.white} style={{ marginTop: 4, fontSize: 20, lineHeight: 25 }}>
            {complete
              ? "Goal smashed. See you tomorrow!"
              : lessonsToday === 0
                ? `${target.minutes} minutes keeps the streak alive`
                : `${target.lessons - lessonsToday} more to hit your goal`}
          </Txt>
          <Txt variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>
            🔥 {streak}-day streak
          </Txt>
        </View>
      </Row>
      {!complete && onStart && (
        <Button
          title={lessonsToday === 0 ? "Start today's lesson" : "Next lesson"}
          icon="arrow-forward"
          variant="white"
          onPress={onStart}
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tint = colors.mutedForeground,
  bg = colors.muted,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub: string;
  tint?: string;
  bg?: string;
}) {
  return (
    <Card style={styles.stat}>
      <Row gap={8}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
        <Muted variant="caption" style={{ fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Muted>
      </Row>
      <Txt variant="number" style={{ marginTop: 10, fontSize: 26 }}>{value}</Txt>
      <Muted variant="caption" style={{ marginTop: 2, fontSize: 12 }}>{sub}</Muted>
    </Card>
  );
}

function TrackCard({
  track,
  currentLevel,
  highestPassed,
  isPro,
  onPlay,
}: {
  track: SkillTrack;
  currentLevel: number;
  highestPassed: number;
  isPro: boolean;
  onPlay: () => void;
}) {
  // Free users past Level 2 keep practising Level 2, so there's never a dead end.
  const playLevel = Math.min(currentLevel, isPro ? MAX_LEVEL : FREE_MAX_LEVEL);
  const capped = !isPro && currentLevel > FREE_MAX_LEVEL;
  return (
    <Card style={{ gap: 12 }}>
      <Row gap={12}>
        <View style={styles.symbol}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20 }} color={colors.primary}>
            {TRACK_SYMBOL[track]}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="label" style={{ fontSize: 17 }}>{TRACK_LABELS[track]}</Txt>
          <Muted variant="caption">
            {capped ? `Practising Level ${playLevel} · Pro unlocks ${FREE_MAX_LEVEL + 1}+` : `Level ${currentLevel} · ${highestPassed}/${MAX_LEVEL} passed`}
          </Muted>
        </View>
        <Pressable
          onPress={onPlay}
          style={({ pressed }) => [styles.play, pressed && { opacity: 0.85 }]}
          accessibilityLabel={`Play ${TRACK_LABELS[track]} level ${playLevel}`}
        >
          <Ionicons name="play" size={18} color={colors.white} />
        </Pressable>
      </Row>
      <Row gap={4}>
        {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => {
          const passed = l <= highestPassed;
          const current = l === currentLevel;
          const locked = !isPro && l > FREE_MAX_LEVEL;
          return (
            <View
              key={l}
              style={[
                styles.step,
                passed && { backgroundColor: colors.primary },
                current && !passed && { backgroundColor: colors.accent, borderColor: colors.primary, borderWidth: 1.5 },
                locked && !passed && { backgroundColor: colors.muted, opacity: 0.6 },
              ]}
            />
          );
        })}
      </Row>
    </Card>
  );
}

function SpeedByTrack({ stats }: { stats: TrackSpeedStat[] }) {
  if (!stats.length) return null;
  return (
    <Card style={{ gap: 14 }}>
      <View>
        <Txt variant="heading">Speed by track</Txt>
        <Muted variant="caption" style={{ marginTop: 2 }}>Average seconds per question, over time</Muted>
      </View>
      {stats.map((s) => {
        const improved = s.deltaPct !== null && s.deltaPct > 0.03;
        return (
          <Row key={s.track} gap={12}>
            <View style={{ width: 110 }}>
              <Txt variant="label">{TRACK_LABELS[s.track]}</Txt>
              <Muted variant="caption" style={{ fontSize: 12 }}>
                {(s.overallAvgMs / 1000).toFixed(1)}s avg
              </Muted>
            </View>
            <View style={{ flex: 1 }}>
              <Sparkline values={s.trend} />
            </View>
            <Txt variant="caption" color={improved ? colors.success : colors.mutedForeground} style={{ width: 64, textAlign: "right", fontFamily: fonts.semibold }}>
              {improved && s.deltaMs !== null ? `−${(s.deltaMs / 1000).toFixed(1)}s` : s.attempts < 2 ? "new" : "steady"}
            </Txt>
          </Row>
        );
      })}
    </Card>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 120;
  const h = 28;
  if (values.length < 2) return <View style={{ height: h, justifyContent: "center" }}><ProgressBar value={0} height={2} /></View>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${3 + (1 - (v - min) / range) * (h - 6)}`).join(" ");
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Polyline points={pts} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 20 },
  goal: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: 18,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  stat: { width: "48.3%", padding: 14 },
  symbol: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  step: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.muted },
  domain: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
  },
});
