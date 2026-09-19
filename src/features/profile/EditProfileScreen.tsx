import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Avatar, Screen, Text } from "../../ui";
import { loadUser, type AuthUser } from "../auth/session";
import { useUpdateProfile } from "../auth/useCurrentUser";
import { useIntro, useSaveIntroPartial } from "../onboarding/introApi";
import { resolveProfilePhoto, saveProfilePhoto } from "./photoStorage";

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Intro fields — same source-of-truth as the Nutrition onboarding sheet.
  // Empty string means "not entered yet" so a user can leave a field blank
  // without stomping the saved value.
  const { data: intro } = useIntro();
  const saveIntro = useSaveIntroPartial();
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("");

  useEffect(() => {
    loadUser().then((u) => {
      setUser(u);
      setName(u?.name ?? "");
      setPhoto(u?.photo ?? null);
    });
  }, []);

  useEffect(() => {
    if (intro?.weight != null) setWeight(String(intro.weight));
    if (intro?.height != null) setHeight(String(intro.height));
    if (intro?.age != null) setAge(String(intro.age));
    if (intro?.fitnessGoal) setGoal(intro.fitnessGoal);
  }, [intro]);

  const nameChanged = user != null && name.trim() !== user.name && name.trim().length > 0;
  const photoChanged = user != null && photo !== (user.photo ?? null);
  const introChanged =
    (weight && Number(weight) !== (intro?.weight ?? -1)) ||
    (height && Number(height) !== (intro?.height ?? -1)) ||
    (age && Number(age) !== (intro?.age ?? -1)) ||
    (goal && goal !== (intro?.fitnessGoal ?? ""));
  const dirty = nameChanged || photoChanged || !!introChanged;

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
      if (nameChanged || photoChanged) {
        await updateProfileMut.mutateAsync({ name: name.trim(), photo: photo ?? null });
      }
      if (introChanged) {
        const patch: Record<string, unknown> = {};
        if (weight) patch.weight = Number(weight);
        if (height) patch.height = Number(height);
        if (age) patch.age = Number(age);
        if (goal) patch.fitnessGoal = goal;
        await saveIntro.mutateAsync(patch);
      }
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
          Stored on this device only - not synced.
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

      {/* Body stats (intro fields) */}
      <NumberField label="WEIGHT (KG)" value={weight} onChange={setWeight} placeholder="72" />
      <NumberField label="HEIGHT (CM)" value={height} onChange={setHeight} placeholder="178" />
      <NumberField label="AGE" value={age} onChange={setAge} placeholder="24" />

      <View style={{ gap: theme.spacing.xs }}>
        <Text
          variant="caption"
          color="textMuted"
          weight="bold"
          style={{ letterSpacing: 0.5, fontSize: 11 }}
        >
          GOAL
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["lose fat", "gain muscle", "maintain"] as const).map((g) => {
            const active = goal === g;
            return (
              <Pressable
                key={g}
                onPress={() => setGoal(g)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: active ? c.inverseBg : c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: active ? c.inverseText : c.text, fontSize: 12 }}
                >
                  {g === "lose fat" ? "Lose fat" : g === "gain muscle" ? "Gain muscle" : "Maintain"}
                </Text>
              </Pressable>
            );
          })}
        </View>
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

/**
 * Numeric field with a caption-style label above. Reused for weight,
 * height, and age.
 */
function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        variant="caption"
        color="textMuted"
        weight="bold"
        style={{ letterSpacing: 0.5, fontSize: 11 }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ""))}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        keyboardType="numeric"
        maxLength={6}
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
  );
}
