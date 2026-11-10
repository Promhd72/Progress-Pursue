import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Platform, Share } from "react-native";

/* Haptics -------------------------------------------------------------- */

const safe = (p: Promise<unknown>) => {
  p.catch(() => {});
};

/** Small tap on a correct answer, error buzz on a wrong one. */
export function answerHaptic(correct: boolean) {
  if (Platform.OS === "web") return;
  safe(
    correct
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
}

/** Success buzz when a lesson / test finishes. */
export function finishHaptic() {
  if (Platform.OS === "web") return;
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Faint tick for keypad presses, choices and tab switches. */
export function keyHaptic() {
  if (Platform.OS === "web") return;
  safe(Haptics.selectionAsync());
}

/* Share sheet ---------------------------------------------------------- */

export async function shareText(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // Cancelled.
  }
}

/* Daily streak reminders (local notifications) ------------------------- */

export type ReminderPrefs = { enabled: boolean; hour: number; minute: number };

const REMINDER_KEY = "rapidmath.reminder";
const REMINDER_PREFIX = "rapidmath-streak-";
const DAYS_AHEAD = 7;
const DEFAULT_REMINDER: ReminderPrefs = { enabled: false, hour: 20, minute: 0 };

const MESSAGES = [
  { title: "Keep your streak alive 🔥", body: "Five minutes of drills before the day ends." },
  { title: "Quick one?", body: "A 10-question lesson takes about two minutes." },
  { title: "Your brain's gym is open", body: "Sharpen your percentages before tomorrow's meetings." },
  { title: "Don't break the chain", body: "One lesson keeps your streak going." },
];

// Show reminders even if they arrive while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function getReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? { ...DEFAULT_REMINDER, ...(JSON.parse(raw) as Partial<ReminderPrefs>) } : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

function saveReminderPrefs(prefs: ReminderPrefs) {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore.
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * One reminder per day for the next week at the chosen time. Today's is
 * skipped once the user has trained, so we never nag someone on track.
 * Re-run on every launch and after each lesson.
 */
export async function scheduleStreakReminders(trainedToday: boolean) {
  if (Platform.OS === "web") return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );

    const prefs = getReminderPrefs();
    if (!prefs.enabled) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;

    const now = new Date();
    for (let day = 0; day < DAYS_AHEAD; day++) {
      const at = new Date(now);
      at.setDate(now.getDate() + day);
      at.setHours(prefs.hour, prefs.minute, 0, 0);
      if (day === 0 && (trainedToday || at <= now)) continue;
      const msg = MESSAGES[(at.getDate() + day) % MESSAGES.length];
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${day}`,
        content: { title: msg.title, body: msg.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  } catch {
    // Reminders are a nice-to-have; never break the app over them.
  }
}

/** Saves reminder prefs; `enabled` comes back false if permission was declined. */
export async function updateReminderPrefs(
  next: ReminderPrefs,
  trainedToday: boolean,
): Promise<ReminderPrefs> {
  let prefs = next;
  if (next.enabled && Platform.OS !== "web") {
    const granted = await ensurePermission().catch(() => false);
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
