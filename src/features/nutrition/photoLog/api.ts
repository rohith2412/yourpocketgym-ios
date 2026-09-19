/**
 * Uploads a food photo to the backend, which uses a vision LLM to identify
 * the meal and estimate its nutrition.
 *
 * Backend contract:
 *   POST /nutrition-goals/photo
 *   multipart/form-data with field `photo` (jpeg / png)
 *   → 200 { name: string, calories: number, protein: number, carbs: number, fat: number }
 */

import { API_BASE_URL } from "../../../api/client";
import { getSecureToken } from "../../../lib/storage";
import { isMockPhotoOn } from "./mockMode";

export type PhotoAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Mock mode is now controlled at runtime by the admin toggle — see
 * `useMockPhoto()`. When ON, `analyzeFoodPhoto` returns a fake result after
 * a short delay instead of hitting the backend vision API.
 */

/**
 * A rotating pool of plausible results so the UI doesn't get boring while
 * you tap through. Cycles per call.
 */
const MOCK_POOL: PhotoAnalysis[] = [
  { name: "Grilled chicken with rice", calories: 620, protein: 55, carbs: 65, fat: 14 },
  { name: "Cheeseburger and fries",    calories: 940, protein: 32, carbs: 78, fat: 52 },
  { name: "Salmon and broccoli",       calories: 480, protein: 42, carbs: 18, fat: 26 },
  { name: "Chicken caesar salad",      calories: 550, protein: 38, carbs: 22, fat: 34 },
  { name: "Protein oatmeal bowl",      calories: 410, protein: 30, carbs: 52, fat: 9 },
  { name: "Sushi platter",             calories: 720, protein: 34, carbs: 92, fat: 18 },
];
let mockCursor = 0;

export async function analyzeFoodPhoto(photoUri: string): Promise<PhotoAnalysis> {
  if (await isMockPhotoOn()) {
    // Simulate the ~1.5s the real vision call takes so loading states get exercised.
    await new Promise((r) => setTimeout(r, 1500));
    const pick = MOCK_POOL[mockCursor % MOCK_POOL.length];
    mockCursor += 1;
    return pick;
  }

  const form = new FormData();
  form.append("photo", {
    uri: photoUri,
    name: "food.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const token = await getSecureToken();
  const res = await fetch(`${API_BASE_URL}/nutrition-goals/photo`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`nutrition-goals/photo failed (${res.status}): ${text}`);
  }
  return (await res.json()) as PhotoAnalysis;
}
