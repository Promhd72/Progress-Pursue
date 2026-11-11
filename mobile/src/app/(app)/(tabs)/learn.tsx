import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, Ionicons, Muted, ProgressBar, Row, Txt } from "@/components/ui";
import { TRACK_LABELS, TRACK_SYMBOL, TRACKS } from "@/lib/curriculum";
import { keyHaptic } from "@/lib/native";
import { TECHNIQUES, learnedTechniques } from "@/lib/techniques";
import { colors, fonts } from "@/theme";

/** The technique library: the theory behind every skill, before (or alongside) practice. */
export default function Learn() {
  const router = useRouter();
  const [learned, setLearned] = useState<Set<string>>(() => learnedTechniques());
  useFocusEffect(useCallback(() => setLearned(learnedTechniques()), []));
  const done = TECHNIQUES.filter((t) => learned.has(t.id)).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Txt variant="title">Mental math techniques</Txt>
        <Muted style={{ marginTop: 4 }}>
          The tricks fast thinkers use. Learn how each one works, try it on a few questions, then practise it in the levels.
        </Muted>
      </View>

      <Pressable
        onPress={() => {
          keyHaptic();
          router.push("/science");
        }}
        style={({ pressed }) => [styles.science, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="flask-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Txt variant="label">Why these five skills?</Txt>
          <Muted variant="caption">The research behind Rapid Math</Muted>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </Pressable>

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt variant="label">
            {done} of {TECHNIQUES.length} techniques learned
          </Txt>
          <Ionicons name="library-outline" size={18} color={colors.primary} />
        </Row>
        <ProgressBar value={done / TECHNIQUES.length} />
      </Card>

      {TRACKS.map((track) => (
        <View key={track} style={{ gap: 10 }}>
          <Row gap={10}>
            <View style={styles.symbol}>
              <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18 }} color={colors.primary}>
                {TRACK_SYMBOL[track]}
              </Txt>
            </View>
            <Txt variant="heading">{TRACK_LABELS[track]}</Txt>
          </Row>
          <Card style={{ padding: 0 }}>
            {TECHNIQUES.filter((t) => t.track === track).map((t, i) => {
              const isDone = learned.has(t.id);
              return (
                <View key={t.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <Pressable
                    onPress={() => {
                      keyHaptic();
                      router.push({ pathname: "/technique/[id]", params: { id: t.id } });
                    }}
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.muted }]}
                    accessibilityLabel={`${t.name}. ${t.tagline}${isDone ? ". Learned" : ""}`}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="label">{t.name}</Txt>
                      <Muted variant="caption" style={{ fontSize: 14 }}>{t.tagline}</Muted>
                      <Muted variant="caption" style={{ fontSize: 12, marginTop: 2 }}>
                        Used in Level{t.levels.length > 1 ? "s" : ""} {t.levels.join(", ")}
                      </Muted>
                    </View>
                    {isDone ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  science: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, backgroundColor: colors.primarySoft },
  content: { padding: 16, paddingBottom: 40, gap: 18 },
  symbol: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 14 },
});

