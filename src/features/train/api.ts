import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { getJSON, setJSON } from "../../lib/storage";
import { useDemoMode } from "../demo/useDemoMode";
import { generateWorkoutLogs } from "../demo/demoData";

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

const CACHE_KEY = "@workout_logs_cache";

export function useWorkoutLogs(limit = 400) {
  const { data: demoOn = false } = useDemoMode();
  return useQuery({
    queryKey: [...trackingKeys.list(limit), demoOn ? "demo" : "live"],
    queryFn: async () => {
      if (demoOn) {
        return { success: true as const, data: generateWorkoutLogs(120) };
      }
      try {
        const res = await api.get<ListResponse>(`/tracking?limit=${limit}`);
        // Mirror to disk so the next launch renders instantly instead of
        // sitting through an empty-state → data flash while /tracking loads.
        setJSON(CACHE_KEY, res.data).catch(() => {});
        return res;
      } catch (err) {
        // Offline / server down — surface the cached copy so the Progress
        // page keeps rendering something meaningful. Errors still bubble
        // when the cache is empty.
        const cached = await getJSON<WorkoutLog[]>(CACHE_KEY);
        if (cached && cached.length > 0) {
          return { success: true as const, data: cached };
        }
        throw err;
      }
    },
    select: (r) => r.data,
    staleTime: 60_000,
  });
}

/**
 * Read the on-disk cache and hydrate the react-query cache with it. Called
 * once from AppProviders on boot — so by the time any screen mounts, the
 * queryClient already knows about the last-known workout list. Screens then
 * render from that cache instantly while /tracking revalidates in the
 * background.
 */
export async function hydrateWorkoutLogsFromCache(qc: {
  getQueryData: (key: readonly unknown[]) => unknown;
  setQueryData: (key: readonly unknown[], value: unknown) => unknown;
}) {
  try {
    const cached = await getJSON<WorkoutLog[]>(CACHE_KEY);
    if (!cached || cached.length === 0) return;
    // Hydrate every plausible (limit, mode) tuple the app uses so the same
    // cache seeds the query no matter which caller mounts first.
    for (const limit of [400] as const) {
      const key = [...trackingKeys.list(limit), "live"] as const;
      if (!qc.getQueryData(key)) {
        qc.setQueryData(key, { success: true, data: cached });
      }
    }
  } catch {
    /* cache miss — first launch or corrupted, just fall through */
  }
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
