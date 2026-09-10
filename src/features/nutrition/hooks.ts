import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import {
  addFoodEntry as addLocalEntry,
  addWaterMl,
  deleteFoodEntry as deleteLocalEntry,
  loadFoodEntries as loadLocalEntries,
  loadGoals as loadLocalGoals,
  loadPhotoMap,
  loadWater,
  loadWaterGoal,
  removeEntryPhoto,
  saveFoodEntries,
  saveGoals as saveLocalGoals,
  saveWaterGoal,
  setEntryPhoto,
  toISODay,
  totalsForDay,
  DEFAULT_GOALS,
  type FoodEntry,
  type MacroGoals,
} from "./storage";

const KEYS = {
  food: ["food-entries"] as const,
  goals: ["macro-goals"] as const,
  water: ["water"] as const,
};

/* ────────── Water (local — no backend endpoint yet) ────────── */

export function useWater() {
  return useQuery({ queryKey: KEYS.water, queryFn: loadWater });
}

export function useAddWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ day, ml }: { day: string; ml: number }) => addWaterMl(day, ml),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.water }),
  });
}

const WATER_GOAL_KEY = ["water-goal"] as const;

export function useWaterGoal() {
  return useQuery({ queryKey: WATER_GOAL_KEY, queryFn: loadWaterGoal });
}

export function useSaveWaterGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ml: number) => saveWaterGoal(ml),
    onSuccess: () => qc.invalidateQueries({ queryKey: WATER_GOAL_KEY }),
  });
}

/* ────────── Food entries (Mongo-backed) ────────── */

/**
 * A single meal-log document as returned by `/meal-log`.
 * The server stores one meal (usually one food) per document.
 */
type ServerMealLog = {
  _id: string;
  date: string;
  localDate?: string | null;
  mealType?: string;
  aiNotes?: string;
  foods: Array<{
    name: string;
    macros?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  }>;
  totals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

/**
 * Flatten a server meal-log doc into the FoodEntry shape the UI already uses.
 * If a meal has multiple foods (e.g. from AI vision), collapse to one line
 * using the doc totals — client UI is per-entry, not per-item.
 */
function mealToEntry(m: ServerMealLog, photoUri: string | undefined): FoodEntry {
  const day = m.localDate ?? toISODay(new Date(m.date));
  const totals = m.totals ?? {};
  const primary = m.foods?.[0];
  return {
    id: String(m._id),
    date: day,
    loggedAt: new Date(m.date).toISOString(),
    name: primary?.name || m.aiNotes || "Meal",
    calories: Math.round(totals.calories ?? 0),
    protein: Math.round(totals.protein ?? 0),
    carbs: Math.round(totals.carbs ?? 0),
    fat: Math.round(totals.fat ?? 0),
    photoUri,
  };
}

/**
 * Server is the source of truth. On error we fall back to the local cache
 * so the screen still renders (e.g. offline). Photos are merged in from a
 * device-local map keyed by the server _id.
 */
export function useFoodEntries() {
  return useQuery({
    queryKey: KEYS.food,
    queryFn: async () => {
      try {
        const [res, photos] = await Promise.all([
          api.get<{ success: true; data: ServerMealLog[] }>(
            "/meal-log?limit=200",
          ),
          loadPhotoMap(),
        ]);
        const entries = res.data.map((m) => mealToEntry(m, photos[String(m._id)]));
        // Mirror to local so useToday works offline on next launch.
        await saveFoodEntries(entries);
        return entries;
      } catch {
        return loadLocalEntries();
      }
    },
    staleTime: 30_000,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: KEYS.goals,
    queryFn: async () => {
      try {
        const res = await api.get<{ success: true; data: { goals: MacroGoals } }>(
          "/nutrition-goals",
        );
        await saveLocalGoals(res.data.goals);
        return res.data.goals;
      } catch {
        return (await loadLocalGoals()) ?? DEFAULT_GOALS;
      }
    },
    staleTime: 60_000,
  });
}

/**
 * POSTs a manual meal to Mongo. The photo (if any) is NEVER uploaded —
 * only its local `file://` path is remembered in AsyncStorage keyed by the
 * server-issued _id. On failure we still write locally so the entry isn't
 * lost.
 */
export function useAddFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: FoodEntry) => {
      const payload = {
        localDate: entry.date,
        date: entry.loggedAt,
        mealType: "snack" as const,
        note: entry.name,
        manualMacros: {
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
        },
      };
      try {
        const res = await api.post<{ success: true; data: { _id: string } }>(
          "/meal-log",
          payload,
        );
        const serverId = String(res.data._id);
        if (entry.photoUri) {
          await setEntryPhoto(serverId, entry.photoUri);
        }
        return { ...entry, id: serverId };
      } catch (err) {
        // Offline / server error — keep it local so nothing is lost.
        // The next successful GET will overwrite with the server view.
        await addLocalEntry(entry);
        if (entry.photoUri) await setEntryPhoto(entry.id, entry.photoUri);
        throw err;
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.food }),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.del(`/meal-log?id=${encodeURIComponent(id)}`);
      } catch {
        // fall through — still remove locally so the UI reflects the intent
      }
      await deleteLocalEntry(id);
      await removeEntryPhoto(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.food }),
  });
}

export function useSaveGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: MacroGoals) => {
      // Optimistic local mirror so the UI can render before the server round-
      // trip completes and so this still works offline.
      await saveLocalGoals(g);
      try {
        await api.patch("/nutrition-goals", g);
      } catch {
        /* offline — local mirror already applied */
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.goals }),
  });
}

/* ────────── Derived helpers ────────── */

/** Last 7 days of calorie totals (oldest → newest). */
export function useWeeklyCalories() {
  const { data: all = [] } = useFoodEntries();
  const days: { label: string; day: string; kcal: number; isToday: boolean }[] = [];
  const todayIso = toISODay();
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = toISODay(d);
    days.push({
      label: labels[d.getDay()],
      day: iso,
      kcal: totalsForDay(all, iso).calories,
      isToday: iso === todayIso,
    });
  }
  return days;
}

/** Convenience: today's food + totals. */
export function useToday() {
  const { data: all = [] } = useFoodEntries();
  const { data: goals } = useGoals();
  const today = toISODay();
  const items = all
    .filter((e) => e.date === today)
    .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));
  const totals = totalsForDay(all, today);
  return { items, totals, goals, today };
}
