import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

/**
 * Thin wrapper around expo-audio's recorder. Handles permission, start/stop,
 * and returns the recorded file URI when stopped.
 */
/**
 * Hard cap on how long we'll record before auto-stopping and refusing to
 * upload. Rate-limit at the source: cheap AI is not the same as free AI, and
 * a runaway hot mic is the shape of both a cost blow-up and a poor UX (the
 * backend times out on long clips before we get anything useful back).
 */
export const MAX_RECORDING_MS = 60_000;

export function useVoiceRecorder() {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const state = useAudioRecorderState(recorder, 60);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const startedAt = useRef<number | null>(null);
  const peakLevelRef = useRef(0);
  // metering: normalized 0..1 amplitude, updated ~16fps
  const metering = state.metering ?? -160;
  // Convert dB (-160..0) into 0..1 amplitude (soft floor)
  const level = Math.max(0, Math.min(1, (metering + 60) / 60));

  // Track peak level while recording so we can reject silent takes.
  useEffect(() => {
    if (isRecording && level > peakLevelRef.current) {
      peakLevelRef.current = level;
    }
  }, [level, isRecording]);

  // Poll duration while recording (cheap 100ms tick) and enforce the cap.
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      if (startedAt.current === null) return;
      const elapsed = Date.now() - startedAt.current;
      setDurationMs(elapsed);
      if (elapsed >= MAX_RECORDING_MS) {
        // Auto-stop. Callers detect the cap via stop()'s `tooLong` flag and
        // abort the upload — we deliberately don't send truncated audio, since
        // a half-cut sentence tends to parse to garbage on the backend.
        recorder.stop().catch(() => {});
        setIsRecording(false);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isRecording, recorder]);

  const start = useCallback(async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      throw new Error("Microphone permission denied");
    }
    // iOS requires recording explicitly enabled on the shared audio session.
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAt.current = Date.now();
    peakLevelRef.current = 0;
    setDurationMs(0);
    setIsRecording(true);
  }, [recorder]);

  /** Result: null if not recording, otherwise the file uri + captured stats. */
  const stop = useCallback(async (): Promise<{
    uri: string | null;
    durationMs: number;
    peakLevel: number;
    /** True when the cap fired. Callers should NOT upload in that case. */
    tooLong: boolean;
  } | null> => {
    if (!isRecording) return null;
    const totalMs =
      startedAt.current !== null ? Date.now() - startedAt.current : durationMs;
    await recorder.stop();
    // Release the recording session so playback etc. works normally afterward.
    await setAudioModeAsync({ allowsRecording: false });
    setIsRecording(false);
    startedAt.current = null;
    return {
      uri: recorder.uri ?? null,
      durationMs: totalMs,
      peakLevel: peakLevelRef.current,
      tooLong: totalMs >= MAX_RECORDING_MS,
    };
  }, [isRecording, recorder, durationMs]);

  return { start, stop, isRecording, durationMs, level, uri: recorder.uri };
}
