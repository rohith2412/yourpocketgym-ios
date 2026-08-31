import { useEffect, useState } from "react";
import {
  View,
  Pressable,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { lookupBarcode, type BarcodeProduct } from "./api";
import { useAddFood } from "../hooks";
import { toISODay, type FoodEntry } from "../storage";

type Props = { visible: boolean; onClose: () => void };

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] as const;

export function BarcodeLogSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [grams, setGrams] = useState("100");
  const add = useAddFood();

  const lookupM = useMutation({
    mutationFn: (code: string) => lookupBarcode(code),
    onSuccess: (p) => {
      if (!p) {
        Alert.alert("Not found", "That barcode isn't in the database. Try another product or log it manually.");
        setScanned(false);
        return;
      }
      setProduct(p);
      // Prefer serving size if the product carries one; else default to 100g
      if (p.perServing) setGrams(String(parseServingGrams(p.servingSize) || 100));
      else setGrams("100");
    },
    onError: (err: Error) => {
      Alert.alert("Lookup failed", err.message);
      setScanned(false);
    },
  });

  useEffect(() => {
    if (!visible) {
      setScanned(false);
      setProduct(null);
      setGrams("100");
    }
  }, [visible]);

  useEffect(() => {
    if (visible && perm && !perm.granted && perm.canAskAgain) {
      requestPerm();
    }
  }, [visible, perm]);

  const onScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    lookupM.mutate(data);
  };

  // Scale per-100g nutrition by grams input to compute what user actually ate.
  const scaled = (() => {
    if (!product) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const g = Math.max(0, parseInt(grams || "0", 10) || 0);
    const factor = g / 100;
    return {
      calories: Math.round(product.per100g.calories * factor),
      protein: Math.round(product.per100g.protein * factor),
      carbs: Math.round(product.per100g.carbs * factor),
      fat: Math.round(product.per100g.fat * factor),
    };
  })();

  const onSave = () => {
    if (!product) return;
    const entry: FoodEntry = {
      id: `${Date.now()}`,
      date: toISODay(),
      loggedAt: new Date().toISOString(),
      name: product.brand ? `${product.brand} ${product.name}`.trim() : product.name,
      ...scaled,
    };
    add.mutate(entry, { onSuccess: onClose });
  };

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
              Barcode
            </Text>
            <Text variant="title">Scan it</Text>
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
          {/* Scanner OR product preview */}
          {!product ? (
            <View
              style={{
                aspectRatio: 1,
                borderRadius: theme.radius["2xl"],
                overflow: "hidden",
                backgroundColor: "#000",
                position: "relative",
              }}
            >
              {perm?.granted ? (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : onScan}
                  barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES as unknown as string[] }}
                />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <Ionicons name="camera-outline" size={40} color="#888" />
                  <Text variant="body" style={{ color: "#ccc" }}>
                    Camera access needed
                  </Text>
                  <Pressable
                    onPress={requestPerm}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: "#fff",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text variant="caption" weight="bold" style={{ color: "#000" }}>
                      Enable camera
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Reticle */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: "30%",
                  left: "15%",
                  right: "15%",
                  height: "40%",
                  borderColor: "rgba(255,255,255,0.85)",
                  borderWidth: 2,
                  borderRadius: 12,
                }}
              />

              {lookupM.isPending ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator color="#fff" />
                  <Text variant="caption" style={{ color: "#fff" }}>
                    Looking up…
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <>
              {/* Product card */}
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius["2xl"],
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: theme.spacing.md,
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: theme.radius.lg,
                    backgroundColor: c.surfaceAlt,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="barcode-outline" size={26} color={c.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {product.brand ? (
                    <Text variant="caption" color="textMuted" weight="semibold">
                      {product.brand}
                    </Text>
                  ) : null}
                  <Text variant="body" weight="bold" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
                    {product.barcode}
                  </Text>
                </View>
              </View>

              {/* Grams input */}
              <View style={{ gap: 6 }}>
                <Text variant="label" color="textMuted">
                  AMOUNT
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: c.surfaceAlt,
                    borderRadius: theme.radius.lg,
                    paddingHorizontal: theme.spacing.md,
                    height: 52,
                  }}
                >
                  <TextInput
                    value={grams}
                    onChangeText={(t) => setGrams(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={{ flex: 1, fontSize: 22, fontWeight: "800", color: c.text, paddingVertical: 0 }}
                  />
                  <Text variant="body" color="textMuted">
                    g
                  </Text>
                </View>
                {product.perServing ? (
                  <Pressable
                    onPress={() => setGrams(String(parseServingGrams(product.servingSize) || 100))}
                    style={({ pressed }) => ({
                      alignSelf: "flex-start",
                      paddingVertical: 6,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text variant="caption" color="textMuted">
                      Use serving ({product.servingSize ?? "1 serving"})
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Nutrition summary */}
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius["2xl"],
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                }}
              >
                <Text variant="label" color="textMuted">
                  YOU'LL LOG
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <Text style={{ fontSize: 26, fontWeight: "800", color: c.text }}>{scaled.calories}</Text>
                  <Text variant="caption" color="textMuted">
                    cal
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
                  <MacroChip label="P" value={scaled.protein} color="#EF4444" />
                  <MacroChip label="C" value={scaled.carbs} color="#F59E0B" />
                  <MacroChip label="F" value={scaled.fat} color="#8B5CF6" />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
                <Pressable
                  onPress={() => {
                    setProduct(null);
                    setScanned(false);
                  }}
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
                  <Ionicons name="scan" size={18} color={c.text} />
                  <Text variant="body" weight="semibold">
                    Rescan
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Button title={add.isPending ? "Saving…" : "Save"} onPress={onSave} size="lg" haptic="medium" />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: c.surfaceAlt,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text variant="caption" weight="bold" style={{ color: c.text }}>
        {label} {value}g
      </Text>
    </View>
  );
}

/** Extract a gram number from labels like "30 g", "1 cup (240 g)", "2 pieces". */
function parseServingGrams(serving?: string): number | null {
  if (!serving) return null;
  const m = serving.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (m) return Math.round(parseFloat(m[1]));
  return null;
}
