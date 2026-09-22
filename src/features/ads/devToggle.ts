/**
 * Admin-only "kill switch" for ads. Stored locally so the admin can toggle
 * ads off without a code change or a new build. Read by `AdBanner` and
 * `useInterstitial`; toggled from the Admin screen.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJSON, setJSON } from "../../lib/storage";

const KEY = "@dev_ads_disabled";

export async function loadAdsDisabled(): Promise<boolean> {
  return (await getJSON<boolean>(KEY)) ?? false;
}

export async function saveAdsDisabled(v: boolean) {
  await setJSON(KEY, v);
}

const QKEY = ["dev-ads-disabled"] as const;

export function useAdsDisabled() {
  return useQuery({ queryKey: QKEY, queryFn: loadAdsDisabled });
}

export function useSetAdsDisabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: boolean) => saveAdsDisabled(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}
