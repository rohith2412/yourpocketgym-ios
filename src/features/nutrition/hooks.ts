import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFoodEntry,
  deleteFoodEntry,
  loadFoodEntries,
  loadGoals,
  saveGoals,
  toISODay,
  totalsForDay,
  type FoodEntry,
  type MacroGoals,
} from "./storage";

const KEYS = {
  food: ["food-entries"] as const,
  goals: ["macro-goals"] as const,
};

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
