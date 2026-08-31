import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { findRegion, REGIONS, type Region } from "./regions";

const KEY = "@user_region";
const QK = ["region"] as const;

/** Best-effort default region from the device locale, falling back to US. */
function detectRegion(): Region {
  try {
    // @ts-expect-error Intl.Locale exists on modern engines
    const region = new Intl.Locale(undefined).region ?? Intl?.DateTimeFormat?.().resolvedOptions?.().locale?.split("-")?.[1];
    const found = findRegion((region ?? "").toUpperCase());
    if (found) return found;
  } catch { /* ignore */ }
  return REGIONS[0]; // United States
}

export function useRegion() {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<Region> => {
      const stored = await AsyncStorage.getItem(KEY);
      return findRegion(stored) ?? detectRegion();
    },
    staleTime: Infinity,
  });
}

export function useSetRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      await AsyncStorage.setItem(KEY, code);
      return findRegion(code) ?? REGIONS[REGIONS.length - 1];
    },
    onSuccess: (r) => qc.setQueryData(QK, r),
  });
}

export const REGION_DEFAULT = detectRegion();
