import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useDemoMode } from "../demo/useDemoMode";
import {
    addFoodEntry as addLocalEntry,
    addWaterMl,
    DEFAULT_GOALS,
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
    type FoodEntry,
    type MacroGoals,
} from "./storage";

const KEYS = {
  food: ["food-entries"] as const,
  goals: ["macro-goals"] as const,
  water: ["water"] as const,
};

/* ────────── Water — Mongo-backed with local mirror ────────── */

/**
 * Loads the last 60 days of water intake as a { day: ml } map. Backend is
 * source of truth; on failure we fall through to the local mirror so the
 * screen still renders offline.
 */
export function useWater() {
  const { data: demoOn = false } = useDemoMode();
  return useQuery({
    queryKey: [...KEYS.water, demoOn ? "demo" : "live"],
    queryFn: async () => {
      // Demo mode seeds ledger only into AsyncStorage — bypass the backend
      // so the screenshot flow shows the seeded intake.
      if (demoOn) return loadWater();
      try {
        const res = await api.get<{
          success: true;
          data: Record<string, number>;
        }>("/water");
        return res.data;
      } catch {
        return loadWater();
      }
    },
    staleTime: 30_000,
  });
}

/**
 * Adds `ml` to the current day's intake. Fully optimistic — the react-query
 * cache is patched synchronously so the UI updates the moment the button
 * is tapped, then the backend request runs in the background. The
 * previous mount used to wait for the server round-trip and then
 * invalidate, causing the counter to lag by 300–800ms and sometimes bounce
 * backwards during the refetch. This flow removes both artefacts.
 */
export function useAddWater() {
  const qc = useQueryClient();
  const { data: demoOn = false } = useDemoMode();
  const cacheKey = [...KEYS.water, demoOn ? "demo" : "live"] as const;

  return useMutation({
    // Patch the cache first, then the local mirror, then the server.
    // The mutation body only handles the network call — the UI is already
    // updated by `onMutate` below.
    mutationFn: async ({ day, ml }: { day: string; ml: number }) => {
      if (demoOn) return; // demo mode never talks to the backend
      await api.post("/water", { day, ml, mode: "add" });
    },
    onMutate: async ({ day, ml }) => {
      // Cancel any in-flight refetch that could overwrite the patched
      // cache after this mutation runs.
      await qc.cancelQueries({ queryKey: cacheKey });
      const previous = qc.getQueryData<Record<string, number>>(cacheKey);
      const nextMap: Record<string, number> = { ...(previous ?? {}) };
      nextMap[day] = Math.max(0, (nextMap[day] ?? 0) + ml);
      qc.setQueryData(cacheKey, nextMap);
      // Mirror to AsyncStorage so a cold launch shows the same total.
      await addWaterMl(day, ml).catch(() => {});
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      // Roll the cache back if the POST failed — but leave the local
      // AsyncStorage mirror in place so the tap still "works" offline;
      // the next successful GET will reconcile the two.
      if (ctx?.previous) qc.setQueryData(cacheKey, ctx.previous);
    },
    // No invalidation on settled — the optimistic patch is authoritative
    // until the natural 30s staleTime elapses. Invalidating here would
    // trigger a mid-flight refetch that briefly renders the stale server
    // value on the UI, which is what caused the counter to blink.
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
  imageUrl?: string | null;
  foods: Array<{
    name: string;
    macros?: ServerMacros;
  }>;
  totals?: ServerMacros;
};

// Superset of every nutrient the server may return. Older docs only had
// four macros — every field stays optional so the parser stays permissive.
type ServerMacros = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  satFat?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
  folate?: number;
  iron?: number;
  calcium?: number;
  potassium?: number;
};

/**
 * Flatten a server meal-log doc into the FoodEntry shape the UI already uses.
 * If a meal has multiple foods (e.g. from AI vision), collapse to one line
 * using the doc totals - client UI is per-entry, not per-item.
 */
/**
 * Only https://, http:// and file:// URIs are safe to hand to <Image>.
 * ph:// (iOS PhotoLibrary) or assets-library:// URIs crash the JS
 * runtime with "MediaLibraryImageLoader" native module missing.
 */
function safePhoto(uri: string | null | undefined): string | undefined {
  if (!uri) return undefined;
  return /^(https?|file):\/\//i.test(uri) ? uri : undefined;
}

function mealToEntry(m: ServerMealLog, localPhoto: string | undefined): FoodEntry {
  const day = m.localDate ?? toISODay(new Date(m.date));
  const totals = m.totals ?? {};
  const primary = m.foods?.[0];
  // Prefer the server-persisted imageUrl (R2 URL, survives reinstall).
  // Fall back to the local photo map (file:// path saved when offline).
  const photoUri = safePhoto(m.imageUrl) ?? safePhoto(localPhoto);
  return {
    id: String(m._id),
    date: day,
    loggedAt: new Date(m.date).toISOString(),
    name: primary?.name || m.aiNotes || "Meal",
    calories: Math.round(totals.calories ?? 0),
    protein: Math.round(totals.protein ?? 0),
    carbs: Math.round(totals.carbs ?? 0),
    fat: Math.round(totals.fat ?? 0),
    // Round grams to 1 decimal, whole numbers for micrograms/milligrams —
    // matches how the AI extractor formats them.
    fiber: round1(totals.fiber),
    sugar: round1(totals.sugar),
    sodium: Math.round(totals.sodium ?? 0),
    satFat: round1(totals.satFat),
    cholesterol: Math.round(totals.cholesterol ?? 0),
    vitaminA: Math.round(totals.vitaminA ?? 0),
    vitaminC: Math.round(totals.vitaminC ?? 0),
    vitaminD: round1(totals.vitaminD),
    vitaminB12: round1(totals.vitaminB12),
    folate: Math.round(totals.folate ?? 0),
    iron: round1(totals.iron),
    calcium: Math.round(totals.calcium ?? 0),
    potassium: Math.round(totals.potassium ?? 0),
    photoUri,
  };
}

function round1(v: number | undefined): number {
  return Math.round((Number(v) || 0) * 10) / 10;
}

/**
 * Server is the source of truth. On error we fall back to the local cache
 * so the screen still renders (e.g. offline). Photos are merged in from a
 * device-local map keyed by the server _id.
 */
export function useFoodEntries() {
  const { data: demoOn = false } = useDemoMode();
  return useQuery({
    queryKey: [...KEYS.food, demoOn ? "demo" : "live"],
    queryFn: async () => {
      // Demo mode seeds fake meals into AsyncStorage for App Store
      // screenshots — bypass the backend so the seeded data shows through.
      if (demoOn) return loadLocalEntries();
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
  const { data: demoOn = false } = useDemoMode();
  return useQuery({
    queryKey: [...KEYS.goals, demoOn ? "demo" : "live"],
    queryFn: async () => {
      if (demoOn) return (await loadLocalGoals()) ?? DEFAULT_GOALS;
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
 * POSTs a manual meal to Mongo. The photo (if any) is NEVER uploaded -
 * only its local `file://` path is remembered in AsyncStorage keyed by the
 * server-issued _id. On failure we still write locally so the entry isn't
 * lost.
 */
export function useAddFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: FoodEntry) => {
      // If the photo is an https:// URL (uploaded to R2) send it to the
      // backend as `imageUrl` so it lives on the meal doc in Mongo and
      // survives an app reinstall. A `file://` fallback (offline path)
      // stays in the local photo map only — it's device-scoped anyway.
      const isRemote = !!entry.photoUri && /^https?:\/\//i.test(entry.photoUri);
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
          fiber: entry.fiber,
          sugar: entry.sugar,
          sodium: entry.sodium,
          satFat: entry.satFat,
          cholesterol: entry.cholesterol,
          vitaminA: entry.vitaminA,
          vitaminC: entry.vitaminC,
          vitaminD: entry.vitaminD,
          vitaminB12: entry.vitaminB12,
          folate: entry.folate,
          iron: entry.iron,
          calcium: entry.calcium,
          potassium: entry.potassium,
        },
        ...(isRemote ? { imageUrl: entry.photoUri } : {}),
      };
      try {
        const res = await api.post<{ success: true; data: { _id: string } }>(
          "/meal-log",
          payload,
        );
        const serverId = String(res.data._id);
        if (entry.photoUri && !isRemote) {
          // Only mirror file:// paths locally — R2 URLs come back from
          // `mealToEntry` on the next GET.
          await setEntryPhoto(serverId, entry.photoUri);
        }
        return { ...entry, id: serverId };
      } catch (err) {
        // Offline / server error - keep it local so nothing is lost.
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
        // fall through - still remove locally so the UI reflects the intent
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
        /* offline - local mirror already applied */
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
