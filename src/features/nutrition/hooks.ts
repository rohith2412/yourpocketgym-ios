import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFoodEntry,
  addWaterMl,
  deleteFoodEntry,
  loadFoodEntries,
  loadGoals,
  loadWater,
  saveGoals,
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

export function useFoodEntries() {
  return useQuery({ queryKey: KEYS.food, queryFn: loadFoodEntries });
}

export function useGoals() {
  return useQuery({ queryKey: KEYS.goals, queryFn: loadGoals });
}

export function useAddFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: FoodEntry) => addFoodEntry(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.food }),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFoodEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.food }),
  });
}

export function useSaveGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (g: MacroGoals) => saveGoals(g),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.goals }),
  });
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
