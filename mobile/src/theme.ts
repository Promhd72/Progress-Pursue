import { StyleSheet } from "react-native";

/** Rapid Math palette: deep ink, electric blue, warm highlights. */
export const colors = {
  background: "#f4f6fb",
  foreground: "#0b1437",
  card: "#ffffff",
  muted: "#e9eef6",
  mutedForeground: "#566279",
  // Blues and status colours meet WCAG AA (4.5:1) for text on white and on their tints.
  primary: "#1866d8",
  primaryDark: "#1253b8",
  primaryDeep: "#0f2c8a",
  primarySoft: "#e8f1ff",
  accent: "#cfe4ff",
  ink: "#0b1437",
  inkSoft: "#1b2a6b",
  gold: "#f6b93b",
  goldSoft: "#fff4d9",
  destructive: "#d92d36",
  destructiveSoft: "#fdecee",
  success: "#15803d",
  successSoft: "#e2f6ec",
  warm: "#ea580c",
  warmText: "#c2410c",
  warmSoft: "#fff0e3",
  amberSoft: "#fef5e1",
  amberText: "#8a530a",
  border: "#e1e7f0",
  white: "#ffffff",
};

/** Hero gradients (top-left to bottom-right). */
export const gradients = {
  primary: ["#0f2c8a", "#1866d8", "#1f6fe5"],
  ink: ["#0b1437", "#1b2a6b", "#2a4bb8"],
  warm: ["#ea580c", "#f97316"],
} as const;

/** Each skill has its own colour so tracks are easy to tell apart at a glance. */
export const trackColors: Record<string, { fg: string; bg: string }> = {
  addition: { fg: "#1866d8", bg: "#e8f1ff" },
  subtraction: { fg: "#6d4ef0", bg: "#efebff" },
  multiplication: { fg: "#ea580c", bg: "#fff0e3" },
  division: { fg: "#0b8a86", bg: "#dff6f4" },
  percentage: { fg: "#d0347c", bg: "#fde8f2" },
};

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  display: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

export const space = (n: number) => n * 4;

/** Soft, layered elevation for cards. */
export const elevation = {
  shadowColor: "#1b2a6b",
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

export const shared = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#edf1f7",
    padding: 16,
    ...elevation,
  },
  row: { flexDirection: "row", alignItems: "center" },
});
