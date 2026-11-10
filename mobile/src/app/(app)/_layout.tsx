import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { useProfile } from "@/lib/queries";
import { scheduleStreakReminders, trainedTodayFrom } from "@/lib/native";
import { getOnboarding } from "@/lib/onboarding";
import { colors, fonts } from "@/theme";

export default function AppLayout() {
  const segments = useSegments();
  const { data: profile } = useProfile();

  // Keep reminders in sync: skip today's once the user has trained.
  const lastActive = profile?.last_active_date ?? null;
  useEffect(() => {
    if (profile) void scheduleStreakReminders(trainedTodayFrom(lastActive));
  }, [profile, lastActive]);

  // New users (or anyone opening the app for the first time) go through onboarding.
  const inSetup = segments.includes("onboarding") || segments.includes("placement");
  const needsOnboarding = profile && !profile.onboarding_completed && !getOnboarding().completed;
  if (needsOnboarding && !inSetup) return <Redirect href="/onboarding" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="lesson/[track]/[level]" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="placement" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen
        name="technique/[id]"
        options={{
          headerShown: true,
          title: "Technique",
          headerBackTitle: "Back",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, color: colors.foreground },
        }}
      />
      <Stack.Screen
        name="feedback"
        options={{
          headerShown: true,
          title: "Feedback",
          headerBackTitle: "Back",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, color: colors.foreground },
        }}
      />
      <Stack.Screen
        name="curriculum"
        options={{
          headerShown: true,
          title: "Curriculum",
          headerBackTitle: "Back",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, color: colors.foreground },
        }}
      />
    </Stack>
  );
}
