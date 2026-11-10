import { StyleSheet } from "react-native";

/** Rapid Math palette (matches the original web design). */
export const colors = {
  background: "#fafcfe",
  foreground: "#08173f",
  card: "#ffffff",
  muted: "#e8f0f6",
  mutedForeground: "#576574",
  primary: "#2584f5",
  primaryDark: "#1d4ed8",
  primarySoft: "#e7f1fe",
  accent: "#d4ebff",
  destructive: "#e62b34",
  destructiveSoft: "#fdeced",
  success: "#32b36e",
  successSoft: "#e3f6eb",
  warm: "#f97316",
  warmSoft: "#fff1e6",
  amberSoft: "#fef6e4",
  amberText: "#92580c",
  border: "#dbe2e9",
  white: "#ffffff",
};

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  display: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const space = (n: number) => n * 4;

export const shared = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: { flexDirection: "row", alignItems: "center" },
});
