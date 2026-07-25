import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
} from "expo-audio";

/**
 * Thin wrapper around expo-audio's recorder. Handles permission, start/stop,
 * and returns the recorded file URI when stopped.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const startedAt = useRef<number | null>(null);

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
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAt.current = Date.now();
    setDurationMs(0);
    setIsRecording(true);
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null;
    await recorder.stop();
    setIsRecording(false);
    startedAt.current = null;
    return recorder.uri ?? null;
  }, [isRecording, recorder]);

  return { start, stop, isRecording, durationMs, uri: recorder.uri };
}
