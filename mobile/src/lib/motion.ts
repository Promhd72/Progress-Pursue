import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

let reduced = false;
const listeners = new Set<(v: boolean) => void>();
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => {
    reduced = !!v;
    listeners.forEach((l) => l(reduced));
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v: boolean) => {
  reduced = !!v;
  listeners.forEach((l) => l(reduced));
});

/** True when the user turned on Reduce Motion (iPhone Settings > Accessibility > Motion). */
export const prefersReducedMotion = () => reduced;

export function useReducedMotion(): boolean {
  const [v, setV] = useState(reduced);
  useEffect(() => {
    listeners.add(setV);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}
