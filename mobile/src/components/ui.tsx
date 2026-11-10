import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, radius, shared } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export { Ionicons };

/* Text ----------------------------------------------------------------- */

type Variant = "hero" | "title" | "heading" | "body" | "label" | "caption" | "number";

const variantStyles: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.displayBold, fontSize: 36, lineHeight: 40, letterSpacing: -0.8 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 33, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  number: { fontFamily: fonts.displayBold, fontSize: 28, fontVariant: ["tabular-nums"] },
};

export function Txt({
  variant = "body",
  color,
  center,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string; center?: boolean }) {
  // Custom font sizes get a matching line height, so big numbers and emoji
  // never inherit the body line height and get clipped.
  const flat = StyleSheet.flatten(style) ?? {};
  const autoLineHeight =
    flat.fontSize && !flat.lineHeight ? { lineHeight: Math.round(flat.fontSize * 1.22) } : null;
  return (
    <Text
      {...rest}
      style={[
        { color: color ?? colors.foreground },
        variantStyles[variant],
        center && { textAlign: "center" },
        style,
        autoLineHeight,
      ]}
    />
  );
}

export const Muted = (props: TextProps & { variant?: Variant; center?: boolean }) => (
  <Txt color={colors.mutedForeground} {...props} />
);

/* Buttons -------------------------------------------------------------- */

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "white";
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
    secondary: { bg: colors.card, fg: colors.foreground, border: colors.border },
    ghost: { bg: "transparent", fg: colors.primary, border: "transparent" },
    danger: { bg: colors.card, fg: colors.destructive, border: colors.destructive },
    white: { bg: colors.white, fg: colors.primary, border: colors.white },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      onPress={() => {
        keyHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === "ghost" && { paddingVertical: 12 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        off && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={shared.row}>
          <Txt variant="label" color={palette.fg} style={{ fontSize: 17 }}>
            {title}
          </Txt>
          {icon && <Ionicons name={icon} size={18} color={palette.fg} style={{ marginLeft: 8 }} />}
        </View>
      )}
    </Pressable>
  );
}

/* Cards ---------------------------------------------------------------- */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[shared.card, style]}>{children}</View>;
}

export function ChoiceCard({
  selected,
  onPress,
  emoji,
  title,
  subtitle,
  right,
}: {
  selected: boolean;
  onPress: () => void;
  emoji?: string;
  title: string;
  subtitle?: string;
  right?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        keyHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.choice,
        selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
    >
      {emoji ? <Text style={{ fontSize: 26, marginRight: 14 }}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Txt variant="label">{title}</Txt>
        {subtitle ? <Muted variant="caption" style={{ marginTop: 2, fontSize: 14 }}>{subtitle}</Muted> : null}
      </View>
      {right ? (
        <Muted variant="label" style={{ fontVariant: ["tabular-nums"] }}>
          {right}
        </Muted>
      ) : (
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
        </View>
      )}
    </Pressable>
  );
}

export function IconBadge({
  name,
  color = colors.primary,
  bg = colors.primarySoft,
  size = 52,
}: {
  name: IconName;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function Pill({ label, color = colors.primary, bg = colors.primarySoft }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Txt variant="caption" color={color} style={{ fontFamily: fonts.semibold, fontSize: 12 }}>
        {label}
      </Txt>
    </View>
  );
}

/* Progress ------------------------------------------------------------- */

export function ProgressBar({ value, color = colors.primary, height = 8 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.muted, overflow: "hidden" }}>
      <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Ring({
  value,
  size = 84,
  stroke = 9,
  color = colors.white,
  track = "rgba(255,255,255,0.28)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct)}
        />
      </Svg>
      {children}
    </View>
  );
}

/* Layout helpers ------------------------------------------------------- */

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[shared.row, { gap }, style]}>{children}</View>;
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <Muted variant="caption" style={{ fontSize: 15 }}>{label}</Muted>
      <Txt variant="label" style={{ flexShrink: 1, textAlign: "right" }}>{value}</Txt>
    </Row>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
      <IconBadge name="cloud-offline-outline" color={colors.destructive} bg={colors.destructiveSoft} />
      <Txt variant="heading" center>Couldn't load</Txt>
      <Muted center>{message}</Muted>
      {onRetry && <Button title="Try again" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
});
