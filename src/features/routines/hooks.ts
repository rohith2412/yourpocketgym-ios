import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRoutine,
  loadRoutines,
  planForToday,
  upsertRoutine,
  type Routine,
  type Weekday,
} from "./storage";

const KEYS = { routines: ["routines"] as const };

export function useRoutines() {
  return useQuery({ queryKey: KEYS.routines, queryFn: loadRoutines });
}

export function useUpsertRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: Routine) => upsertRoutine(r),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.routines }),
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.routines }),
  });
}

/** Today's day-plan across all routines. */
export function useTodayPlan() {
  const { data: routines = [] } = useRoutines();
  const day = new Date().getDay() as Weekday;
  const { routine, plan } = planForToday(routines, day);
  return { routine, plan, day, isRest: !plan };
}
