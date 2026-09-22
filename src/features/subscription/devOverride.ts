/**
 * Dev-only plan override. Stored locally so you can flip free ⇄ premium
 * without touching code. Read by useEntitlement; toggled from the Profile page.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJSON, setJSON } from "../../lib/storage";

const KEY = "@dev_force_premium";

export async function loadDevPremium(): Promise<boolean> {
  return (await getJSON<boolean>(KEY)) ?? false;
}

export async function saveDevPremium(v: boolean) {
  await setJSON(KEY, v);
}

const QKEY = ["dev-premium"] as const;

export function useDevPremium() {
  return useQuery({ queryKey: QKEY, queryFn: loadDevPremium });
}

export function useSetDevPremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: boolean) => saveDevPremium(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}
