import { useEffect, useState } from "react";
import { View, Pressable, Animated, Easing, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { BottomSheet, Button, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { parseVoice } from "./api";
import type { ParsedExercise } from "./types";
import { useSaveWorkout, type TrackedSet } from "../train/api";
import { toISODay } from "../nutrition/storage";

type Props = { visible: boolean; onClose: () => void };

export function VoiceLogSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const recorder = useVoiceRecorder();
  const save = useSaveWorkout();

  const [parsed, setParsed] = useState<ParsedExercise[] | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const parseM = useMutation({
    mutationFn: (uri: string) => parseVoice(uri),
    onSuccess: (res) => {
      setTranscript(res.transcript);
      setParsed(res.exercises);
    },
    onError: (err: Error) => {
      Alert.alert("Couldn't parse", err.message);
    },
  });

  // Reset state when the sheet closes
  useEffect(() => {
    if (!visible) {
      setParsed(null);
      setTranscript("");
    }
  }, [visible]);

  // Pulsing red halo while recording
  const pulse = useState(new Animated.Value(0))[0];
  useEffect(() => {
    if (!recorder.isRecording) {
      pulse.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [recorder.isRecording]);

  const onMicPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (recorder.isRecording) {
      const uri = await recorder.stop();
      if (uri) parseM.mutate(uri);
    } else {
      setParsed(null);
      setTranscript("");
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

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ gap: 4 }}>
          <Text variant="title">Voice log</Text>
          <Text variant="caption" color="textMuted">
            Say something like "bench press 225 for 5, three sets".
          </Text>
        </View>

        {/* Mic */}
        <View style={{ alignItems: "center", paddingVertical: theme.spacing.md }}>
          <Pressable onPress={onMicPress} disabled={busy}>
            <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
              {/* Pulse halo */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "#EF4444",
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
                }}
              />
              <View
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 37,
                  backgroundColor: recorder.isRecording ? "#EF4444" : c.inverseBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={recorder.isRecording ? "stop" : "mic"}
                  size={28}
                  color={recorder.isRecording ? "#ffffff" : c.inverseText}
                />
              </View>
            </View>
          </Pressable>
          <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
            {busy
              ? "Transcribing…"
              : recorder.isRecording
              ? `Recording · ${durationSec}s`
              : parsed
              ? "Tap mic to try again"
              : "Tap to start"}
          </Text>
        </View>

        {/* Transcript */}
        {transcript ? (
          <View
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
            }}
          >
            <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, marginBottom: 4 }}>
              HEARD
            </Text>
            <Text variant="body">"{transcript}"</Text>
          </View>
        ) : null}

        {/* Parsed preview */}
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
      </View>
    </BottomSheet>
  );
}
