// Shared reactive read of the logged-in user. Every screen that shows the
// name / avatar should use this so an edit in Edit Profile invalidates the
// cache and everyone re-renders with the new value.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadUser, saveSession, type AuthUser } from "./session";
import { getSecureToken } from "../../lib/storage";

export const CURRENT_USER_QK = ["auth", "currentUser"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QK,
    queryFn: loadUser,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AuthUser>): Promise<AuthUser> => {
      const current = await loadUser();
      if (!current) throw new Error("Not signed in");
      const token = (await getSecureToken()) ?? "";
      const next: AuthUser = { ...current, ...patch };
      await saveSession({ token, user: next });
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(CURRENT_USER_QK, next);
    },
  });
}
