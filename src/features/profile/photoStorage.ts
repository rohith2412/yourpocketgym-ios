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
 * Copy a picked image somewhere durable.
 * Returns the value to persist on the user — a bare filename.
 */
export async function saveProfilePhoto(sourceUri: string): Promise<string> {
  await ensureDir();
  const ext = sourceUri.split(".").pop()?.split("?")[0]?.slice(0, 5) || "jpg";
  const name = `avatar-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: DIR + name });

  // Only ever keep the current one.
  await pruneExcept(name);
  return name;
}

/** Turn a stored value into something <Image> can render. */
export function resolveProfilePhoto(
  stored: string | null | undefined,
): string | undefined {
  if (!stored) return undefined;
  if (isRemote(stored)) return stored;
  // Legacy rows hold a full file:// path. Pass it through — it still works
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
    // Housekeeping only — never let this fail the save.
  }
}
