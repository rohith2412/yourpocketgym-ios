import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Full-screen camera view.
 *
 * Center-bottom capture button, native-style thumbnail preview of the most
 * recent library photo beside it (tap to pick from library instead), and a
 * close X in the top-left. Mirrors the iOS Camera app pattern.
 */
export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (uri: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [latestThumb, setLatestThumb] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Ask for camera permission on mount.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // The library-thumbnail-beside-shutter feature required expo-media-library,
  // which crashed the native TabView icon loader on this build. Removed —
  // users still get library access via the icon-based tap that opens the
  // ImagePicker sheet directly.

  const shoot = async () => {
    if (busy) return;
    setBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) onCapture(photo.uri);
    } catch (err: any) {
      Alert.alert("Couldn't take photo", err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Enable it in Settings.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      onCapture(result.assets[0].uri);
    } catch (err: any) {
      Alert.alert("Couldn't pick photo", err?.message ?? String(err));
    }
  };

  // Permission gate — hit while iOS asks the OS-level camera prompt.
  if (!permission?.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.permText}>
          {permission?.canAskAgain === false
            ? "Camera access denied. Enable it in Settings to snap meals."
            : "Requesting camera access…"}
        </Text>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
        >
          <Ionicons name="close" size={22} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Close */}
      <Pressable
        onPress={onClose}
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        hitSlop={10}
      >
        <Ionicons name="close" size={22} color="#ffffff" />
      </Pressable>

      {/* Bottom bar: library thumb · shutter · spacer */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={pickFromLibrary} style={styles.thumbWrap}>
          {latestThumb ? (
            <Image source={{ uri: latestThumb }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Ionicons name="images-outline" size={22} color="#ffffff" />
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={shoot}
          disabled={busy}
          style={({ pressed }) => [
            styles.shutterOuter,
            { opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.shutterInner} />
        </Pressable>

        {/* Balance spacer so the shutter stays centered */}
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  closeBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  permText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 100,
    paddingHorizontal: 40,
    fontSize: 16,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  thumb: { width: "100%", height: "100%" },
  thumbFallback: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#ffffff",
  },
  spacer: { width: 52, height: 52 },
});
