import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Gradient,
  SectionLabel,
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
import { ConfidenceCard } from "@/components/Confidence";
import { getAdvancedProgress } from "@/lib/backend";
import { MEETING_SECONDS, getMeetingStats } from "@/lib/meeting";
import { FREE_MAX_LEVEL, MAX_LEVEL, TRACK_LABELS, TRACK_SYMBOL, levelSummary, type SkillTrack } from "@/lib/curriculum";
import { type TrackSpeedStat } from "@/lib/curriculum.functions";
import { getRecentLessons, getTrackSpeedStats } from "@/lib/backend";
import { rankForXp } from "@/lib/drill-engine";
import { dailyTargetFor, getOnboarding } from "@/lib/onboarding";
import { useOverview, useProfile } from "@/lib/queries";
import { colors, elevation, fonts, gradients, radius, trackColors } from "@/theme";
import { auto, tr } from "@/lib/i18n";

export default function Train() {
  const router = useRouter();
  const profileQ = useProfile();
  const overviewQ = useOverview();
  const lessonsQ = useQuery({ queryKey: ["lessons", "recent"], queryFn: () => getRecentLessons({ data: { limit: 20 } }) });
  const speedQ = useQuery({ queryKey: ["lessons", "speed"], queryFn: () => getTrackSpeedStats() });
  const advancedQ = useQuery({ queryKey: ["advanced-progress"], queryFn: () => getAdvancedProgress() });
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

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
  const rank = rankForXp(profile.xp);
  const lessons = lessonsQ.data ?? [];
  const totalCorrect = lessons.reduce((s, l) => s + l.correct, 0);
  const totalQs = lessons.reduce((s, l) => s + l.total, 0);
  const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null;
  // Free users placed or progressed past the free levels practise the top free level instead.
  const next = overview.recommended
    ? overview.isPro || overview.recommended.level <= FREE_MAX_LEVEL
      ? overview.recommended
      : { ...overview.recommended, level: FREE_MAX_LEVEL }
    : null;
  const openLesson = (track: SkillTrack, level: number) =>
    router.push({ pathname: "/lesson/[track]/[level]", params: { track, level: String(level) } });

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <SectionLabel>{greeting()}</SectionLabel>
          <Txt variant="title" numberOfLines={1} style={{ marginTop: 2 }}>
            {profile.name || "Welcome"}
          </Txt>
        </View>
        <Row gap={8}>
          <View style={styles.chip} accessibilityLabel={`${profile.current_streak}-day streak`}>
            <Ionicons name="flame" size={16} color={colors.warm} />
            <Txt style={styles.chipText} color={colors.warmText}>{profile.current_streak}</Txt>
          </View>
          {overview.isPro ? (
            <View style={[styles.chip, { backgroundColor: colors.ink }]} accessibilityLabel="Pro member">
              <Ionicons name="diamond" size={14} color={colors.gold} />
              <Txt style={styles.chipText} color={colors.white}>PRO</Txt>
            </View>
          ) : (
            <Pressable onPress={() => router.push("/pro")} hitSlop={6} style={[styles.chip, { backgroundColor: colors.goldSoft }]} accessibilityRole="button" accessibilityLabel="Try Pro">
              <Ionicons name="diamond" size={14} color="#b47a06" />
              <Txt style={styles.chipText} color="#8a5a00">Try Pro</Txt>
            </Pressable>
          )}
        </Row>
      </Row>

      <DailyGoal
        lessonsToday={overview.lessonsUsedToday}
        streak={profile.current_streak}
        onStart={next ? () => openLesson(next.track, next.level) : undefined}
      />

      <View style={styles.statRow}>
        <Stat icon="trophy" label={rank.name} value={profile.xp.toLocaleString()} sub={rank.next ? tr("{n} XP to {rank}", { n: rank.toNext, rank: auto(rank.next) }) : "Top rank"} tint={colors.primary} bg={colors.primarySoft} />
        <View style={styles.statDivider} />
        <Stat icon="locate" label="Accuracy" value={accuracy === null ? "–" : `${accuracy}%`} sub={totalQs > 0 ? "last 20 lessons" : "no lessons yet"} tint={colors.success} bg={colors.successSoft} />
        <View style={styles.statDivider} />
        <Stat
          icon="checkmark-done"
          label="Today"
          value={overview.dailyLimit === null ? `${overview.lessonsUsedToday}` : `${overview.lessonsUsedToday}/${overview.dailyLimit}`}
          sub={overview.dailyLimit === null ? "lessons done" : "free lessons"}
          tint="#7c5cfc"
          bg="#efebff"
        />
      </View>

      <MeetingCard onStart={() => router.push("/meeting")} />

      <ConfidenceCard />

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

      {!overview.isPro && overview.tracks.some((t) => t.current_level > FREE_MAX_LEVEL) && (
        <Card style={{ gap: 12, borderColor: "#f3d9a0", backgroundColor: "#fffaf0" }}>
          <Row gap={12} style={{ alignItems: "flex-start" }}>
            <IconBadge name="diamond" size={40} color="#b47a06" bg={colors.goldSoft} />
            <View style={{ flex: 1 }}>
              <Txt variant="heading">You're ready for Level {FREE_MAX_LEVEL + 1}</Txt>
              <Muted variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
                Levels {FREE_MAX_LEVEL + 1}–{MAX_LEVEL} and unlimited practice come with Pro.
              </Muted>
            </View>
          </Row>
          <Button title="Upgrade to Pro" onPress={() => router.push("/pro")} />
        </Card>
      )}

      <SpeedByTrack stats={speedQ.data ?? []} />

      <View style={{ gap: 12 }}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Txt variant="heading">Fundamentals</Txt>
            <Muted variant="caption" style={{ marginTop: 2 }}>
              {MAX_LEVEL} levels per track · score 80% to unlock the next
            </Muted>
          </View>
          <Pressable onPress={() => router.push("/curriculum")} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Txt variant="label" color={colors.primary} style={{ fontSize: 14 }}>Full curriculum</Txt>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </Row>
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
          <Txt variant="heading">Real-life scenarios</Txt>
          <Muted variant="caption" style={{ marginTop: 2 }}>
            {advancedQ.data
              ? `${advancedQ.data.overall.mastered} of ${advancedQ.data.overall.total} solved · everyday and work maths`
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
                  {p && p.attempts > 0 ? `${p.mastered} of ${p.total} solved` : `${p?.total ?? 0} scenarios`}
                </Muted>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function MeetingCard({ onStart }: { onStart: () => void }) {
  const { data: stats } = useQuery({ queryKey: ["meeting-stats"], queryFn: () => getMeetingStats() });
  return (
    <Gradient colors={gradients.ink} style={styles.meeting}>
      <Row gap={12} style={{ alignItems: "flex-start" }}>
        <View style={styles.meetingIcon}>
          <Ionicons name="chatbubbles" size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Row gap={8}>
            <Txt variant="heading" color={colors.white}>Meeting warm-up</Txt>
            <View style={styles.meetingTag}>
              <Txt style={{ fontFamily: fonts.bold, fontSize: 11 }} color={colors.gold}>{MEETING_SECONDS}s</Txt>
            </View>
          </Row>
          <Txt variant="caption" color="rgba(255,255,255,0.92)" style={{ fontSize: 14, lineHeight: 20, marginTop: 4 }}>
            Numbers the way they come up at work and on the go. Great right before a call.
          </Txt>
          {stats && stats.rounds > 0 ? (
            <Txt variant="caption" color={colors.gold} style={{ marginTop: 6, fontFamily: fonts.semibold }}>
              Your best: {stats.best} correct
            </Txt>
          ) : null}
        </View>
      </Row>
      <Button title="Start warm-up" icon="play" variant="gold" onPress={onStart} style={{ marginTop: 14 }} />
    </Gradient>
  );
}

function DailyGoal({ lessonsToday, streak, onStart }: { lessonsToday: number; streak: number; onStart?: () => void }) {
  const target = dailyTargetFor(getOnboarding().dailyTarget);
  const done = Math.min(lessonsToday, target.lessons);
  const complete = lessonsToday >= target.lessons;
  return (
    <Gradient style={styles.goal}>
      <Row gap={18}>
        <Ring value={done / target.lessons}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20 }} color={colors.white}>
            {complete ? "✓" : `${done}/${target.lessons}`}
          </Txt>
        </Ring>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="rgba(255,255,255,0.92)" style={{ fontFamily: fonts.semibold, letterSpacing: 0.8 }}>
            TODAY'S GOAL
          </Txt>
          <Txt variant="heading" color={colors.white} style={{ marginTop: 4, fontSize: 20, lineHeight: 25 }}>
            {complete
              ? "Goal done. See you tomorrow!"
              : lessonsToday === 0
                ? `${target.minutes} minutes keeps the streak alive`
                : `${target.lessons - lessonsToday} more to hit your goal`}
          </Txt>
          <Txt variant="caption" color="rgba(255,255,255,0.92)" style={{ marginTop: 4 }}>
            {streak > 0 ? `${streak}-day streak. Keep it going.` : "Start your streak today"}
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
    </Gradient>
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
    <View style={styles.stat}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Txt variant="number" numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 8, fontSize: 22 }}>{value}</Txt>
      <Txt variant="caption" numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Txt>
      <Muted variant="caption" numberOfLines={2} style={{ fontSize: 11, lineHeight: 14 }}>{sub}</Muted>
    </View>
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
  // Free users past the free levels keep practising the top free level, so there's never a dead end.
  const playLevel = Math.min(currentLevel, isPro ? MAX_LEVEL : FREE_MAX_LEVEL);
  const capped = !isPro && currentLevel > FREE_MAX_LEVEL;
  const tc = trackColors[track];
  return (
    <Card style={{ gap: 12 }}>
      <Row gap={12}>
        <View style={[styles.symbol, { backgroundColor: tc.bg }]}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 22 }} color={tc.fg}>
            {TRACK_SYMBOL[track]}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="label" style={{ fontSize: 17 }}>{TRACK_LABELS[track]}</Txt>
          <Muted variant="caption" numberOfLines={1}>
            {capped
              ? tr("Practising L{a}: {name} · L{b} needs Pro", { a: playLevel, name: auto(levelSummary(track, playLevel).name), b: currentLevel })
              : tr("Next: L{n}, {name}", { n: currentLevel, name: auto(levelSummary(track, currentLevel).name) })}
          </Muted>
          <Muted variant="caption" style={{ fontSize: 12 }}>
            {highestPassed}/{MAX_LEVEL} passed
          </Muted>
        </View>
        <Pressable
          onPress={onPlay}
          style={({ pressed }) => [styles.play, { backgroundColor: tc.fg }, pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] }]}
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
                passed && { backgroundColor: tc.fg },
                current && !passed && { backgroundColor: tc.bg, borderColor: tc.fg, borderWidth: 1.5 },
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
  if (values.length < 2 || values.some((v) => !Number.isFinite(v))) return <View style={{ height: h, justifyContent: "center" }}><ProgressBar value={0} height={2} /></View>;
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

/** Time-of-day greeting. */
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 18 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.warmSoft,
  },
  chipText: { fontFamily: fonts.bold, fontSize: 14 },
  goal: {
    borderRadius: radius.xl,
    padding: 20,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  statRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#edf1f7",
    ...elevation,
  },
  stat: { flex: 1, paddingHorizontal: 14 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  meeting: { borderRadius: radius.xl, padding: 18 },
  meetingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  meetingTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: "rgba(246,185,59,0.18)" },
  symbol: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    borderWidth: 1,
    borderColor: "#edf1f7",
    padding: 14,
  },
});
