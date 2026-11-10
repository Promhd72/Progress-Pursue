import { useRouter } from "expo-router";
import { View } from "react-native";
import { AppTour } from "@/components/AppTour";
import { colors } from "@/theme";

/** Replay of the app tour, from Profile. */
export default function Tour() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 8 }}>
      <AppTour onDone={() => router.back()} doneLabel="Got it" />
    </View>
  );
}
