import { useEffect, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Helpers for the iOS app (Capacitor). The app loads this same web build, and
 * Capacitor injects a native bridge into the page, so everything here is a
 * no-op in a normal browser and during SSR.
 */

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * React-safe version: always false on the server and on the first client
 * render (so SSR markup hydrates cleanly), then flips to true inside the app.
 */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNativeApp());
  }, []);
  return native;
}

/**
 * Renders children only on the website. Used for purchase / pricing UI, which
 * App Store rules (guideline 3.1.1) don't allow in the iOS app unless it goes
 * through Apple In-App Purchase.
 */
export function WebOnly({ children }: { children: ReactNode }) {
  const native = useIsNativeApp();
  return native ? null : <>{children}</>;
}

/** Small tap on a correct answer, error buzz on a wrong one. */
export function answerHaptic(correct: boolean) {
  if (!isNativeApp()) return;
  void import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle, NotificationType }) =>
      correct
        ? Haptics.impact({ style: ImpactStyle.Light })
        : Haptics.notification({ type: NotificationType.Error }),
    )
    .catch(() => {});
}

/** Success buzz when a lesson / test finishes. */
export function finishHaptic() {
  if (!isNativeApp()) return;
  void import("@capacitor/haptics")
    .then(({ Haptics, NotificationType }) =>
      Haptics.notification({ type: NotificationType.Success }),
    )
    .catch(() => {});
}

let shellReady = false;

/** One-time native setup: status bar, splash screen, keyboard. */
export function initNativeShell() {
  if (shellReady || !isNativeApp()) return;
  shellReady = true;
  document.documentElement.classList.add("native-app");

  void import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Light }))
    .catch(() => {});
  void import("@capacitor/keyboard")
    .then(({ Keyboard }) => Keyboard.setAccessoryBarVisible({ isVisible: true }))
    .catch(() => {});
  void import("@capacitor/splash-screen")
    .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 200 }))
    .catch(() => {});
}
