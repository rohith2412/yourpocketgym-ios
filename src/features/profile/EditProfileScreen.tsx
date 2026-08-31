import { useEffect, useState } from "react";
import { View, TextInput, Alert, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Screen, Text, Avatar } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { loadUser, type AuthUser } from "../auth/session";
import { useUpdateProfile } from "../auth/useCurrentUser";
import { saveProfilePhoto, resolveProfilePhoto } from "./photoStorage";

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser().then((u) => {
      setUser(u);
      setName(u?.name ?? "");
      setPhoto(u?.photo ?? null);
    });
  }, []);

  const nameChanged = user != null && name.trim() !== user.name && name.trim().length > 0;
  const photoChanged = user != null && photo !== (user.photo ?? null);
  const dirty = nameChanged || photoChanged;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access in Settings to change your avatar.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return;
    try {
      // Copy out of the picker's cache directory before storing the reference,
      // otherwise iOS reclaims the file and the avatar goes blank later.
      setPhoto(await saveProfilePhoto(res.assets[0].uri));
    } catch (err: any) {
      Alert.alert("Couldn't use that photo", err?.message ?? "Please try again.");
    }
  };

  const removePhoto = () => setPhoto(null);

  const updateProfileMut = useUpdateProfile();

  const save = async () => {
    if (!user || !dirty || saving) return;
    setSaving(true);
    try {
      await updateProfileMut.mutateAsync({ name: name.trim(), photo: photo ?? null });
      router.back();
    } catch (err: any) {
      Alert.alert("Save failed", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      contentContainerStyle={{
        paddingBottom: theme.spacing["3xl"],
        gap: theme.spacing.lg,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Edit profile
        </Text>
      </View>

      {/* Avatar edit */}
      <View style={{ alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.md }}>
        <Pressable onPress={pickPhoto} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <View>
            <Avatar uri={resolveProfilePhoto(photo)} name={name || user?.name} size={104} />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.inverseBg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: c.bg,
              }}
            >
              <Ionicons name="camera" size={16} color={c.inverseText} />
            </View>
          </View>
        </Pressable>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <Pressable onPress={pickPhoto} hitSlop={8}>
            <Text variant="caption" weight="bold" style={{ color: c.text }}>
              {photo ? "Change photo" : "Add photo"}
            </Text>
          </Pressable>
          {photo ? (
            <>
              <Text variant="caption" color="textFaint">·</Text>
              <Pressable onPress={removePhoto} hitSlop={8}>
                <Text variant="caption" weight="bold" style={{ color: c.textMuted }}>
                  Remove
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
        <Text variant="caption" color="textFaint" center style={{ fontSize: 11 }}>
          Stored on this device only — not synced.
        </Text>
      </View>

      {/* Name */}
      <View style={{ gap: theme.spacing.xs }}>
        <Text
          variant="caption"
          color="textMuted"
          weight="bold"
          style={{ letterSpacing: 0.5, fontSize: 11 }}
        >
          NAME
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={c.textFaint}
          autoCapitalize="words"
          maxLength={60}
          style={{
            backgroundColor: c.surfaceAlt,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.spacing.md,
            height: 52,
            color: c.text,
            fontSize: 16,
          }}
        />
      </View>

      {/* Email (read-only) */}
      <View style={{ gap: theme.spacing.xs }}>
        <Text
          variant="caption"
          color="textMuted"
          weight="bold"
          style={{ letterSpacing: 0.5, fontSize: 11 }}
        >
          EMAIL
        </Text>
        <View
          style={{
            backgroundColor: c.surfaceAlt,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.spacing.md,
            height: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <Text variant="body" color="textMuted" style={{ flex: 1 }}>
            {user?.email ?? ""}
          </Text>
          <Ionicons name="lock-closed-outline" size={16} color={c.textFaint} />
        </View>
        <Text variant="caption" color="textFaint" style={{ fontSize: 11, marginTop: 2 }}>
          Email is tied to your sign-in and can't be changed here.
        </Text>
      </View>

      {/* Save */}
      <Pressable
        onPress={save}
        disabled={!dirty || saving}
        style={({ pressed }) => ({
          height: 54,
          borderRadius: 999,
          backgroundColor: c.inverseBg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          marginTop: theme.spacing.md,
          opacity: !dirty || saving ? 0.4 : pressed ? 0.9 : 1,
        })}
      >
        {saving ? <ActivityIndicator color={c.inverseText} /> : null}
        <Text style={{ color: c.inverseText, fontWeight: "700", fontSize: 16 }}>
          {saving ? "Saving…" : "Save"}
        </Text>
      </Pressable>
    </Screen>
  );
}
