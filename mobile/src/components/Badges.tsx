import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, View } from "react-native";
import { getAdvancedProgress } from "@/lib/backend";
import { badgeById, earnedBadges, markBadgesSeen, seenBadges, type Badge, type BadgeData } from "@/lib/badges";
import { finishHaptic } from "@/lib/native";
import { useLevelStats, useOverview, useProfile } from "@/lib/queries";
import { learnedTechniques } from "@/lib/techniques";
import { colors, fonts, radius } from "@/theme";
import { Button, Ionicons, Muted, Txt } from "./ui";

/** All the data badges are computed from, plus the earned set. */
export function useBadges() {
  const profileQ = useProfile();
  const overviewQ = useOverview();
  const statsQ = useLevelStats();
  const advancedQ = useQuery({ queryKey: ["advanced-progress"], queryFn: () => getAdvancedProgress() });
  const learnedQ = useQuery({ queryKey: ["learned-techniques"], queryFn: () => learnedTechniques().size });

  const ready = profileQ.isSuccess && overviewQ.isSuccess && statsQ.isSuccess && advancedQ.isSuccess && learnedQ.isSuccess;
  const data: BadgeData = {
    profile: profileQ.data ?? undefined,
    overview: overviewQ.data,
    stats: statsQ.data,
    advanced: advancedQ.data,
    learned: learnedQ.data,
  };
  const earned = useMemo(
    () => (ready ? earnedBadges(data) : new Set<string>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, profileQ.data, overviewQ.data, statsQ.data, advancedQ.data, learnedQ.data],
  );
  return { ready, earned };
}

export function BadgeIcon({ badge, earned, size = 64 }: { badge: Badge; earned: boolean; size?: number }) {
  const color = earned ? badge.color : colors.mutedForeground;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: earned ? `${badge.color}22` : colors.muted,
        borderWidth: Math.max(2, size / 22),
        borderColor: earned ? badge.color : colors.border,
      }}
    >
      <Ionicons name={badge.icon} size={size * 0.46} color={color} style={earned ? undefined : { opacity: 0.45 }} />
    </View>
  );
}

/** Watches progress and celebrates each newly earned badge. Mount once inside the signed-in app. */
export function BadgeWatcher() {
  const { ready, earned } = useBadges();
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    if (!ready) return;
    const seen = seenBadges();
    if (seen === null) {
      // First run on this device: don't celebrate everything at once.
      markBadgesSeen(earned);
      return;
    }
    const fresh = [...earned].filter((id) => !seen.has(id));
    if (fresh.length > 0) {
      markBadgesSeen(fresh);
      setQueue((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
    }
  }, [ready, earned]);

  const current = queue[0] ? badgeById(queue[0]) : undefined;
  if (!current) return null;
  return <Celebration badge={current} more={queue.length - 1} onClose={() => setQueue((q) => q.slice(1))} />;
}

function Celebration({ badge, more, onClose }: { badge: Badge; more: number; onClose: () => void }) {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.3)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    finishHaptic();
    scale.setValue(0.3);
    burst.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(burst, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })),
    ]).start();
  }, [badge.id, scale, spin, burst]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const dots = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Txt variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 1.2 }} color={badge.color}>
            BADGE UNLOCKED
          </Txt>
          <View style={styles.stage}>
            <Animated.View style={[styles.rays, { transform: [{ rotate }] }]}>
              {Array.from({ length: 8 }, (_, i) => (
                <View key={i} style={[styles.ray, { backgroundColor: `${badge.color}22`, transform: [{ rotate: `${i * 22.5}deg` }] }]} />
              ))}
            </Animated.View>
            {dots.map((a, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? badge.color : "#f5a524",
                    opacity: burst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * 95] }) },
                      { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * 95] }) },
                    ],
                  },
                ]}
              />
            ))}
            <Animated.View style={{ transform: [{ scale }] }}>
              <BadgeIcon badge={badge} earned size={110} />
            </Animated.View>
          </View>
          <Txt variant="title" center>
            {badge.name}
          </Txt>
          <Muted center style={{ marginTop: 6 }}>
            {badge.cheer}
          </Muted>
          <View style={{ alignSelf: "stretch", marginTop: 22, gap: 4 }}>
            <Button title={more > 0 ? `Nice! (${more} more)` : "Nice!"} onPress={onClose} />
            <Button
              title="See all badges"
              variant="ghost"
              onPress={() => {
                onClose();
                router.push("/badges");
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(8,23,63,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 24, alignItems: "center", width: "100%", maxWidth: 380 },
  stage: { width: 220, height: 200, alignItems: "center", justifyContent: "center" },
  rays: { position: "absolute", width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  ray: { position: "absolute", width: 26, height: 220, borderRadius: 13 },
  dot: { position: "absolute", width: 9, height: 9, borderRadius: 5 },
});
