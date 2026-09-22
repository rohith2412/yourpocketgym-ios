import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchReferralStatus, redeemReferralCode } from "./api";

const KEY = ["referrals", "mine"] as const;

export function useReferralStatus() {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchReferralStatus,
    // Cheap request but changes rarely — the balance only moves when a
    // friend logs a meal, so 60s of staleness is fine.
    staleTime: 60_000,
  });
}

export function useRedeemCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemReferralCode(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
