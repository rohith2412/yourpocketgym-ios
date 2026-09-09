/**
 * Session persistence — the one place that reads/writes the logged-in user.
 * Uses the v1 storage keys so users updating from v1 stay logged in.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  STORAGE_KEYS,
  saveSecureToken,
  removeSecureToken,
  getJSON,
  setJSON,
  clearStaleSubscriptionCache,
  clearUserScopedData,
} from "../../lib/storage";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  hasIntro?: boolean;
  photo?: string | null;
};

export type Session = { token: string; user: AuthUser };

export async function saveSession({ token, user }: Session) {
  // If a *different* account is signing in, drop the previous user's local
  // data first. Local storage is device-wide, so without this someone else's
  // food, weight and chat history would surface under the new login.
  // Same-user re-logins are left alone so nothing is lost on a routine
  // sign-out/sign-in.
  const previous = await getJSON<AuthUser>(STORAGE_KEYS.user);
  if (previous?.id && previous.id !== user.id) {
    await clearUserScopedData();
  } else if (!previous?.id) {
    // No stored user record, but scoped data on disk means either a v1 install
    // that never wrote one, or the "sign out didn't clear scoped data" leak
    // this file used to have. Either way, wipe rather than adopt it.
    await clearUserScopedData();
  }

  await saveSecureToken(token);
  await AsyncStorage.setItem(STORAGE_KEYS.token, token);
  await setJSON(STORAGE_KEYS.user, user);
  await clearStaleSubscriptionCache();
}

export async function loadUser(): Promise<AuthUser | null> {
  return getJSON<AuthUser>(STORAGE_KEYS.user);
}

export async function clearSession() {
  // Wipe scoped data at sign-out, not only on account-switch inside
  // saveSession. Otherwise: user A signs out (token + user cleared), user B
  // signs up on the same device — the "different id" check in saveSession
  // finds no previous user record, decides nothing needs clearing, and B
  // lands into A's food, weight, routines, and everything else.
  await clearUserScopedData();
  await removeSecureToken();
  await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
}
