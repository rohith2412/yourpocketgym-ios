/**
 * Routines + weekly schedule — stored locally in AsyncStorage (free tier).
 * When we ship premium, the same shape can be pushed to the backend for sync.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getJSON, setJSON } from "../../lib/storage";
import type { MuscleGroup } from "../train/data";

export type RoutineExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: number; // suggested reps per set (used to pre-fill the log)
};

export type Routine = {
  id: string;
  name: string; // "Push Day"
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export const WEEKDAYS: { key: Weekday; short: string; long: string }[] = [
  { key: 0, short: "S", long: "Sunday" },
  { key: 1, short: "M", long: "Monday" },
  { key: 2, short: "T", long: "Tuesday" },
  { key: 3, short: "W", long: "Wednesday" },
  { key: 4, short: "T", long: "Thursday" },
  { key: 5, short: "F", long: "Friday" },
  { key: 6, short: "S", long: "Saturday" },
];

/** Which routine (if any) is scheduled for each day. Null = rest day. */
export type Schedule = Record<Weekday, string | null>;

const EMPTY_SCHEDULE: Schedule = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };

const KEYS = {
  routines: "@routines",
  schedule: "@schedule",
};

// ── Routines ─────────────────────────────────────────────────────────────────
export const loadRoutines = async () =>
  (await getJSON<Routine[]>(KEYS.routines)) ?? [];

export const saveRoutines = (rs: Routine[]) => setJSON(KEYS.routines, rs);

export async function upsertRoutine(r: Routine) {
  const list = await loadRoutines();
  const i = list.findIndex((x) => x.id === r.id);
  if (i >= 0) list[i] = { ...r, updatedAt: new Date().toISOString() };
  else list.push(r);
  await saveRoutines(list);
  return list;
}

export async function deleteRoutine(id: string) {
  const list = await loadRoutines();
  const next = list.filter((r) => r.id !== id);
  await saveRoutines(next);
  // Also clear it from the schedule
  const sched = await loadSchedule();
  let dirty = false;
  (Object.keys(sched) as unknown as Weekday[]).forEach((d) => {
    if (sched[d] === id) { sched[d] = null; dirty = true; }
  });
  if (dirty) await saveSchedule(sched);
  return next;
}

// ── Schedule ─────────────────────────────────────────────────────────────────
export async function loadSchedule(): Promise<Schedule> {
  const s = await getJSON<Schedule>(KEYS.schedule);
  return s ?? EMPTY_SCHEDULE;
}

export const saveSchedule = (s: Schedule) => setJSON(KEYS.schedule, s);

export async function setScheduleFor(day: Weekday, routineId: string | null) {
  const s = await loadSchedule();
  s[day] = routineId;
  await saveSchedule(s);
  return s;
}

// ── Convenience ──────────────────────────────────────────────────────────────
export const newRoutineId = () =>
  `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** Wipe (for sign-out). */
export async function clearRoutinesLocal() {
  await AsyncStorage.multiRemove([KEYS.routines, KEYS.schedule]);
}
