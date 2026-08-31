// Demo mode — one toggle in the profile that seeds the whole app with rich
// sample data for App Store screenshots, and clears it just as cleanly.
// Only exposed to admin accounts (same gate as force-premium).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJSON, setJSON } from "../../lib/storage";
import { useCurrentUser } from "../auth/useCurrentUser";
import { isReviewAccount } from "../subscription/reviewAccounts";
import {
  generateFoodEntries,
  DEMO_MACRO_GOALS,
  generateWater,
  DEMO_WATER_GOAL_ML,
  generateWeightLog,
  generateRoutine,
  generateSleep,
  generateMood,
} from "./demoData";

const DEMO_FLAG_KEY = "@demo_mode";

// Same AsyncStorage keys the app already uses.
const KEYS = {
  food:      "@food_entries",
  goals:     "@macro_goals",
  water:     "@water_state",
  waterGoal: "@water_goal_ml",
  weight:    "@weight_log",
  routines:  "@routines",
  sleep:     "@sleep_log",
  mood:      "@mood_log",
} as const;

// ── Query hooks ─────────────────────────────────────────────────────────────

const DEMO_QK = ["demoMode"] as const;

export function useDemoMode() {
  const { data: user } = useCurrentUser();
  // The App Review demo account must always see its own real (empty) data.
  // Seeded rows live in plain AsyncStorage — device-wide, not per-account — so
  // suppressing the flag isn't enough; we actively wipe them the first time a
  // review account is seen on this device.
  const blocked = isReviewAccount(user?.email);

  return useQuery({
    queryKey: [...DEMO_QK, blocked ? "review" : "normal"],
    queryFn: async () => {
      const on = (await getJSON<boolean>(DEMO_FLAG_KEY)) ?? false;
      if (blocked) {
        if (on) {
          await clearDemoData();
          await setJSON(DEMO_FLAG_KEY, false);
        }
        return false;
      }
      return on;
    },
    staleTime: Infinity,
  });
}

export function useSetDemoMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (on: boolean) => {
      if (on) await seedDemoData();
      else await clearDemoData();
      await setJSON(DEMO_FLAG_KEY, on);
      return on;
    },
    onSuccess: async () => {
      // Refresh every screen that reads the seeded data.
      await qc.invalidateQueries({ queryKey: DEMO_QK });
      await qc.invalidateQueries({ queryKey: ["food"] });
      await qc.invalidateQueries({ queryKey: ["water"] });
      await qc.invalidateQueries({ queryKey: ["weightLog"] });
      await qc.invalidateQueries({ queryKey: ["weight-log"] });
      await qc.invalidateQueries({ queryKey: ["routines"] });
      await qc.invalidateQueries({ queryKey: ["macroGoals"] });
      await qc.invalidateQueries({ queryKey: ["trainingLogs"] });
      await qc.invalidateQueries({ queryKey: ["tracking"] });
    },
  });
}

// ── Seed / clear ────────────────────────────────────────────────────────────

async function seedDemoData() {
  // Deep enough that the 90-day and 1-year chart ranges have something to
  // show — at 30 days those tabs render a stub and the screenshot looks broken.
  await Promise.all([
    setJSON(KEYS.food,      generateFoodEntries(90)),
    setJSON(KEYS.goals,     DEMO_MACRO_GOALS),
    setJSON(KEYS.water,     generateWater(90)),
    setJSON(KEYS.waterGoal, DEMO_WATER_GOAL_ML),
    setJSON(KEYS.weight,    generateWeightLog(180)),
    setJSON(KEYS.routines,  [generateRoutine()]),
    setJSON(KEYS.sleep,     generateSleep(90)),
    setJSON(KEYS.mood,      generateMood(90)),
  ]);
}

async function clearDemoData() {
  await AsyncStorage.multiRemove([
    KEYS.food, KEYS.goals, KEYS.water, KEYS.waterGoal,
    KEYS.weight, KEYS.routines, KEYS.sleep, KEYS.mood,
  ]);
}
