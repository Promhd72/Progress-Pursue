import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Button, ErrorState, IconBadge, Loading, Muted, Pill, Txt } from "@/components/ui";
import { TRACK_LABELS, TRACK_SYMBOL, type SkillTrack } from "@/lib/curriculum";
import { getRecentLessons } from "@/lib/backend";
import { colors, fonts, radius } from "@/theme";

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export default function History() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["lessons", "history"], queryFn: () => getRecentLessons({ data: { limit: 200 } }) });

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorState message="Check your connection and try again." onRetry={() => q.refetch()} />;
  const rows = q.data ?? [];

  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <IconBadge name="time-outline" size={60} />
        <Txt variant="heading" center style={{ marginTop: 16 }}>No lessons yet</Txt>
        <Muted center style={{ marginTop: 6 }}>Your results will show up here after your first lesson.</Muted>
        <Button title="Start training" onPress={() => router.navigate("/train")} style={{ marginTop: 20, alignSelf: "stretch" }} />
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item, index }) => {
        const acc = Math.round((item.correct / item.total) * 100);
        const avg = (item.duration_ms / item.total / 1000).toFixed(1);
        const showDay = index === 0 || dayLabel(rows[index - 1].created_at) !== dayLabel(item.created_at);
        return (
          <View>
            {showDay && (
              <Muted variant="caption" style={{ fontFamily: fonts.semibold, marginBottom: 8, marginTop: index === 0 ? 0 : 8, letterSpacing: 0.5 }}>
                {dayLabel(item.created_at).toUpperCase()}
              </Muted>
            )}
            <View style={styles.item}>
              <View style={styles.symbol}>
                <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18 }} color={colors.primary}>
                  {TRACK_SYMBOL[item.track as SkillTrack] ?? "#"}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="label">
                  {TRACK_LABELS[item.track as SkillTrack] ?? item.track} · L{item.level}
                </Txt>
                <Muted variant="caption">
                  {item.correct}/{item.total} ({acc}%) · {avg}s avg
                </Muted>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Pill
                  label={item.passed ? "Passed" : "Try again"}
                  color={item.passed ? colors.success : colors.mutedForeground}
                  bg={item.passed ? colors.successSoft : colors.muted}
                />
                <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold }}>
                  +{item.xp_earned} XP
                </Txt>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
  },
  symbol: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});

