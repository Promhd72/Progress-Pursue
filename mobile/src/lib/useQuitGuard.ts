import { usePreventRemove } from "expo-router";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { alertT, auto } from "@/lib/i18n";

/**
 * While `active`, any attempt to leave the screen (close button, Quit button,
 * swipe back, Android back) asks for confirmation first. Nothing is saved on
 * quit: lessons only count once they're finished.
 */
export function useQuitGuard(title: string, message: string, quitLabel: string) {
  const [active, setActive] = useState(false);

  usePreventRemove(active, ({ repeat }) => {
    const quit = () => {
      setActive(false);
      repeat();
    };
    if (Platform.OS === "web") {
      if (window.confirm(`${auto(title)}\n\n${auto(message)}`)) quit();
      return;
    }
    alertT(title, message, [
      { text: "Keep going", style: "cancel" },
      { text: quitLabel, style: "destructive", onPress: quit },
    ]);
  });

  return { active, setActive };
}
