import { StyleSheet } from "react-native";

/** Rapid Math palette: deep ink, electric blue, warm highlights. */
export const colors = {
  background: "#f4f6fb",
  foreground: "#0b1437",
  card: "#ffffff",
  muted: "#e9eef6",
  mutedForeground: "#566279",
  primary: "#2584f5",
  primaryDark: "#1566d6",
  primaryDeep: "#1238a8",
  primarySoft: "#e8f1ff",
  accent: "#cfe4ff",
  ink: "#0b1437",
  inkSoft: "#1b2a6b",
  gold: "#f6b93b",
  goldSoft: "#fff4d9",
  destructive: "#e5343d",
  destructiveSoft: "#fdecee",
  success: "#1faa66",
  successSoft: "#e2f6ec",
  warm: "#f97316",
  warmSoft: "#fff0e3",
  amberSoft: "#fef5e1",
  amberText: "#8a530a",
  border: "#e1e7f0",
  white: "#ffffff",
};

/** Hero gradients (top-left to bottom-right). */
export const gradients = {
  primary: ["#1238a8", "#2584f5", "#38b6ff"],
  ink: ["#0b1437", "#1b2a6b", "#2a4bb8"],
  warm: ["#f97316", "#fb9a3c"],
} as const;

/** Each skill has its own colour so tracks are easy to tell apart at a glance. */
export const trackColors: Record<string, { fg: string; bg: string }> = {
  addition: { fg: "#2584f5", bg: "#e8f1ff" },
  subtraction: { fg: "#7c5cfc", bg: "#efebff" },
  multiplication: { fg: "#f97316", bg: "#fff0e3" },
  division: { fg: "#0ea5a0", bg: "#dff6f4" },
  percentage: { fg: "#e0468f", bg: "#fde8f2" },
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
