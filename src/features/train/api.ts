import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export type TrackedSet = { setNumber: number; reps: number; weight: number };
export type TrackedExercise = { name: string; muscleGroup: string; sets: TrackedSet[] };
export type WorkoutLog = {
  _id: string;
  date: string;
  exercises: TrackedExercise[];
  notes?: string;
};

type ListResponse = { success: true; data: WorkoutLog[] };

export const trackingKeys = {
  all: ["tracking"] as const,
  list: (limit: number) => ["tracking", "list", limit] as const,
};

export function useWorkoutLogs(limit = 400) {
  return useQuery({
    queryKey: trackingKeys.list(limit),
    queryFn: () => api.get<ListResponse>(`/tracking?limit=${limit}`),
    select: (r) => r.data,
    staleTime: 60_000,
  });
}

export function useSaveWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { date: string; exercises: TrackedExercise[]; notes?: string }) =>
      api.post("/tracking", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackingKeys.all }),
  });
}

/** Most recent time this exercise was performed (any log). null if never. */
export function lastLiftFor(logs: WorkoutLog[], name: string) {
  for (const log of logs) {
    const ex = log.exercises.find((e) => e.name === name);
    if (ex) return { date: log.date, sets: ex.sets };
  }
  return null;
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/tracking?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackingKeys.all }),
  });
}
