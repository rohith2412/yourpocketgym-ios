import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addWeight, loadWeightLog } from "./storage";

const KEYS = { weight: ["weight-log"] as const };

export function useWeightLog() {
  return useQuery({ queryKey: KEYS.weight, queryFn: loadWeightLog });
}

export function useAddWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lb, date }: { lb: number; date?: string }) => addWeight(lb, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.weight }),
  });
}
