/**
 * Uploads a recorded audio file to the backend, which transcribes it with
 * Whisper and parses the transcript into structured sets using an LLM.
 *
 * Backend contract:
 *   POST /voice/parse
 *   multipart/form-data with field `audio` (m4a / wav / mp3)
 *   → 200 { transcript: string, exercises: ParsedExercise[] }
 */

import { api } from "../../api/client";
import type { VoiceParseResponse } from "./types";

export async function parseVoice(audioUri: string): Promise<VoiceParseResponse> {
  const form = new FormData();
  // In RN, file uploads use this shape { uri, name, type }.
  form.append("audio", {
    uri: audioUri,
    name: "voice.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  return api.upload<VoiceParseResponse>("/voice/parse", form);
}
