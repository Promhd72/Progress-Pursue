import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons, Txt } from "@/components/ui";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** On-screen number pad for drills: keeps the question visible, feels like a game pad. */
export function NumericKeypad({
  onDigit,
  onBackspace,
  onSubmit,
  disabled,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const press = (fn: () => void) => () => {
    if (disabled) return;
    keyHaptic();
    fn();
  };

  return (
    <View style={styles.grid} accessibilityLabel="Number pad">
      {KEYS.map((d) => (
        <Key key={d} onPress={press(() => onDigit(d))} disabled={disabled} label={d} />
      ))}
      <Pressable
        accessibilityLabel="Delete"
        onPress={press(onBackspace)}
        disabled={disabled}
        style={({ pressed }) => [styles.key, styles.ghost, pressed && styles.pressed]}
      >
        <Ionicons name="backspace-outline" size={28} color={colors.mutedForeground} />
      </Pressable>
      <Key onPress={press(() => onDigit("0"))} disabled={disabled} label="0" />
      <Pressable
        accessibilityLabel="Submit answer"
        onPress={press(onSubmit)}
        disabled={disabled}
        style={({ pressed }) => [styles.key, styles.submit, pressed && styles.pressed, disabled && styles.off]}
      >
        <Ionicons name="checkmark" size={32} color={colors.white} />
      </Pressable>
    </View>
  );
}

function Key({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.key, pressed && styles.pressed, disabled && styles.off]}
    >
      <Txt style={{ fontFamily: fonts.display, fontSize: 28 }}>{label}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  key: {
    width: "31.5%",
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: { backgroundColor: "transparent" },
  submit: { backgroundColor: colors.primary },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.85 },
  off: { opacity: 0.45 },
});
