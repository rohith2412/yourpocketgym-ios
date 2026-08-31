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

export type PhotoAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export async function analyzeFoodPhoto(photoUri: string): Promise<PhotoAnalysis> {
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
