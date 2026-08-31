/**
 * Uploads a recorded clip to the backend, which transcribes it with Whisper
 * and parses the transcript into food entries and a water total.
 *
 * One endpoint handles both because people say them together — "chicken salad
 * and a couple of glasses of water" is a single utterance, not two.
 *
 * Backend contract:
 *   POST /voice/nutrition
 *   multipart/form-data with field `audio` (m4a / wav / mp3)
 *   → 200 { transcript: string, foods: ParsedFood[], waterMl: number }
 */

import { api } from "../../../api/client";
import type { VoiceNutritionResponse } from "./types";

export async function parseVoiceNutrition(
  audioUri: string,
): Promise<VoiceNutritionResponse> {
  const form = new FormData();
  // In RN, file uploads use this shape { uri, name, type }.
  form.append("audio", {
    uri: audioUri,
    name: "voice.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  return api.upload<VoiceNutritionResponse>("/voice/nutrition", form);
}
