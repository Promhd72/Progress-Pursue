import { useEffect, useState } from "react";
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
 * The UI is always the app UI now (the web version is gone). Kept as a hook so
 * screens can still branch if a future web build needs to.
 */
export function useIsNativeApp(): boolean {
  return true;
}

/* ------------------------------------------------------------------ */
/* Haptics                                                             */
/* ------------------------------------------------------------------ */

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

/** Faint tick for keypad presses and tab switches. */
export function keyHaptic() {
  if (!isNativeApp()) return;
  void import("@capacitor/haptics")
    .then(({ Haptics }) => Haptics.selectionChanged())
    .catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Share sheet                                                         */
/* ------------------------------------------------------------------ */

/** Opens the iOS share sheet. Falls back to the Web Share API on the site. */
export async function shareText(title: string, text: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, dialogTitle: title });
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text });
      return true;
    }
  } catch {
    // User cancelled the share sheet.
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Daily streak reminders (local notifications)                        */
/* ------------------------------------------------------------------ */

export type ReminderPrefs = { enabled: boolean; hour: number; minute: number };

const REMINDER_STORAGE_KEY = "rapidmath.reminder";
const REMINDER_BASE_ID = 7100;
const REMINDER_DAYS_AHEAD = 7;
const DEFAULT_REMINDER: ReminderPrefs = { enabled: false, hour: 20, minute: 0 };

const REMINDER_MESSAGES = [
  { title: "Keep your streak alive 🔥", body: "Five minutes of drills before the day ends." },
  { title: "Quick one?", body: "A 10-question lesson takes about two minutes." },
  {
    title: "Your brain's gym is open",
    body: "Sharpen your percentages before tomorrow's meetings.",
  },
  { title: "Don't break the chain", body: "One lesson keeps your streak going." },
];

export function getReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER;
    return { ...DEFAULT_REMINDER, ...(JSON.parse(raw) as Partial<ReminderPrefs>) };
  } catch {
    return DEFAULT_REMINDER;
  }
}

function saveReminderPrefs(prefs: ReminderPrefs) {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable; reminders still work for this session.
  }
}

/** Asks for notification permission if needed. Returns true when allowed. */
async function ensureNotificationPermission(): Promise<boolean> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display === "prompt" || perm.display === "prompt-with-rationale") {
    perm = await LocalNotifications.requestPermissions();
  }
  return perm.display === "granted";
}

/**
 * Schedules one reminder per day for the next week at the chosen time.
 * Today's is skipped when the user has already trained, so we never nag
 * someone who has kept their streak. Re-run on every launch and after lessons.
 */
export async function scheduleStreakReminders(trainedToday: boolean) {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const ids = Array.from({ length: REMINDER_DAYS_AHEAD }, (_, i) => ({
      id: REMINDER_BASE_ID + i,
    }));
    await LocalNotifications.cancel({ notifications: ids });

    const prefs = getReminderPrefs();
    if (!prefs.enabled) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") return;

    const now = new Date();
    const notifications = [];
    for (let day = 0; day < REMINDER_DAYS_AHEAD; day++) {
      const at = new Date(now);
      at.setDate(now.getDate() + day);
      at.setHours(prefs.hour, prefs.minute, 0, 0);
      if (day === 0 && (trainedToday || at <= now)) continue;
      const msg = REMINDER_MESSAGES[(at.getDate() + day) % REMINDER_MESSAGES.length];
      notifications.push({
        id: REMINDER_BASE_ID + day,
        title: msg.title,
        body: msg.body,
        schedule: { at, allowWhileIdle: true },
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch {
    // Notifications are a nice-to-have; never break the app over them.
  }
}

/**
 * Turns reminders on or off. Returns the saved prefs; `enabled` comes back
 * false if the user declined the iOS permission prompt.
 */
export async function updateReminderPrefs(
  next: ReminderPrefs,
  trainedToday: boolean,
): Promise<ReminderPrefs> {
  let prefs = next;
  if (next.enabled && isNativeApp()) {
    const granted = await ensureNotificationPermission().catch(() => false);
    if (!granted) prefs = { ...next, enabled: false };
  }
  saveReminderPrefs(prefs);
  await scheduleStreakReminders(trainedToday);
  return prefs;
}

/** True when the profile's last activity (UTC date) is today. */
export function trainedTodayFrom(lastActiveDate: string | null | undefined): boolean {
  if (!lastActiveDate) return false;
  return lastActiveDate.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */

let shellReady = false;

/** One-time native setup: status bar, splash screen, keyboard, viewport. */
export function initNativeShell(onResume?: () => void) {
  if (shellReady || !isNativeApp()) return;
  shellReady = true;
  document.documentElement.classList.add("native-app");

  // Lock zoom: pinch-zoom and double-tap zoom are dead giveaways of a web page.
  const viewport = document.querySelector('meta[name="viewport"]');
  viewport?.setAttribute(
    "content",
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  );

  void import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Light }))
    .catch(() => {});
  void import("@capacitor/keyboard")
    .then(({ Keyboard }) => Keyboard.setAccessoryBarVisible({ isVisible: false }))
    .catch(() => {});
  // Wait a frame so the first screen is painted before the splash fades.
  requestAnimationFrame(() => {
    void import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 250 }))
      .catch(() => {});
  });
  if (onResume) {
    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) onResume();
        }),
      )
      .catch(() => {});
  }
}

/** Tracks connectivity so the app can show an offline banner instead of failing silently. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
