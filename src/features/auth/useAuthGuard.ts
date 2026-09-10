/**
 * Redirect to /welcome whenever the session is missing.
 *
 * Mount this at the top of every screen that assumes a signed-in user
 * (tabs, profile, admin, coach). It's cheap — one AsyncStorage read on
 * mount, then a re-check every time the app comes back to the foreground.
 *
 * Why do we need this in addition to the sign-out button routing to
 * /welcome? Because a session can end without a UI action — an expired
 * token producing 401s, `clearSession` called from another screen, a fresh
 * install landing in a stale route — and in every one of those cases
 * screens were falling back to placeholder names ("Athlete") instead of
 * bouncing the user out.
 */

import { useEffect } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { STORAGE_KEYS, getSecureToken } from "../../lib/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CURRENT_USER_QK } from "./useCurrentUser";

const AUTH_QK = ["auth", "token"] as const;

async function readToken(): Promise<string | null> {
  // Secure storage is authoritative — that's what the API client actually
  // sends. The AsyncStorage mirror exists only so a v1-era install can find
  // its token; check it too, or a first-launch guard fires before the
  // secure store is warmed.
  const secure = await getSecureToken();
  if (secure) return secure;
  return AsyncStorage.getItem(STORAGE_KEYS.token);
}

export function useAuthGuard() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: token, isLoading } = useQuery({
    queryKey: AUTH_QK,
    queryFn: readToken,
    staleTime: 30_000,
  });

  // On foreground, re-check — a token can be cleared by a 401 handler or by
  // another screen while this one was backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        qc.invalidateQueries({ queryKey: AUTH_QK });
        qc.invalidateQueries({ queryKey: CURRENT_USER_QK });
      }
    });
    return () => sub.remove();
  }, [qc]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/welcome" as never);
    }
  }, [isLoading, token, router]);

  return { isSignedIn: !!token, isLoading };
}

/**
 * Call after clearSession() so any component reading useCurrentUser /
 * useAuthGuard re-derives immediately instead of holding onto the cached
 * "Athlete" fallback until the next natural refetch.
 */
export async function invalidateAuthCaches(qc: {
  invalidateQueries: (o: { queryKey: readonly unknown[] }) => Promise<unknown> | void;
  removeQueries: (o: { queryKey: readonly unknown[] }) => void;
}) {
  qc.removeQueries({ queryKey: AUTH_QK });
  qc.removeQueries({ queryKey: CURRENT_USER_QK });
}
