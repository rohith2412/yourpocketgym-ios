// Recovery data — sleep + mood, plus a computed recovery score that reads
// from both. All local; the sync snapshot picks these keys up automatically.

import { getJSON, setJSON } from "../../lib/storage";
import { toISODay } from "../nutrition/storage";

export type SleepEntry = {
  date: string;   // ISO day the sleep BELONGS to (i.e. the morning of)
  hours: number;  // total hours slept
  quality: 1 | 2 | 3 | 4 | 5;
  loggedAt: string;
};

export type MoodEntry = {
  date: string;
  score: 1 | 2 | 3 | 4 | 5; // 1 rough → 5 great
  note?: string;
  loggedAt: string;
};

const KEYS = {
  sleep: "@sleep_log",
  mood: "@mood_log",
} as const;

// ── Sleep ────────────────────────────────────────────────────────────────────
export async function loadSleep(): Promise<SleepEntry[]> {
  return (await getJSON<SleepEntry[]>(KEYS.sleep)) ?? [];
}
const saveSleep = (log: SleepEntry[]) => setJSON(KEYS.sleep, log);

export async function upsertSleep(entry: Omit<SleepEntry, "loggedAt"> & { loggedAt?: string }) {
  const log = await loadSleep();
  const stamped: SleepEntry = { ...entry, loggedAt: entry.loggedAt ?? new Date().toISOString() };
  const others = log.filter((e) => e.date !== stamped.date);
  others.push(stamped);
  others.sort((a, b) => (a.date < b.date ? -1 : 1));
  await saveSleep(others);
  return stamped;
}

// ── Mood ─────────────────────────────────────────────────────────────────────
export async function loadMood(): Promise<MoodEntry[]> {
  return (await getJSON<MoodEntry[]>(KEYS.mood)) ?? [];
}
const saveMood = (log: MoodEntry[]) => setJSON(KEYS.mood, log);

export async function upsertMood(entry: Omit<MoodEntry, "loggedAt"> & { loggedAt?: string }) {
  const log = await loadMood();
  const stamped: MoodEntry = { ...entry, loggedAt: entry.loggedAt ?? new Date().toISOString() };
  const others = log.filter((e) => e.date !== stamped.date);
  others.push(stamped);
  others.sort((a, b) => (a.date < b.date ? -1 : 1));
  await saveMood(others);
  return stamped;
}

// ── Today helpers ────────────────────────────────────────────────────────────
export function todaySleep(log: SleepEntry[]): SleepEntry | null {
  const t = toISODay();
  return log.find((e) => e.date === t) ?? null;
}
export function todayMood(log: MoodEntry[]): MoodEntry | null {
  const t = toISODay();
  return log.find((e) => e.date === t) ?? null;
}
