import { useEffect, useState } from "react";
import { View, Pressable, Alert, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { parseVoice } from "./api";
import type { ParsedExercise } from "./types";
import { useSaveWorkout, type TrackedSet } from "../train/api";
import { toISODay } from "../nutrition/storage";
import { VoiceOrb } from "./VoiceOrb";

type Props = { visible: boolean; onClose: () => void };

export function VoiceLogSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const recorder = useVoiceRecorder();
  const save = useSaveWorkout();

  const [parsed, setParsed] = useState<ParsedExercise[] | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const [hint, setHint] = useState<string | null>(null);
  const parseM = useMutation({
    mutationFn: (uri: string) => parseVoice(uri),
    onSuccess: (res) => {
      setTranscript(res.transcript);
      setParsed(res.exercises);
      if (!res.transcript.trim() || res.exercises.length === 0) {
        setHint("Couldn't hear a workout in that. Try again.");
      }
    },
    onError: (err: Error) => Alert.alert("Couldn't parse", err.message),
  });

  useEffect(() => {
    if (!visible) {
      // If we're mid-recording when the sheet closes, cancel it (don't parse)
      if (recorder.isRecording) {
        recorder.stop().catch(() => {});
      }
      setParsed(null);
      setTranscript("");
      setHint(null);
    }
    // Only re-run when visibility flips
  }, [visible]);

  // Wrap close so tapping X or the backdrop also cancels an in-flight recording
  const handleClose = () => {
    if (recorder.isRecording) {
      recorder.stop().catch(() => {});
    }
    onClose();
  };

  // Client-side gate: skip the API when the take is obviously not usable.
  const MIN_DURATION_MS = 1200; // < 1.2s = accidental tap
  const MIN_PEAK_LEVEL = 0.18; // never got loud enough = silence / muffled

  const onMicPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (recorder.isRecording) {
      const result = await recorder.stop();
      if (!result || !result.uri) return;
      if (result.durationMs < MIN_DURATION_MS) {
        setHint("Too short - hold on longer and say a set.");
        return;
      }
      if (result.peakLevel < MIN_PEAK_LEVEL) {
        setHint("Didn't hear anything. Try again.");
        return;
      }
      setHint(null);
      parseM.mutate(result.uri);
    } else {
      setParsed(null);
      setTranscript("");
      setHint(null);
      try {
        await recorder.start();
      } catch (err: any) {
        Alert.alert("Mic unavailable", err.message ?? String(err));
      }
    }
  };

  const onSave = () => {
    if (!parsed || parsed.length === 0) return;
    save.mutate(
      {
        date: toISODay(),
        exercises: parsed.map((ex) => ({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: ex.sets.map((s, i): TrackedSet => ({ setNumber: i + 1, reps: s.reps, weight: s.weight })),
        })),
        notes: transcript ? `voice: "${transcript}"` : undefined,
      },
      { onSuccess: onClose },
    );
  };

  const busy = parseM.isPending;
  const durationSec = Math.floor(recorder.durationMs / 1000);
  const statusLabel = busy
    ? "Transcribing…"
    : recorder.isRecording
    ? `Listening · ${durationSec}s`
    : parsed
    ? "Tap orb to try again"
    : "Tap the orb to speak";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={handleClose}
    >
     <View style={{ flex: 1, backgroundColor: c.bg }}>


        {/* Close */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: theme.spacing.lg,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text variant="caption" color="textMuted">
              Voice log
            </Text>
            <Text variant="title">Talk it out</Text>
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.surfaceAlt : c.surface,
              borderWidth: 1,
              borderColor: c.border,
            })}
          >
            <Ionicons name="close" size={18} color={c.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing["3xl"],
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Orb - vertically centered in the available space when nothing else below */}
          <Pressable
            onPress={onMicPress}
            disabled={busy}
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: parsed || transcript ? 0 : 1,
              marginTop: parsed || transcript ? theme.spacing.lg : 0,
            }}
          >
            <VoiceOrb recording={recorder.isRecording} level={recorder.level} />
            <Text variant="body" weight="semibold" color="textMuted" style={{ marginTop: theme.spacing.lg }}>
              {statusLabel}
            </Text>
            {hint ? (
              <Text variant="caption" style={{ marginTop: 4, color: c.danger }}>
                {hint}
              </Text>
            ) : !recorder.isRecording && !parsed && !busy ? (
              <Text variant="caption" color="textFaint" style={{ marginTop: 4 }}>
                Try: "bench press 225 for 5, three sets"
              </Text>
            ) : null}
          </Pressable>

          {/* Transcript */}
          {transcript ? (
            <View
              style={{
                backgroundColor: c.surface,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: c.border,
                padding: theme.spacing.md,
              }}
            >
              <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, marginBottom: 4 }}>
                HEARD
              </Text>
              <Text variant="body">"{transcript}"</Text>
            </View>
          ) : null}

          {/* Parsed cards */}
          {parsed && parsed.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="label" color="textMuted">
                PARSED
              </Text>
              {parsed.map((ex, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: c.border,
                    padding: theme.spacing.md,
                    gap: 4,
                  }}
                >
                  <Text variant="body" weight="bold">
                    {ex.name}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {ex.muscleGroup} · {ex.sets.length} {ex.sets.length === 1 ? "set" : "sets"}
                  </Text>
                  {ex.sets.map((s, si) => (
                    <Text key={si} variant="caption" color="textMuted">
                      {si + 1}. {s.reps} × {s.weight} lb
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {parsed && parsed.length > 0 ? (
            <Button title={save.isPending ? "Saving…" : "Save workout"} onPress={onSave} size="lg" haptic="medium" />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
