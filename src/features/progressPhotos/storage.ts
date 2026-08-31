import * as FileSystem from "expo-file-system/legacy";
import { getJSON, setJSON } from "../../lib/storage";
import { toISODay } from "../nutrition/storage";

export type ProgressPhoto = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  loggedAt: string; // ISO timestamp
  uri: string; // local file:// uri inside the app's document dir
};

const KEY = "@progress_photos";
const PHOTOS_DIR = FileSystem.documentDirectory + "progress-photos/";

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function loadPhotos(): Promise<ProgressPhoto[]> {
  return (await getJSON<ProgressPhoto[]>(KEY)) ?? [];
}

async function savePhotos(photos: ProgressPhoto[]) {
  await setJSON(KEY, photos);
}

/** Copies the source image into the app's document dir and adds an entry.
 *  If a photo for today exists, it's replaced (both metadata + on-disk file). */
export async function addPhoto(sourceUri: string, date?: string): Promise<ProgressPhoto> {
  await ensureDir();
  const day = date ?? toISODay();
  const id = `${Date.now()}`;
  const ext = sourceUri.split(".").pop()?.split("?")[0] ?? "jpg";
  const dest = `${PHOTOS_DIR}${day}-${id}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  const all = await loadPhotos();
  const existing = all.find((p) => p.date === day);
  if (existing) {
    // remove old file
    await FileSystem.deleteAsync(existing.uri, { idempotent: true });
  }
  const filtered = all.filter((p) => p.date !== day);
  const entry: ProgressPhoto = {
    id,
    date: day,
    loggedAt: new Date().toISOString(),
    uri: dest,
  };
  const next = [...filtered, entry].sort((a, b) => (a.date < b.date ? -1 : 1));
  await savePhotos(next);
  return entry;
}

export async function deletePhoto(id: string): Promise<void> {
  const all = await loadPhotos();
  const target = all.find((p) => p.id === id);
  if (target) await FileSystem.deleteAsync(target.uri, { idempotent: true });
  await savePhotos(all.filter((p) => p.id !== id));
}

export function todaysPhoto(all: ProgressPhoto[]): ProgressPhoto | null {
  const today = toISODay();
  return all.find((p) => p.date === today) ?? null;
}
