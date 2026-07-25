/**
 * Uploads a recorded audio file to the backend, which transcribes it with
 * Whisper and parses the transcript into structured sets using an LLM.
 *
 * Backend contract:
 *   POST /voice/parse
 *   multipart/form-data with field `audio` (m4a / wav / mp3)
 *   → 200 { transcript: string, exercises: ParsedExercise[] }
 */

import { API_BASE_URL } from "../../api/client";
import { getSecureToken } from "../../lib/storage";
import type { VoiceParseResponse } from "./types";

export async function parseVoice(audioUri: string): Promise<VoiceParseResponse> {
  const form = new FormData();
  // In RN, file uploads use this shape { uri, name, type }.
  form.append("audio", {
    uri: audioUri,
    name: "voice.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  const token = await getSecureToken();
  const res = await fetch(`${API_BASE_URL}/voice/parse`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Don't set Content-Type — the runtime adds the multipart boundary.
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`voice/parse failed (${res.status}): ${text}`);
  }
  return (await res.json()) as VoiceParseResponse;
}
