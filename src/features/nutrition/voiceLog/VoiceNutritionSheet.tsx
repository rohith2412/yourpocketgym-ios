import { useEffect, useState } from "react";
import { View, Pressable, Alert, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useVoiceRecorder } from "../../voiceLog/useVoiceRecorder";
import { VoiceOrb } from "../../voiceLog/VoiceOrb";
import { parseVoiceNutrition } from "./api";
import type { ParsedFood } from "./types";
import { useAddFood, useAddWater } from "../hooks";
import { newFoodId, toISODay } from "../storage";

const WATER_BLUE = "#38BDF8";

type Props = { visible: boolean; onClose: () => void };

export function VoiceNutritionSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const recorder = useVoiceRecorder();
  const addFood = useAddFood();
  const addWater = useAddWater();

  const [foods, setFoods] = useState<ParsedFood[] | null>(null);
  const [waterMl, setWaterMl] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parseM = useMutation({
    mutationFn: (uri: string) => parseVoiceNutrition(uri),
    onSuccess: (res) => {
      setTranscript(res.transcript);
      setFoods(res.foods);
      setWaterMl(res.waterMl);
      if (!res.transcript.trim() || (res.foods.length === 0 && res.waterMl === 0)) {
        setHint("Couldn't hear any food or drink in that. Try again.");
      }
    },
    onError: (err: Error) => Alert.alert("Couldn't parse", err.message),
  });

  const reset = () => {
    setFoods(null);
    setWaterMl(0);
    setTranscript("");
    setHint(null);
  };

  useEffect(() => {
    if (!visible) {
      // Cancel an in-flight recording rather than parsing it.
      if (recorder.isRecording) recorder.stop().catch(() => {});
      reset();
    }
    // Only re-run when visibility flips
  }, [visible]);

  const handleClose = () => {
    if (recorder.isRecording) recorder.stop().catch(() => {});
    onClose();
  };

  // Client-side gate: skip the API when the take is obviously unusable.
  const MIN_DURATION_MS = 1200; // < 1.2s = accidental tap
  const MIN_PEAK_LEVEL = 0.18; // never got loud enough = silence / muffled

  const onMicPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (recorder.isRecording) {
      const result = await recorder.stop();
      if (!result || !result.uri) return;
      if (result.durationMs < MIN_DURATION_MS) {
        setHint("Too short — hold on longer and say what you ate.");
        return;
      }
      if (result.peakLevel < MIN_PEAK_LEVEL) {
        setHint("Didn't hear anything. Try again.");
        return;
      }
      setHint(null);
      parseM.mutate(result.uri);
    } else {
      reset();
      try {
        await recorder.start();
      } catch (err: any) {
        Alert.alert("Mic unavailable", err.message ?? String(err));
      }
    }
  };

  const removeFood = (idx: number) => {
    Haptics.selectionAsync().catch(() => {});
    setFoods((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  };

  const hasSomethingToSave = (foods?.length ?? 0) > 0 || waterMl > 0;

  const onSave = async () => {
    if (!hasSomethingToSave || saving) return;
    setSaving(true);
    try {
      const day = toISODay();
      const now = new Date().toISOString();

      for (const f of foods ?? []) {
        await addFood.mutateAsync({
          id: newFoodId(),
          date: day,
          loggedAt: now,
          name: f.name,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
        });
      }

      if (waterMl > 0) {
        await addWater.mutateAsync({ day, ml: waterMl });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
    } catch (err: any) {
      Alert.alert("Couldn't save", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const busy = parseM.isPending;
  const durationSec = Math.floor(recorder.durationMs / 1000);
  const statusLabel = busy
    ? "Transcribing…"
    : recorder.isRecording
    ? `Listening · ${durationSec}s`
    : foods
    ? "Tap orb to try again"
    : "Tap the orb to speak";

  const hasResult = foods !== null || !!transcript;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {/* Header */}
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
            <Text variant="title">Say what you had</Text>
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
          {/* Orb — centred until there's something below it */}
          <Pressable
            onPress={onMicPress}
            disabled={busy}
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: hasResult ? 0 : 1,
              marginTop: hasResult ? theme.spacing.lg : 0,
            }}
          >
            <VoiceOrb recording={recorder.isRecording} level={recorder.level} tone="kitchen" />
            <Text
              variant="body"
              weight="semibold"
              color="textMuted"
              style={{ marginTop: theme.spacing.lg }}
            >
              {statusLabel}
            </Text>
            {hint ? (
              <Text variant="caption" style={{ marginTop: 4, color: c.danger }}>
                {hint}
              </Text>
            ) : !recorder.isRecording && !foods && !busy ? (
              <Text variant="caption" color="textFaint" center style={{ marginTop: 4 }}>
                Try: "chicken salad and two glasses of water"
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
              <Text
                variant="caption"
                color="textMuted"
                weight="bold"
                style={{ letterSpacing: 0.5, marginBottom: 4 }}
              >
                HEARD
              </Text>
              <Text variant="body">"{transcript}"</Text>
            </View>
          ) : null}

          {/* Parsed food */}
          {foods && foods.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="label" color="textMuted">
                FOOD
              </Text>
              {foods.map((f, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: c.border,
                    padding: theme.spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.md,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="body" weight="bold">
                      {f.name}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {f.calories} cal · P {f.protein}g · C {f.carbs}g · F {f.fat}g
                    </Text>
                  </View>
                  <Pressable onPress={() => removeFood(i)} hitSlop={10}>
                    <Ionicons name="close-circle" size={20} color={c.textFaint} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {/* Parsed water */}
          {waterMl > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text variant="label" color="textMuted">
                WATER
              </Text>
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: theme.spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.md,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${WATER_BLUE}22`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="water" size={17} color={WATER_BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="bold">
                    {(waterMl / 1000).toFixed(2)} L
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {waterMl} ml
                  </Text>
                </View>
                <Pressable onPress={() => setWaterMl(0)} hitSlop={10}>
                  <Ionicons name="close-circle" size={20} color={c.textFaint} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {hasSomethingToSave ? (
            <Button
              title={saving ? "Saving…" : "Add to today"}
              onPress={onSave}
              size="lg"
              haptic="medium"
              disabled={saving}
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
