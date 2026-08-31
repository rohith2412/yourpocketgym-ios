// Full-device snapshot for Pro cloud sync — grabs every AsyncStorage key
// except the ones that are auth/device-specific/dev-only. Whole-blob,
// last-write-wins. Applying just writes every key back.
// Also pulls server-side training logs so they're part of the same backup.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../api/client";

const LAST_SYNCED_KEY = "@last_synced_at";

/** Keys we never sync. Auth token / RC cache / dev-only / per-device quotas.
 *  The "user" profile object (name, email, hasIntro, photo) IS synced so
 *  edits made offline propagate to other devices on the next sync — the
 *  server-side snapshot is scoped to userId, so it can only ever contain
 *  the same account's own user object. */
const DENYLIST = new Set<string>([
  // Auth token (also in SecureStore)
  "token",
  "userToken",
  // Sync bookkeeping
  LAST_SYNCED_KEY,
  // Per-device quotas — must not carry across devices
  "@coach_usage",
  "@photo_log_usage",
  // Dev-only override
  "@dev_force_premium",
  // Onboarding gate lives with the device that just installed
  "@pending_intro",
]);

const DENY_PREFIXES = [
  "subscriptionStatus_",     // RevenueCat cache (per device/store)
  "subscriptionStatusTime_",
];

function isSyncable(key: string): boolean {
  if (DENYLIST.has(key)) return false;
  if (DENY_PREFIXES.some((p) => key.startsWith(p))) return false;
  return true;
}

export type SyncSnapshot = {
  schema: 2;
  /** Raw AsyncStorage key → value (both strings, values are JSON-encoded strings). */
  blob: Record<string, string>;
  /** Server-side workout logs snapshot at push time. Read-only backup — restore
   *  doesn't replay these into /tracking (that would create duplicates); they're
   *  here so an account wipe can still be reconstructed. */
  training?: unknown[];
};

export async function collectSnapshot(): Promise<SyncSnapshot> {
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys.filter(isSyncable);
  const [entries, training] = await Promise.all([
    AsyncStorage.multiGet(keys),
    fetchTrainingLogs(),
  ]);
  const blob: Record<string, string> = {};
  for (const [k, v] of entries) if (v != null) blob[k] = stripDeviceLocal(k, v);
  return { schema: 2, blob, training };
}

/** Strip fields that only make sense on the device they were created on
 *  (currently: user.photo — a file:// URI that another device can't resolve). */
function stripDeviceLocal(key: string, value: string): string {
  if (key !== "user") return value;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && "photo" in parsed) {
      delete parsed.photo;
      return JSON.stringify(parsed);
    }
  } catch { /* leave as-is */ }
  return value;
}

async function fetchTrainingLogs(): Promise<unknown[]> {
  try {
    const res = await api.get<{ success: boolean; data: unknown[] }>(
      "/tracking?limit=1000",
    );
    return Array.isArray(res?.data) ? res.data : [];
  } catch {
    // Sync should still succeed if training fetch flakes — the source of truth
    // is the server anyway, so we just skip the redundant backup this round.
    return [];
  }
}

export async function applySnapshot(snap: SyncSnapshot | null | undefined) {
  if (!snap) return;

  // v1 (older) snapshots stored named fields; v2 is a raw AsyncStorage blob.
  if ((snap as any).schema === 1) return applyLegacyV1(snap as any);
  if (snap.schema !== 2 || !snap.blob) return;

  // Preserve device-local photo across restore — the incoming snapshot never
  // has one (stripped on push), and we don't want to blow away what the user
  // set on this device.
  const existingUserRaw = await AsyncStorage.getItem("user");
  const existingPhoto = extractPhoto(existingUserRaw);

  const pairs: [string, string][] = Object.entries(snap.blob)
    .filter(([k]) => isSyncable(k))
    .map(([k, v]): [string, string] => {
      if (k === "user" && existingPhoto) return [k, mergePhoto(String(v), existingPhoto)];
      return [k, String(v)];
    });
  if (pairs.length) await AsyncStorage.multiSet(pairs);
}

function extractPhoto(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.photo === "string" ? parsed.photo : null;
  } catch { return null; }
}

function mergePhoto(userJson: string, photo: string): string {
  try {
    const parsed = JSON.parse(userJson);
    if (parsed && typeof parsed === "object") {
      parsed.photo = photo;
      return JSON.stringify(parsed);
    }
  } catch { /* fall through */ }
  return userJson;
}

async function applyLegacyV1(snap: any) {
  // Named fields → raw AsyncStorage keys (matches storage.ts constants).
  const map: Record<string, unknown> = {
    "@routines": snap.routines,
    "@food_entries": snap.food,
    "@water_state": snap.water,
    "@water_goal_ml": snap.waterGoal,
    "@macro_goals": snap.macroGoals,
    "@weight_log": snap.weights,
  };
  const pairs: [string, string][] = [];
  for (const [k, v] of Object.entries(map)) {
    if (v == null) continue;
    pairs.push([k, JSON.stringify(v)]);
  }
  if (pairs.length) await AsyncStorage.multiSet(pairs);
}

// ── Last-synced timestamp (local display only) ──────────────────────────────
export async function getLastSyncedAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNCED_KEY);
}
export async function setLastSyncedAt(iso: string) {
  await AsyncStorage.setItem(LAST_SYNCED_KEY, iso);
}
