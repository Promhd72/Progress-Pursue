import { Ionicons } from "@expo/vector-icons";
import { useId, type ComponentProps, type ReactNode } from "react";
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
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, gradients, radius, shared } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export { Ionicons };

/* Text ----------------------------------------------------------------- */

type Variant = "hero" | "title" | "heading" | "body" | "label" | "caption" | "number";

const variantStyles: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.displayBold, fontSize: 38, lineHeight: 42, letterSpacing: -1 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 33, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.displayBold, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
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
  variant?: "primary" | "secondary" | "ghost" | "danger" | "white" | "gold";
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: colors.white, border: colors.primary, edge: colors.primaryDark },
    secondary: { bg: colors.card, fg: colors.foreground, border: colors.border, edge: "#d3dbe8" },
    ghost: { bg: "transparent", fg: colors.primary, border: "transparent", edge: "transparent" },
    danger: { bg: colors.card, fg: colors.destructive, border: "#f6c9cc", edge: "#f0b4b8" },
    white: { bg: colors.white, fg: colors.primaryDark, border: colors.white, edge: "#c5d9f7" },
    gold: { bg: colors.gold, fg: colors.ink, border: colors.gold, edge: "#d99a1c" },
  }[variant];
  const off = disabled || loading;
  const flat = variant === "ghost";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={() => {
        keyHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, borderBottomColor: palette.edge },
        flat && { paddingVertical: 12, borderBottomWidth: 1.5, minHeight: 48 },
        // Pressing "pushes" the button down onto its edge.
        pressed && !flat && { transform: [{ translateY: 2 }], borderBottomWidth: 2, marginTop: 2 },
        pressed && flat && { opacity: 0.6 },
        off && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={shared.row}>
          <Txt variant="label" color={palette.fg} style={{ fontSize: 17, fontFamily: fonts.bold, letterSpacing: 0.1 }}>
            {title}
          </Txt>
          {icon && <Ionicons name={icon} size={18} color={palette.fg} style={{ marginLeft: 8 }} />}
        </View>
      )}
    </Pressable>
  );
}

/* Gradient surfaces ---------------------------------------------------- */

/** A rounded gradient panel with soft decorative orbs. Children render on top. */
export function Gradient({
  colors: stops = gradients.primary,
  children,
  style,
  orbs = true,
}: {
  colors?: readonly string[];
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  orbs?: boolean;
}) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View style={[{ overflow: "hidden", backgroundColor: stops[1] ?? stops[0] }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {stops.map((c, i) => (
              <Stop key={i} offset={stops.length === 1 ? 0 : i / (stops.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        {orbs && (
          <>
            <Circle cx="92%" cy="6%" r="90" fill="#ffffff" fillOpacity={0.09} />
            <Circle cx="100%" cy="78%" r="60" fill="#ffffff" fillOpacity={0.07} />
            <Circle cx="4%" cy="104%" r="74" fill="#ffffff" fillOpacity={0.06} />
          </>
        )}
      </Svg>
      {children}
    </View>
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
  // Large default badges are hero moments: gradient tile, solid white icon.
  if (size >= 56 && color === colors.primary && bg === colors.primarySoft) {
    const solid = (name.endsWith("-outline") ? name.slice(0, -8) : name) as IconName;
    return (
      <Gradient
        orbs={false}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.primaryDeep,
          shadowOpacity: 0.28,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Ionicons name={solid} size={size * 0.48} color={colors.white} />
      </Gradient>
    );
  }
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

/** Small uppercase label above a group of cards. */
export function SectionLabel({ children, color = colors.mutedForeground, style }: { children: string; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Txt variant="caption" color={color} style={[{ fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.1 }, style]}>
      {children.toUpperCase()}
    </Txt>
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
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 4,
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
    borderBottomWidth: 4,
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

/** 0–3 stars for a level. */
export function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }} accessibilityLabel={`${count} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Ionicons key={i} name={i <= count ? "star" : "star-outline"} size={size} color={i <= count ? "#f5a524" : colors.border} />
      ))}
    </View>
  );
}
