import { getJSON, setJSON } from "../../lib/storage";
import type { Plan } from "./types";

const KEY = "@meal_plan";

export async function loadPlan(): Promise<Plan | null> {
  return (await getJSON<Plan>(KEY)) ?? null;
}

export const savePlan = (plan: Plan) => setJSON(KEY, plan);
export const clearPlan = () => setJSON(KEY, null as unknown as Plan);
