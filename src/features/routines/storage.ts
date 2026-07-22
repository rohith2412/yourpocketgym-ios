/**
 * Weekly routine — one plan that names each workout day (e.g. Mon = "Push day")
 * with a list of exercises. Unselected days are rest days.
 * Stored locally (free tier).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJSON, setJSON } from "../../lib/storage";
import type { MuscleGroup } from "../train/data";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export const WEEKDAYS: { key: Weekday; short: string; long: string }[] = [
  { key: 1, short: "Mon", long: "Monday" },
  { key: 2, short: "Tue", long: "Tuesday" },
  { key: 3, short: "Wed", long: "Wednesday" },
  { key: 4, short: "Thu", long: "Thursday" },
  { key: 5, short: "Fri", long: "Friday" },
  { key: 6, short: "Sat", long: "Saturday" },
  { key: 0, short: "Sun", long: "Sunday" },
];

export type RoutineExercise = { name: string; muscleGroup: MuscleGroup };

export type DayPlan = {
  name: string; // "Push day", "Pull day", etc.
  exercises: RoutineExercise[];
};

export type Routine = {
  id: string;
  days: Partial<Record<Weekday, DayPlan>>;
  createdAt: string;
  updatedAt: string;
};

const KEYS = { routines: "@routines" };

// ── Persistence ──────────────────────────────────────────────────────────────
export async function loadRoutines(): Promise<Routine[]> {
  const list = (await getJSON<any[]>(KEYS.routines)) ?? [];
  // Ignore old-shape entries (no `days`) — safe cleanup for local-only dev data.
  return list.filter((r) => r && typeof r.days === "object" && !Array.isArray(r.days));
}

export const saveRoutines = (rs: Routine[]) => setJSON(KEYS.routines, rs);

export async function upsertRoutine(r: Routine) {
  const list = await loadRoutines();
  const i = list.findIndex((x) => x.id === r.id);
  const now = new Date().toISOString();
  const next: Routine = { ...r, updatedAt: now };
  if (i >= 0) list[i] = next;
  else list.push({ ...next, createdAt: r.createdAt ?? now });
  await saveRoutines(list);
  return list;
}

export async function deleteRoutine(id: string) {
  const list = await loadRoutines();
  const next = list.filter((r) => r.id !== id);
  await saveRoutines(next);
  return next;
}

export const newRoutineId = () =>
  `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export async function clearRoutinesLocal() {
  await AsyncStorage.removeItem(KEYS.routines);
}

// ── Convenience ──────────────────────────────────────────────────────────────
/** Get today's day-plan across all routines (first hit wins). */
export function planForToday(routines: Routine[], day: Weekday): {
  routine: Routine | null;
  plan: DayPlan | null;
} {
  for (const r of routines) {
    const p = r.days[day];
    if (p) return { routine: r, plan: p };
  }
  return { routine: null, plan: null };
}

export const emptyDayPlan = (): DayPlan => ({ name: "", exercises: [] });
