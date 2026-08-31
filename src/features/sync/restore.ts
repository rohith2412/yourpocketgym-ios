// Called right after login succeeds — pulls the user's cloud snapshot and
// applies it locally. Fire-and-forget: any network/parse failure is swallowed
// so a shaky connection can never block sign-in.

import { pullSnapshot } from "./api";
import { applySnapshot, setLastSyncedAt } from "./snapshot";

export async function restoreFromCloud(): Promise<boolean> {
  try {
    const res = await pullSnapshot();
    if (!res?.data) return false;
    await applySnapshot(res.data as any);
    await setLastSyncedAt(new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
