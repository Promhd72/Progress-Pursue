// Confidence check-in: how confident the user feels with numbers when they
// start, and again two weeks later. Kept on the device.

export const CHECKIN_DAYS = 14;

export const CONFIDENCE_LEVELS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: "😬", label: "I avoid numbers when I can" },
  { value: 2, emoji: "😕", label: "I get there, but slowly" },
  { value: 3, emoji: "🙂", label: "Okay, but I double-check" },
  { value: 4, emoji: "😎", label: "Fairly confident" },
  { value: 5, emoji: "🚀", label: "Very confident, even on the spot" },
];

export interface ConfidenceEntry {
  value: number;
  at: string;
}

export interface ConfidenceState {
  before?: ConfidenceEntry;
  after?: ConfidenceEntry;
}

const KEY = "rapidmath.confidence";
const DAY = 24 * 60 * 60 * 1000;

export function getConfidence(): ConfidenceState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConfidenceState) : {};
  } catch {
    return {};
  }
}

function save(state: ConfidenceState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore: the check-in just won't persist.
  }
  return state;
}

export function saveConfidence(value: number): ConfidenceState {
  const s = getConfidence();
  const entry = { value, at: new Date().toISOString() };
  if (!s.before) return save({ before: entry });
  return save({ ...s, after: entry });
}

export const confidenceLevel = (v: number) => CONFIDENCE_LEVELS.find((l) => l.value === v) ?? CONFIDENCE_LEVELS[2];

/** Days until the 2-week check-in (0 = due now). Null when there's no baseline or it's done. */
export function daysUntilCheckIn(s: ConfidenceState = getConfidence(), now = Date.now()): number | null {
  if (!s.before || s.after) return null;
  const due = new Date(s.before.at).getTime() + CHECKIN_DAYS * DAY;
  return Math.max(0, Math.ceil((due - now) / DAY));
}
