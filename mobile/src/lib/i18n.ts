// Languages: English (source) and Indonesian.
//
// English text is the key. Two ways a string gets translated:
//   1. tr("Level {n} is Pro-only", { n })   explicit, with named placeholders.
//   2. <Txt> translates its own text automatically. Numbers are ignored when
//      matching, so "3 of 10 correct" and "7 of 10 correct" share one entry.
// Anything without a translation falls back to English.
//
// Translations live in src/lib/i18n/id.json (see MOBILE.md, "Languages").

import { getLocales } from "expo-localization";
import { Children, useSyncExternalStore, type ReactNode } from "react";
import { Alert, type AlertButton } from "react-native";
import ID from "./i18n/id.json";

export type Lang = "en" | "id";
export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "id", label: "Bahasa Indonesia", short: "ID" },
];

const KEY = "rapidmath.lang";
const DICT = ID as Record<string, string>;

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "id") return saved;
  } catch {
    // Storage unavailable: fall through to the device language.
  }
  try {
    const code = getLocales()[0]?.languageCode;
    if (code === "id" || code === "in") return "id";
  } catch {
    // Ignore.
  }
  return "en";
}

let lang: Lang = initial();
const listeners = new Set<() => void>();

export const getLang = () => lang;

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Ignore.
  }
  cache.clear();
  listeners.forEach((l) => l());
}

/** Re-renders when the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getLang,
    getLang,
  );
}

/* Explicit translation ------------------------------------------------- */

const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;

const produced = new Set<string>();

/** Marks text that is already in the right language, so <Txt> leaves it alone. */
export function mark(s: string): string {
  if (lang !== "en" && produced.size < 4000) produced.add(s);
  return s;
}

/** Translate an English string. `{name}` placeholders are filled from `vars`. */
export function tr(en: string, vars?: Record<string, string | number>): string {
  if (lang === "en") return fill(en, vars);
  const hit = DICT[en];
  if (hit === undefined) miss(en);
  const out = fill(hit ?? en, vars);
  if (produced.size < 4000) produced.add(out);
  return out;
}

/* Automatic translation (used by <Txt>) -------------------------------- */

const NUM = /\d+(?:[.,]\d+)*/g;
const SLOT = (i: number) => `\u0001${i}\u0001`;

/** Number-blind index: "{0} of {1} correct" -> translation with the same slots. */
let index: Map<string, string> | null = null;
function numberIndex() {
  if (index) return index;
  index = new Map();
  for (const [en, id] of Object.entries(DICT)) {
    const nums: string[] = [];
    const key = en.replace(NUM, (m) => {
      nums.push(m);
      return SLOT(nums.length - 1);
    });
    if (nums.length === 0) continue;
    const used = new Set<number>();
    const val = id.replace(NUM, (m) => {
      const i = nums.findIndex((n, j) => n === m && !used.has(j));
      if (i < 0) return m;
      used.add(i);
      return SLOT(i);
    });
    if (!index.has(key)) index.set(key, val);
  }
  return index;
}

let upper: Map<string, string> | null = null;
function upperIndex() {
  if (upper) return upper;
  upper = new Map();
  for (const [en, id] of Object.entries(DICT)) upper.set(en.toUpperCase(), id.toUpperCase());
  return upper;
}

const cache = new Map<string, string>();
const missed = new Set<string>();
function miss(s: string) {
  if (missed.size < 5000) missed.add(s);
}
/** Strings shown in Indonesian mode that had no translation (for QA). */
export const i18nMisses = () => [...missed];
if (typeof globalThis !== "undefined") (globalThis as { __i18nMisses?: () => string[] }).__i18nMisses = i18nMisses;

/** Translate text that may contain numbers. Returns the input when unknown. */
export function auto(text: string): string {
  if (lang === "en") return text;
  const cached = cache.get(text);
  if (cached !== undefined) return cached;
  const core = text.trim();
  let out = text;
  if (core && /[A-Za-z]{2}/.test(core) && !produced.has(text)) {
    let hit = DICT[core];
    if (hit === undefined) {
      const nums: string[] = [];
      const key = core.replace(NUM, (m) => {
        nums.push(m);
        return SLOT(nums.length - 1);
      });
      const tpl = nums.length ? numberIndex().get(key) : undefined;
      // eslint-disable-next-line no-control-regex
      if (tpl !== undefined) hit = tpl.replace(/\u0001(\d+)\u0001/g, (_, i: string) => nums[Number(i)]);
    }
    // ALL CAPS labels: match the normal-case entry and shout the result.
    if (hit === undefined && core === core.toUpperCase()) {
      const again = upperIndex().get(core);
      if (again !== undefined) hit = again;
    }
    if (hit === undefined) miss(core);
    else out = text.replace(core, () => hit);
  }
  if (cache.size < 3000) cache.set(text, out);
  return out;
}

/** Translates the text parts of React children, leaving elements alone. */
export function localize(children: ReactNode): ReactNode {
  if (lang === "en" || children == null) return children;
  if (typeof children === "string") return auto(children);
  if (typeof children === "number") return children;
  if (!Array.isArray(children)) return children;
  const out: ReactNode[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push(auto(buf));
    buf = "";
  };
  for (const c of Children.toArray(children)) {
    if (typeof c === "string" || typeof c === "number") buf += String(c);
    else {
      flush();
      out.push(c);
    }
  }
  flush();
  return out.length === 1 ? out[0] : out;
}

/** Alert.alert with the title, message and buttons translated. */
export function alertT(title: string, message?: string, buttons?: AlertButton[]) {
  Alert.alert(
    auto(title),
    message === undefined ? undefined : auto(message),
    buttons?.map((b) => ({ ...b, text: b.text === undefined ? undefined : auto(b.text) })),
  );
}
