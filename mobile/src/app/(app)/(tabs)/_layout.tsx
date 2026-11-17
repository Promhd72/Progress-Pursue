import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useProfile } from "@/lib/queries";
import { keyHaptic } from "@/lib/native";
import { colors, fonts } from "@/theme";

function Streak() {
  const { data } = useProfile();
  if (!data || data.current_streak <= 0) return null;
  return (
    <View
      accessibilityLabel={`${data.current_streak}-day streak`}
      style={{ flexDirection: "row", alignItems: "center", marginRight: 16, height: 32, paddingHorizontal: 11, borderRadius: 16, backgroundColor: colors.warmSoft }}
    >
      <Ionicons name="flame" size={15} color={colors.warm} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.warm, marginLeft: 4 }}>
        {data.current_streak}
      </Text>
    </View>
  );
}

const icon =
  (on: React.ComponentProps<typeof Ionicons>["name"], off: React.ComponentProps<typeof Ionicons>["name"]) =>
  ({ color, focused }: { color: import("react-native").ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? on : off} size={24} color={color as string} />
  );

export default function TabLayout() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => keyHaptic() }}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
        tabBarStyle: {
          borderTopColor: "#e9eef5",
          backgroundColor: colors.card,
          // Web previews have no safe-area inset, so give the labels room.
          ...(Platform.OS === "web" ? { height: 64, paddingBottom: 8 } : null),
        },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitleStyle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.foreground },
        headerRight: () => <Streak />,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="train" options={{ title: "Train", headerShown: false, tabBarIcon: icon("school", "school-outline") }} />
      <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: icon("library", "library-outline") }} />
      <Tabs.Screen name="advanced" options={{ title: "Scenarios", tabBarIcon: icon("briefcase", "briefcase-outline") }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: icon("time", "time-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person", "person-outline") }} />
    </Tabs>
  );
}
