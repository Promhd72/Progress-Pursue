import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { BadgeIcon, useBadges } from "@/components/Badges";
import { Button, Card, Loading, Muted, ProgressBar, Txt } from "@/components/ui";
import { BADGE_GROUPS, BADGES, type Badge } from "@/lib/badges";
import { keyHaptic } from "@/lib/native";
import { colors, fonts } from "@/theme";

/** Every badge: earned ones in colour, locked ones show how to earn them. */
export default function BadgesScreen() {
  const { ready, earned } = useBadges();
  const [open, setOpen] = useState<Badge | null>(null);
  if (!ready) return <Loading />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={{ gap: 10 }}>
        <Txt variant="heading">
          {earned.size} of {BADGES.length} badges
        </Txt>
        <ProgressBar value={earned.size / BADGES.length} />
        <Muted variant="caption">Pass levels, beat time targets, keep your streak and solve scenarios to unlock them. Tap any badge to see how.</Muted>
      </Card>

      <Modal transparent animationType="fade" visible={!!open} onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)}>
          {open && (
            <View style={styles.sheet}>
              <BadgeIcon badge={open} earned={earned.has(open.id)} size={88} />
              <Txt variant="heading" center style={{ marginTop: 14 }}>
                {open.name}
              </Txt>
              <Muted center style={{ marginTop: 6 }}>
                {earned.has(open.id) ? `Earned. ${open.cheer}` : `How to earn it: ${open.how}`}
              </Muted>
              <View style={{ alignSelf: "stretch", marginTop: 18 }}>
                <Button title="Close" variant="secondary" onPress={() => setOpen(null)} />
              </View>
            </View>
          )}
        </Pressable>
      </Modal>

      {BADGE_GROUPS.map((g) => {
        const list = BADGES.filter((b) => b.group === g);
        const got = list.filter((b) => earned.has(b.id)).length;
        return (
          <View key={g} style={{ gap: 10 }}>
            <Muted variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 0.6, marginLeft: 4 }}>
              {g.toUpperCase()} · {got}/{list.length}
            </Muted>
            <View style={styles.grid}>
              {list.map((b) => {
                const has = earned.has(b.id);
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => {
                      keyHaptic();
                      setOpen(b);
                    }}
                    style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
                  >
                    <BadgeIcon badge={b} earned={has} size={60} />
                    <Txt variant="caption" center numberOfLines={2} color={has ? colors.foreground : colors.mutedForeground} style={{ marginTop: 6, fontFamily: fonts.medium }}>
                      {b.name}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(8,23,63,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  sheet: { backgroundColor: colors.card, borderRadius: 18, padding: 24, alignItems: "center", width: "100%", maxWidth: 360 },
  cell: { width: "33.33%", alignItems: "center", paddingHorizontal: 4 },
});
