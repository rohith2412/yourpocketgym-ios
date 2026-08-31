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

  // Poll duration while recording (cheap 100ms tick)
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      if (startedAt.current !== null) {
        setDurationMs(Date.now() - startedAt.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isRecording]);

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
    };
  }, [isRecording, recorder, durationMs]);

  return { start, stop, isRecording, durationMs, level, uri: recorder.uri };
}
