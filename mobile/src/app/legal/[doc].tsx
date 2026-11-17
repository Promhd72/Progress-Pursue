import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Ionicons, Muted, Txt } from "@/components/ui";
import { APPLE_EULA_URL, LEGAL, LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";
import { colors } from "@/theme";

/** Privacy Policy and Terms of Use, readable without leaving the app. */
export default function LegalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doc: string }>();
  const key: LegalDoc = params.doc === "terms" ? "terms" : "privacy";
  const doc = LEGAL[key];
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.bar}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={28} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Txt variant="title" accessibilityRole="header">{doc.title}</Txt>
        <Muted variant="caption" style={{ marginTop: 4 }}>Last updated: {LEGAL_UPDATED}</Muted>
        <Txt style={{ marginTop: 14 }}>{doc.intro}</Txt>
        {doc.sections.map((s) => (
          <View key={s.heading} style={{ marginTop: 22, gap: 8 }}>
            <Txt variant="heading" accessibilityRole="header">{s.heading}</Txt>
            {s.bullets?.map((b) => (
              <View key={b} style={{ flexDirection: "row", gap: 10 }}>
                <View style={styles.dot} />
                <Txt style={{ flex: 1 }} color={colors.mutedForeground}>{b}</Txt>
              </View>
            ))}
            {s.body ? <Txt color={colors.mutedForeground}>{s.body}</Txt> : null}
          </View>
        ))}
        {key === "terms" ? (
          <Button
            title="Apple's standard EULA"
            icon="open-outline"
            variant="secondary"
            onPress={() => void Linking.openURL(APPLE_EULA_URL)}
            style={{ marginTop: 26 }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { height: 52, justifyContent: "center", paddingHorizontal: 16 },
  content: { paddingHorizontal: 22, paddingBottom: 40 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 9 },
});
