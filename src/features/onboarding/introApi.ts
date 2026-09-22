import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { getJSON, setJSON } from "../../lib/storage";

/**
 * User intro — the "who are you" record that powers goal calculation.
 * Backed by `/api/user-intro` on the server, mirrored to AsyncStorage so
 * the Nutrition onboarding gate can decide "already answered vs ask now"
 * without a network round-trip.
 */

export type UserIntro = {
  age?: number | null;
  height?: number | null; // cm
  weight?: number | null; // kg
  gender?: string | null;
  fitnessGoal?: string | null; // "lose fat" | "gain muscle" | "maintain"
  experienceLevel?: string | null;
  workoutDaysPerWeek?: number | null;
  region?: string | null;
};

const CACHE_KEY = "@user_intro";
const QK = ["user-intro"] as const;

/** Fields the Nutrition onboarding needs before it stops asking. */
export function hasRequiredIntro(intro: UserIntro | null | undefined): boolean {
  if (!intro) return false;
  return (
    intro.weight != null &&
    intro.height != null &&
    intro.age != null &&
    !!intro.fitnessGoal
  );
}

export function useIntro() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      try {
        const res = await api.get<{
          success: true;
          exists: boolean;
          data: UserIntro | null;
        }>("/user-intro");
        const intro = res.data ?? null;
        if (intro) await setJSON(CACHE_KEY, intro);
        return intro;
      } catch {
        // Offline / server unreachable → local mirror.
        return (await getJSON<UserIntro>(CACHE_KEY)) ?? null;
      }
    },
    staleTime: 60_000,
  });
}

export function useSaveIntroPartial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserIntro>) => {
      // Optimistic local mirror so the onboarding gate closes even before
      // the backend replies.
      const prev = (await getJSON<UserIntro>(CACHE_KEY)) ?? {};
      const merged = { ...prev, ...patch };
      await setJSON(CACHE_KEY, merged);
      try {
        await api.patch("/user-intro", patch);
      } catch {
        // offline — local mirror stands
      }
      return merged;
    },
    onSuccess: (merged) => {
      qc.setQueryData(QK, merged);
      qc.invalidateQueries({ queryKey: QK });
      // The backend recalculates the calorie + macro targets on every
      // /nutrition-goals GET based on age/height/weight/goal from the
      // intro — so a fresh intro means the daily calorie need needs to
      // be pulled again. Invalidating triggers useGoals to refetch.
      qc.invalidateQueries({ queryKey: ["macro-goals"] });
    },
  });
}
