// 0-100 recovery score. Simple, defensible formula so it explains itself:
//   40% sleep (hours vs 8h target, capped)
//   30% sleep quality (1-5 → 0-1)
//   20% mood (1-5 → 0-1)
//   10% workout freshness (0 if trained today, 1 if 2+ days off)
// Missing inputs neutral-weighted at 0.5 so a partial day still shows something.

import type { SleepEntry, MoodEntry } from "./storage";
import type { WorkoutLog } from "../train/api";

export type RecoveryBreakdown = {
  score: number;             // 0-100
  label: string;             // e.g. "Ready", "Good", "Take it easy"
  sleepHours: number | null;
  sleepQuality: number | null;
  mood: number | null;
  daysSinceLastWorkout: number | null;
};

const SLEEP_TARGET = 8;

export function computeRecovery(
  todaySleep: SleepEntry | null,
  todayMood: MoodEntry | null,
  workoutLogs: WorkoutLog[],
): RecoveryBreakdown {
  const sleepHoursScore =
    todaySleep ? Math.min(1, todaySleep.hours / SLEEP_TARGET) : 0.5;
  const sleepQualityScore =
    todaySleep ? (todaySleep.quality - 1) / 4 : 0.5;
  const moodScore = todayMood ? (todayMood.score - 1) / 4 : 0.5;

  const daysSince = daysSinceLastWorkout(workoutLogs);
  const freshness =
    daysSince == null ? 0.5 : Math.min(1, daysSince / 2);

  const raw =
    sleepHoursScore * 0.4 +
    sleepQualityScore * 0.3 +
    moodScore * 0.2 +
    freshness * 0.1;

  const score = Math.round(raw * 100);
  const label =
    score >= 80 ? "Ready to train"
    : score >= 60 ? "Good"
    : score >= 40 ? "Take it easy"
    : "Rest today";

  return {
    score,
    label,
    sleepHours: todaySleep?.hours ?? null,
    sleepQuality: todaySleep?.quality ?? null,
    mood: todayMood?.score ?? null,
    daysSinceLastWorkout: daysSince,
  };
}

function daysSinceLastWorkout(logs: WorkoutLog[]): number | null {
  if (!logs.length) return null;
  const last = new Date(logs[0].date).getTime();
  if (isNaN(last)) return null;
  const ms = Date.now() - last;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ── 7-day series ─────────────────────────────────────────────────────────────

export type DailyScore = {
  date: string;     // ISO day
  weekday: string;  // "M", "T", …
  score: number | null;
};

const WEEKDAY_INITIAL = ["S", "M", "T", "W", "T", "F", "S"];

export function computeLast7Days(
  sleepLog: SleepEntry[],
  moodLog: MoodEntry[],
  workoutLogs: WorkoutLog[],
): DailyScore[] {
  const days: DailyScore[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toLocaleDateString("en-CA");
    const s = sleepLog.find((e) => e.date === iso) ?? null;
    const m = moodLog.find((e) => e.date === iso) ?? null;

    // Only compute score if there's at least one signal for that day.
    const hasData = !!s || !!m;
    const scoredFrom = hasData
      ? { score: computeSingleDayScore(s, m, workoutLogs, d) }
      : { score: null };

    days.push({
      date: iso,
      weekday: WEEKDAY_INITIAL[d.getDay()],
      score: scoredFrom.score,
    });
  }
  return days;
}

function computeSingleDayScore(
  sleep: SleepEntry | null,
  mood: MoodEntry | null,
  workoutLogs: WorkoutLog[],
  day: Date,
): number {
  const sleepHoursScore = sleep ? Math.min(1, sleep.hours / SLEEP_TARGET) : 0.5;
  const sleepQualityScore = sleep ? (sleep.quality - 1) / 4 : 0.5;
  const moodScore = mood ? (mood.score - 1) / 4 : 0.5;

  // Freshness relative to `day`: how many days since the most recent workout
  // that happened on/before `day`.
  const dayMs = day.getTime() + 24 * 60 * 60 * 1000 - 1;
  const priorLogs = workoutLogs.filter((w) => new Date(w.date).getTime() <= dayMs);
  const daysSince = priorLogs.length
    ? Math.floor((dayMs - new Date(priorLogs[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const freshness = daysSince == null ? 0.5 : Math.min(1, daysSince / 2);

  const raw =
    sleepHoursScore * 0.4 +
    sleepQualityScore * 0.3 +
    moodScore * 0.2 +
    freshness * 0.1;
  return Math.round(raw * 100);
}
