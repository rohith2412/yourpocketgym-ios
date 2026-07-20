/**
 * Central registry of every persistence key the app uses.
 *
 * IMPORTANT: these match v1 exactly. Existing users who update from v1 already
 * have data under these keys — changing them would silently log people out or
 * lose their state. Add new keys here; never rename an existing one without a
 * migration.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const STORAGE_KEYS = {
  // Auth (v1 stored the JWT in BOTH SecureStore and AsyncStorage)
  secureToken: "userToken", // SecureStore
  token: "token", // AsyncStorage
  user: "user", // AsyncStorage — JSON user object

  // Onboarding
  pendingIntro: "@pending_intro",

  // Preferences
  themeMode: "themeMode",
} as const;

// ── Secure token (SecureStore) ────────────────────────────────────────────────
export const saveSecureToken = (t: string) =>
  SecureStore.setItemAsync(STORAGE_KEYS.secureToken, t);
export const getSecureToken = () =>
  SecureStore.getItemAsync(STORAGE_KEYS.secureToken);
export const removeSecureToken = () =>
  SecureStore.deleteItemAsync(STORAGE_KEYS.secureToken);

// ── JSON helpers (AsyncStorage) ───────────────────────────────────────────────
export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
export const setJSON = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

// ── Clear all subscription cache (v1 prefixed keys) ───────────────────────────
export async function clearStaleSubscriptionCache() {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(
    (k) =>
      k.startsWith("subscriptionStatus_") ||
      k.startsWith("subscriptionStatusTime_"),
  );
  if (stale.length) await AsyncStorage.multiRemove(stale);
}
