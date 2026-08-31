import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pullSnapshot, pushSnapshot } from "./api";
import {
  applySnapshot,
  collectSnapshot,
  getLastSyncedAt,
  setLastSyncedAt,
} from "./snapshot";

const LAST_SYNCED_QK = ["sync", "lastSyncedAt"];

/** ISO of the last successful sync, or null. Live-updates after each sync. */
export function useLastSyncedAt() {
  return useQuery({
    queryKey: LAST_SYNCED_QK,
    queryFn: getLastSyncedAt,
    staleTime: 0,
  });
}

/**
 * Two-way sync: push the local snapshot, then pull whatever is now authoritative
 * on the server and re-apply it locally. Both directions in one action so the
 * user's tap always ends with device == server. Also invalidates feature caches
 * so screens re-read the freshly applied data.
 */
export function useSyncNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const snap = await collectSnapshot();
      await pushSnapshot(snap);
      const pulled = await pullSnapshot();
      if (pulled.data) await applySnapshot(pulled.data);
      const iso = new Date().toISOString();
      await setLastSyncedAt(iso);
      return iso;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: LAST_SYNCED_QK });
      // Feature caches that read local state:
      await qc.invalidateQueries({ queryKey: ["routines"] });
      await qc.invalidateQueries({ queryKey: ["food"] });
      await qc.invalidateQueries({ queryKey: ["water"] });
      await qc.invalidateQueries({ queryKey: ["weightLog"] });
      await qc.invalidateQueries({ queryKey: ["macroGoals"] });
      // Training/workout logs already live server-side via /tracking — refetch
      // so "Sync now" fully refreshes the Train tab too.
      await qc.invalidateQueries({ queryKey: ["trainingLogs"] });
      await qc.invalidateQueries({ queryKey: ["tracking"] });
      // Restored profile — refresh anyone reading useCurrentUser.
      await qc.invalidateQueries({ queryKey: ["auth", "currentUser"] });
    },
  });
}
