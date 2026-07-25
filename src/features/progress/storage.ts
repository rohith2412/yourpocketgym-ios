import { getJSON, setJSON } from "../../lib/storage";
import { toISODay } from "../nutrition/storage";

export type WeightEntry = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  loggedAt: string; // ISO timestamp
  lb: number;
};

const KEY = "@weight_log";

export async function loadWeightLog(): Promise<WeightEntry[]> {
  return (await getJSON<WeightEntry[]>(KEY)) ?? [];
}

export const saveWeightLog = (log: WeightEntry[]) => setJSON(KEY, log);

export async function addWeight(lb: number, date?: string): Promise<WeightEntry> {
  const log = await loadWeightLog();
  const d = date ?? toISODay();
  // one entry per day — replace if exists
  const filtered = log.filter((e) => e.date !== d);
  const entry: WeightEntry = {
    id: `${Date.now()}`,
    date: d,
    loggedAt: new Date().toISOString(),
    lb,
  };
  filtered.push(entry);
  filtered.sort((a, b) => (a.date < b.date ? -1 : 1));
  await saveWeightLog(filtered);
  return entry;
}

export function latestWeight(log: WeightEntry[]): WeightEntry | null {
  if (log.length === 0) return null;
  return log[log.length - 1];
}
