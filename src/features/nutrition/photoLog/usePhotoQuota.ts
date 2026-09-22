import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJSON, setJSON } from "../../../lib/storage";
import { toISODay } from "../storage";

/** Daily cap for AI photo analysis. Only counts photo uploads. */
export const PHOTO_LOG_DAILY_LIMIT = 5;

type Usage = { date: string; count: number };

const KEY = "@photo_log_usage";
const QKEY = ["photo-log-usage"] as const;

async function loadUsage(): Promise<Usage> {
  const raw = (await getJSON<Usage>(KEY)) ?? { date: toISODay(), count: 0 };
  if (raw.date !== toISODay()) return { date: toISODay(), count: 0 };
  return raw;
}

export function usePhotoQuota() {
  const qc = useQueryClient();
  const { data: usage } = useQuery({ queryKey: QKEY, queryFn: loadUsage });
  const count = usage?.count ?? 0;
  const limit = PHOTO_LOG_DAILY_LIMIT;
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
