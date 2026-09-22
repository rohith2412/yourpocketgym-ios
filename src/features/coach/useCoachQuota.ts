import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJSON, setJSON } from "../../lib/storage";
import { toISODay } from "../nutrition/storage";

/** Daily message caps per plan. Server enforces the real limit; this is UX. */
export const COACH_LIMITS = { free: 5, premium: 50 } as const;

type Usage = { date: string; count: number };

const KEY = "@coach_usage";
const QKEY = ["coach-usage"] as const;

async function loadUsage(): Promise<Usage> {
  const raw = (await getJSON<Usage>(KEY)) ?? { date: toISODay(), count: 0 };
  // Reset if the stored date isn't today
  if (raw.date !== toISODay()) return { date: toISODay(), count: 0 };
  return raw;
}

export function useCoachQuota(plan: "free" | "premium") {
  const qc = useQueryClient();
  const limit = COACH_LIMITS[plan];
  const { data: usage } = useQuery({ queryKey: QKEY, queryFn: loadUsage });
  const count = usage?.count ?? 0;
  const remaining = Math.max(0, limit - count);
  const hasQuota = remaining > 0;

  const bump = useMutation({
    mutationFn: async () => {
      const cur = await loadUsage();
      const next: Usage = { date: cur.date, count: cur.count + 1 };
      await setJSON(KEY, next);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });

  const consume = useCallback(() => {
    bump.mutate();
  }, [bump]);

  return { limit, count, remaining, hasQuota, consume };
}
