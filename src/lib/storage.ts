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

/**
 * Every AsyncStorage key that belongs to a specific user rather than to the
 * device. Wiped when a *different* account signs in, so one person's food,
 * weight and chat history can never surface under someone else's login.
 *
 * Deliberately excludes device preferences (`themeMode`) and the dev override,
 * which should survive an account switch.
 */
export const USER_SCOPED_KEYS = [
  // Nutrition
  "@food_entries",
  "@macro_goals",
  "@water_state",
  "@water_goal_ml",
  "@meal_plan",
  // Training
  "@routines",
  // Body
  "@weight_log",
  "@progress_photos",
  "@photo_log_usage",
  // Recovery
  "@sleep_log",
  "@mood_log",
  // Coach
  "@coach_messages",
  "@coach_usage",
  // Onboarding / sync bookkeeping
  "@user_region",
  "@last_synced_at",
  "@demo_mode",
] as const;

/** Wipe all per-user local data. Pro users get theirs back from the cloud
 *  snapshot on next sync; free users start clean, which is the correct
 *  outcome when the account has actually changed. */
export async function clearUserScopedData() {
  await AsyncStorage.multiRemove([...USER_SCOPED_KEYS]);
}

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
