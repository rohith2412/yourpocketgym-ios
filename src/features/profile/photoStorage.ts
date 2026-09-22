/**
 * Persistence for the profile photo.
 *
 * Two things bite you if you just keep the URI the image picker hands back:
 *
 *  1. That URI points into the app's *cache*. iOS reclaims cache whenever it
 *     wants storage back, so the file quietly vanishes after a few days and the
 *     avatar goes blank. Photos have to be copied somewhere durable.
 *
 *  2. Even in the documents directory, the absolute path contains the app
 *     container's UUID, and that UUID changes on some app updates and on
 *     restore-from-backup. So we store only the *filename* and rebuild the full
 *     path on read.
 *
 * Google avatars are plain https URLs and pass through untouched.
 */

import * as FileSystem from "expo-file-system/legacy";
import { uploadImageToR2 } from "../../lib/r2Upload";

const DIR = FileSystem.documentDirectory + "profile/";

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

const isRemote = (v: string) => /^https?:\/\//i.test(v);
const isAbsolute = (v: string) => v.startsWith("file://");

/**
 * Save a picked avatar. Uploads to R2 so it survives reinstalls and
 * syncs across devices; falls back to a durable local copy when the
 * upload fails so the picture doesn't disappear.
 *
 * Returns the value we persist on the user record — an https:// R2 URL
 * in the happy path, a bare filename otherwise. The `resolveProfilePhoto`
 * helper below handles both.
 */
export async function saveProfilePhoto(sourceUri: string): Promise<string> {
  try {
    const publicUrl = await uploadImageToR2(sourceUri, "profile");
    // Clear any old local avatars — we now serve from R2.
    await pruneExcept("");
    return publicUrl;
  } catch {
    // Offline / R2 down — fall through to the durable local copy.
    await ensureDir();
    const ext = sourceUri.split(".").pop()?.split("?")[0]?.slice(0, 5) || "jpg";
    const name = `avatar-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: DIR + name });
    await pruneExcept(name);
    return name;
  }
}

/** Turn a stored value into something <Image> can render. */
export function resolveProfilePhoto(
  stored: string | null | undefined,
): string | undefined {
  if (!stored) return undefined;
  if (isRemote(stored)) return stored;
  // Legacy rows hold a full file:// path. Pass it through - it still works
  // until the container moves, and there's nothing better we can do for it.
  if (isAbsolute(stored)) return stored;
  return DIR + stored;
}

export async function deleteProfilePhoto(stored: string | null | undefined) {
  if (!stored || isRemote(stored)) return;
  const uri = resolveProfilePhoto(stored);
  if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
}

/** Drop every avatar file except the one just written. */
async function pruneExcept(keep: string) {
  try {
    const files = await FileSystem.readDirectoryAsync(DIR);
    await Promise.all(
      files
        .filter((f) => f !== keep)
        .map((f) => FileSystem.deleteAsync(DIR + f, { idempotent: true })),
    );
  } catch {
    // Housekeeping only - never let this fail the save.
  }
}
