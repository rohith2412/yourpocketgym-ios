import { useMemo, useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { REGIONS, type Region } from "./regions";
import { useSetRegion, REGION_DEFAULT } from "./useRegion";
import { loadUser, saveSession } from "../auth/session";
import { getSecureToken } from "../../lib/storage";
import { api } from "../../api/client";

export default function RegionIntroScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const setRegion = useSetRegion();

  const [selected, setSelected] = useState<Region>(REGION_DEFAULT);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGIONS;
    return REGIONS.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
  }, [query]);

  const onContinue = async () => {
    if (busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    try {
      // Local (fast, offline-tolerant) + server (persists across devices).
      await setRegion.mutateAsync(selected.code);
      // Fire-and-forget the server save so a shaky network never blocks intro.
      api.post("/region", { code: selected.code }).catch(() => {});

      // Mark intro complete so we don't route back here on next login.
      const user = await loadUser();
      const token = (await getSecureToken()) ?? "";
      if (user) {
        await saveSession({ token, user: { ...user, hasIntro: true } });
      }
      // "(tabs)" is a layout group, so typed-routes doesn't model it as an
      // href even though it resolves fine. Same cast app/index.tsx uses.
      router.replace("/(tabs)" as any);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      <View style={{ flex: 1, paddingTop: theme.spacing.lg }}>
        {/* Header */}
        <View style={{ gap: 6, marginBottom: theme.spacing.xl }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5, fontSize: 11 }}>
            STEP 1 OF 1
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "800",
              letterSpacing: -1,
              color: c.text,
              lineHeight: 34,
            }}
          >
            Where are you based?
          </Text>
          <Text variant="body" color="textMuted" style={{ lineHeight: 20 }}>
            We use this to show prices and units in your local format.
          </Text>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            height: 44,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
            marginBottom: theme.spacing.md,
          }}
        >
          <Ionicons name="search" size={16} color={c.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={c.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, fontSize: 15, color: c.text, paddingVertical: 0 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={c.textFaint} />
            </Pressable>
          ) : null}
        </View>

        {/* Region list */}
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            backgroundColor: c.surface,
            overflow: "hidden",
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {filtered.map((r, i) => {
              const active = selected.code === r.code;
              return (
                <Pressable
                  key={r.code}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelected(r);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: 14,
                    gap: theme.spacing.md,
                    backgroundColor: active ? c.surfaceAlt : pressed ? c.surfaceAlt : "transparent",
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: c.border,
                  })}
                >
                  <Text style={{ fontSize: 22 }}>{r.flag}</Text>
                  <Text variant="body" weight="semibold" style={{ flex: 1 }}>
                    {r.name}
                  </Text>
                  {active ? (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: c.inverseBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="checkmark" size={14} color={c.inverseText} />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: c.border,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
            {filtered.length === 0 ? (
              <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
                <Text variant="caption" color="textMuted">
                  No matches
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>

        {/* Continue */}
        <Pressable
          onPress={onContinue}
          disabled={busy}
          style={({ pressed }) => ({
            marginTop: theme.spacing.lg,
            height: 52,
            borderRadius: 999,
            backgroundColor: c.inverseBg,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: busy ? 0.5 : pressed ? 0.9 : 1,
          })}
        >
          {busy ? <ActivityIndicator color={c.inverseText} /> : null}
          <Text style={{ color: c.inverseText, fontWeight: "700", fontSize: 16 }}>
            {busy ? "Setting up…" : "Continue"}
          </Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
