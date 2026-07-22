import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRoutine,
  loadRoutines,
  loadSchedule,
  setScheduleFor,
  upsertRoutine,
  type Routine,
  type Weekday,
} from "./storage";

const KEYS = {
  routines: ["routines"] as const,
  schedule: ["schedule"] as const,
};

export function useRoutines() {
  return useQuery({ queryKey: KEYS.routines, queryFn: loadRoutines });
}

export function useSchedule() {
  return useQuery({ queryKey: KEYS.schedule, queryFn: loadSchedule });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.routines });
      qc.invalidateQueries({ queryKey: KEYS.schedule });
    },
  });
}

export function useSetSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ day, routineId }: { day: Weekday; routineId: string | null }) =>
      setScheduleFor(day, routineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.schedule }),
  });
}

/** Convenience: today's scheduled routine (or null for rest day). */
export function useTodayRoutine() {
  const { data: routines } = useRoutines();
  const { data: schedule } = useSchedule();
  const day = new Date().getDay() as Weekday;
  const id = schedule?.[day] ?? null;
  const routine = id ? routines?.find((r) => r.id === id) ?? null : null;
  return { routine, day, isRest: !routine };
}
