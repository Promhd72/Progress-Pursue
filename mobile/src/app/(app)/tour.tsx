import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTour } from "@/components/AppTour";
import { colors } from "@/theme";

/** Replay of the app tour, from Profile. */
export default function Tour() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <AppTour onDone={() => router.back()} doneLabel="Got it" />
    </SafeAreaView>
  );
}
