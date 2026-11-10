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
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
      <Text style={{ fontSize: 16 }}>🔥</Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.warm, marginLeft: 3 }}>
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
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          // Web previews have no safe-area inset, so give the labels room.
          ...(Platform.OS === "web" ? { height: 64, paddingBottom: 8 } : null),
        },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.foreground },
        headerRight: () => <Streak />,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="train" options={{ title: "Train", tabBarIcon: icon("school", "school-outline") }} />
      <Tabs.Screen name="advanced" options={{ title: "Advanced", tabBarIcon: icon("bar-chart", "bar-chart-outline") }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: icon("time", "time-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person", "person-outline") }} />
    </Tabs>
  );
}
