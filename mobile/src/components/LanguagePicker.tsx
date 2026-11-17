import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons, Txt } from "@/components/ui";
import { LANGS, setLang, useLang } from "@/lib/i18n";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

/** Compact EN | ID switch, for the welcome screen. */
export function LanguageToggle() {
  const lang = useLang();
  return (
    <View style={styles.toggle} accessibilityRole="radiogroup" accessibilityLabel="Language">
      <Ionicons name="globe-outline" size={15} color={colors.mutedForeground} style={{ marginHorizontal: 6 }} />
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={l.label}
            hitSlop={6}
            onPress={() => {
              keyHaptic();
              setLang(l.id);
            }}
            style={[styles.seg, on && styles.segOn]}
          >
            <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }} color={on ? colors.white : colors.mutedForeground}>
              {l.short}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Full list of languages, for Profile. */
export function LanguageList() {
  const lang = useLang();
  return (
    <View>
      {LANGS.map((l, i) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              keyHaptic();
              setLang(l.id);
            }}
            style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && { backgroundColor: colors.muted }]}
          >
            <Txt style={{ fontSize: 20, marginRight: 12 }}>{l.id === "id" ? "🇮🇩" : "🌐"}</Txt>
            <Txt variant="label" style={{ flex: 1 }}>
              {l.label}
            </Txt>
            {on ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seg: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  segOn: { backgroundColor: colors.primary },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, minHeight: 52, paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginLeft: 0 },
});
