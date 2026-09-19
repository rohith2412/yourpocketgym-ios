/**
 * Dev toggle for mock photo-scan mode. When ON, `analyzeFoodPhoto` returns
 * a fake result instead of hitting the OpenAI vision API — zero cost while
 * iterating on the UI. Toggled from the admin/dev section.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJSON, setJSON } from "../../../lib/storage";

const KEY = "@mock_photo_scan";

/** Sync read — used from the non-React `analyzeFoodPhoto` call site. */
let cached: boolean | null = null;

export async function isMockPhotoOn(): Promise<boolean> {
  if (cached !== null) return cached;
  const v = (await getJSON<boolean>(KEY)) ?? false;
  cached = v;
  return v;
}

export async function saveMockPhoto(v: boolean) {
  cached = v;
  await setJSON(KEY, v);
}

const QKEY = ["mock-photo-scan"] as const;

export function useMockPhoto() {
  return useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const v = (await getJSON<boolean>(KEY)) ?? false;
      cached = v;
      return v;
    },
  });
}

export function useSetMockPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: boolean) => saveMockPhoto(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}
