import { useMemo, useState } from "react";
import {
  View,
  Pressable,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { usePhotos, useAddPhoto, useDeletePhoto } from "./hooks";
import { type ProgressPhoto } from "./storage";

export default function ProgressPhotosScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { data: photos = [] } = usePhotos();
  const addM = useAddPhoto();
  const delM = useDeletePhoto();
  const [viewer, setViewer] = useState<ProgressPhoto | null>(null);

  // Newest first for the grid
  const sorted = useMemo(
    () => [...photos].sort((a, b) => (a.date > b.date ? -1 : 1)),
    [photos],
  );

  const pickImage = async (source: "camera" | "library") => {
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
          ? await ImagePicker.launchCameraAsync({
              cameraType: ImagePicker.CameraType.front,
              quality: 0.85,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            })
          : await ImagePicker.launchImageLibraryAsync({
              quality: 0.85,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });
      if (result.canceled || !result.assets?.[0]) return;
      addM.mutate(result.assets[0].uri);
    } catch (err: any) {
      Alert.alert("Couldn't add photo", err?.message ?? String(err));
    }
  };

  const showUploadSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take photo", "Choose from library"],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickImage("camera");
          if (idx === 2) pickImage("library");
        },
      );
    } else {
      pickImage("library");
    }
  };

  const confirmDelete = (photo: ProgressPhoto) => {
    Alert.alert(
      "Delete photo?",
      new Date(photo.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setViewer(null);
            delM.mutate(photo.id);
          },
        },
      ],
    );
  };

  const { width: w } = useWindowDimensions();
  const GAP = 2;
  const COLS = 3;
  const tileSize = (w - GAP * (COLS - 1)) / COLS;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen padded={false}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: theme.spacing.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
            }}
          >
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={c.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="textMuted">
                Pro
              </Text>
              <Text variant="title">Progress photos</Text>
            </View>
            <Text variant="caption" color="textFaint">
              {sorted.length} {sorted.length === 1 ? "photo" : "photos"}
            </Text>
          </View>

          {/* Photo grid — like the Photos app */}
          {sorted.length === 0 ? (
            <View
              style={{
                marginTop: 80,
                alignItems: "center",
                gap: 12,
                paddingHorizontal: theme.spacing.lg,
              }}
            >
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="images-outline" size={36} color={c.textMuted} />
              </View>
              <Text variant="body" color="textMuted" center>
                No progress photos yet.{"\n"}Tap + to add your first.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
              {sorted.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setViewer(p)}
                  style={{ width: tileSize, height: tileSize }}
                >
                  <Image
                    source={{ uri: p.uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: c.surfaceAlt,
                    }}
                    resizeMode="cover"
                  />
                  {/* Date badge overlay */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      left: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: "rgba(0,0,0,0.55)",
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}
                    >
                      {new Date(p.date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </Screen>

      {/* Floating + FAB — bottom right, upload trigger */}
      <View style={{ position: "absolute", bottom: theme.spacing.xl, right: theme.spacing.xl }}>
        <Pressable
          onPress={showUploadSheet}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: c.inverseBg,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          })}
        >
          <Ionicons name="add" size={30} color={c.inverseText} />
        </Pressable>
      </View>

      {/* Full-screen viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.94)" }}>
          <View
            style={{
              paddingTop: 60,
              paddingHorizontal: theme.spacing.lg,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Pressable onPress={() => setViewer(null)} hitSlop={12}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
            {viewer ? (
              <Text variant="body" style={{ color: "#fff" }} weight="semibold">
                {new Date(viewer.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            ) : null}
            <Pressable onPress={() => viewer && confirmDelete(viewer)} hitSlop={12}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16 }}
            maximumZoomScale={4}
          >
            {viewer ? (
              <Image
                source={{ uri: viewer.uri }}
                style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12 }}
                resizeMode="contain"
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
