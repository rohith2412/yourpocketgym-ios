import { AppState, Platform } from "react-native";

/**
 * Ask iOS for App Tracking Transparency permission.
 *
 * Why the wait-for-active dance:
 * iOS silently drops requestTrackingAuthorization when the app is not in
 * the foreground-active scene state. On iPadOS (Apple review runs on iPad
 * Air 11") the scene stays .inactive for a moment after cold-launch while
 * the window is being sized and system chrome is finishing its animation,
 * so a request fired from a mount-effect right after JS boot never shows
 * the sheet. That is exactly what Apple flagged on Guideline 2.1 for 2.3.1
 * -- the framework is linked and called, but nothing renders.
 *
 * Flow:
 *   1. Skip in __DEV__ (Metro binaries may not have the native module
 *      linked; loading its wrapper crashes with "Cannot find native module").
 *   2. Wait until AppState is "active" -- either already, or on the first
 *      transition. 20s watchdog so we never leak.
 *   3. Small settle delay (350ms) after active -- iPad ATT sheet fails to
 *      present when fired on the same runloop tick as the state change.
 *   4. Only ask when status is "undetermined" -- re-asking after a "denied"
 *      is a policy violation and iOS silently no-ops it anyway.
 */
export async function requestATTPermission(): Promise<void> {
  if (__DEV__) return;
  if (Platform.OS !== "ios") return;

  let mod: typeof import("expo-tracking-transparency") | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require("expo-tracking-transparency");
  } catch {
    return;
  }
  if (!mod) return;

  await waitForActive();
  await sleep(350);

  try {
    const { status } = await mod.getTrackingPermissionsAsync();
    if (status === "undetermined") {
      await mod.requestTrackingPermissionsAsync();
    }
  } catch {
    // Native call failed -- swallow so we never crash app boot.
  }
}

function waitForActive(): Promise<void> {
  if (AppState.currentState === "active") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(watchdog);
      resolve();
    };
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") finish();
    });
    const watchdog = setTimeout(finish, 20_000);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
