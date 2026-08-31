import { useEffect, useState } from "react";
import {
  View,
  Pressable,
  Image,
  Alert,
  Modal,
  ActionSheetIOS,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { analyzeFoodPhoto, type PhotoAnalysis } from "./api";
import { useAddFood } from "../hooks";
import { toISODay, type FoodEntry } from "../storage";
import { usePhotoQuota } from "./usePhotoQuota";

type Props = { visible: boolean; onClose: () => void };

export function PhotoLogSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const add = useAddFood();
  const quota = usePhotoQuota();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [edit, setEdit] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const analyzeM = useMutation({
    mutationFn: (uri: string) => analyzeFoodPhoto(uri),
    onSuccess: (res) => {
      // Only count against the daily quota when the API call actually returned.
      quota.consume();
      setAnalysis(res);
      setEdit({
        name: res.name,
        calories: String(Math.round(res.calories)),
        protein: String(Math.round(res.protein)),
        carbs: String(Math.round(res.carbs)),
        fat: String(Math.round(res.fat)),
      });
    },
    onError: (err: Error) => Alert.alert("Couldn't analyze", err.message),
  });

  useEffect(() => {
    if (!visible) {
      setPhotoUri(null);
      setAnalysis(null);
      setEdit({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    }
  }, [visible]);

  const pick = async (source: "camera" | "library") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const perm =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Enable it in Settings.");
        return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setAnalysis(null);
      // Wait for user to confirm with the Calculate button
    } catch (err: any) {
      Alert.alert("Couldn't pick photo", err?.message ?? String(err));
    }
  };

  const openPicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take photo", "Choose from library"],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pick("camera");
          if (idx === 2) pick("library");
        },
      );
    } else {
      pick("library");
    }
  };

  const onSave = async () => {
    // Persist the photo into the app's document dir so the FoodEntry can keep
    // a stable file:// reference even after the picker's temp file is cleaned.
    let persistedUri: string | undefined;
    if (photoUri) {
      try {
        const dir = FileSystem.documentDirectory + "food-photos/";
        const info = await FileSystem.getInfoAsync(dir);
        if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const ext = photoUri.split(".").pop()?.split("?")[0] ?? "jpg";
        const dest = `${dir}${Date.now()}.${ext}`;
        await FileSystem.copyAsync({ from: photoUri, to: dest });
        persistedUri = dest;
      } catch {
        persistedUri = undefined;
      }
    }
    const entry: FoodEntry = {
      id: `${Date.now()}`,
      date: toISODay(),
      loggedAt: new Date().toISOString(),
      name: edit.name.trim() || "Meal",
      calories: parseInt(edit.calories || "0", 10) || 0,
      protein: parseInt(edit.protein || "0", 10) || 0,
      carbs: parseInt(edit.carbs || "0", 10) || 0,
      fat: parseInt(edit.fat || "0", 10) || 0,
      photoUri: persistedUri,
    };
    add.mutate(entry, { onSuccess: onClose });
  };

  const analyzing = analyzeM.isPending;
  const hasResult = analysis !== null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
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
              Photo log
            </Text>
            <Text variant="title">Snap it</Text>
          </View>
          <Pressable
            onPress={onClose}
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
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing["3xl"],
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo area */}
          {!photoUri ? (
            <Pressable
              onPress={openPicker}
              style={{
                aspectRatio: 4 / 3,
                borderRadius: theme.radius["2xl"],
                borderWidth: 1,
                borderColor: c.border,
                borderStyle: "dashed",
                backgroundColor: c.surface,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="camera-outline" size={40} color={c.textMuted} />
              <Text variant="body" weight="semibold" color="textMuted">
                Tap to snap a meal
              </Text>
              <Text variant="caption" color="textFaint">
                AI will estimate calories & macros
              </Text>
            </Pressable>
          ) : (
            <Image
              source={{ uri: photoUri }}
              style={{
                width: "100%",
                aspectRatio: 4 / 3,
                borderRadius: theme.radius["2xl"],
                backgroundColor: c.surfaceAlt,
              }}
              resizeMode="cover"
            />
          )}

          {/* Retake + Calculate — shown once a photo is picked but not yet analyzed */}
          {photoUri && !hasResult && !analyzing ? (
            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <Pressable
                onPress={openPicker}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 52,
                  borderRadius: theme.radius.md,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="camera-reverse" size={18} color={c.text} />
                <Text variant="body" weight="semibold">
                  Retake
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!quota.hasQuota) {
                    Alert.alert(
                      "Daily limit reached",
                      `Photo log is capped at ${quota.limit} AI scans a day. Come back tomorrow, or log this meal manually.`,
                    );
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  analyzeM.mutate(photoUri);
                }}
                disabled={!quota.hasQuota}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 52,
                  borderRadius: theme.radius.md,
                  backgroundColor: c.inverseBg,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  opacity: !quota.hasQuota ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="sparkles" size={18} color={c.inverseText} />
                <Text variant="body" weight="bold" style={{ color: c.inverseText }}>
                  Calculate
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Analyzing spinner */}
          {analyzing ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: theme.spacing.md,
                backgroundColor: c.surface,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <ActivityIndicator size="small" color={c.textMuted} />
              <Text variant="body" color="textMuted">
                Analyzing your meal…
              </Text>
            </View>
          ) : null}

          {/* Editable estimate */}
          {hasResult ? (
            <View
              style={{
                backgroundColor: c.surface,
                borderRadius: theme.radius["2xl"],
                borderWidth: 1,
                borderColor: c.border,
                padding: theme.spacing.md,
                gap: theme.spacing.md,
              }}
            >
              <Text variant="label" color="textMuted">
                AI ESTIMATE · edit if needed
              </Text>

              <Field label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Field
                  flex
                  label="Calories"
                  unit="cal"
                  numeric
                  value={edit.calories}
                  onChange={(v) => setEdit({ ...edit, calories: v })}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Field flex label="Protein" unit="g" numeric value={edit.protein} onChange={(v) => setEdit({ ...edit, protein: v })} />
                <Field flex label="Carbs" unit="g" numeric value={edit.carbs} onChange={(v) => setEdit({ ...edit, carbs: v })} />
                <Field flex label="Fat" unit="g" numeric value={edit.fat} onChange={(v) => setEdit({ ...edit, fat: v })} />
              </View>

              <Button
                title={add.isPending ? "Saving…" : "Save meal"}
                onPress={onSave}
                size="lg"
                haptic="medium"
              />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  unit,
  numeric,
  flex,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  numeric?: boolean;
  flex?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 4, flex: flex ? 1 : undefined }}>
      <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 9 }}>
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.surfaceAlt,
          borderRadius: theme.radius.md,
          paddingHorizontal: 10,
          height: 42,
        }}
      >
        <TextInput
          value={value}
          onChangeText={(t) => onChange(numeric ? t.replace(/[^0-9]/g, "") : t)}
          keyboardType={numeric ? "number-pad" : "default"}
          selectTextOnFocus
          style={{ flex: 1, color: c.text, fontSize: 15, fontWeight: "700", paddingVertical: 0 }}
        />
        {unit ? (
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
