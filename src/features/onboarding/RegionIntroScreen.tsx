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
import { getSecureToken, setJSON } from "../../lib/storage";
import { api } from "../../api/client";
import { NutritionIntroSheet } from "./NutritionIntroSheet";

/**
 * Attribution options — where the user first heard about PocketGym.
 *
 * Icons are Ionicons; the values are what we persist to the backend
 * (stable strings so we can slice growth analytics by channel later).
 */
type SourceOption = {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

// Monochrome by design — brand colors were competing with the rest of the
// onboarding chrome. Icons render in the current theme's text color so the
// list reads as one calm neutral column.
const SOURCES: SourceOption[] = [
  { value: "instagram",   label: "Instagram",              icon: "logo-instagram" },
  { value: "tiktok",      label: "TikTok",                 icon: "musical-notes-outline" },
  { value: "youtube",     label: "YouTube",                icon: "logo-youtube" },
  { value: "app_store",   label: "App Store search",       icon: "logo-apple-appstore" },
  { value: "google",      label: "Google search",          icon: "logo-google" },
  { value: "friend",      label: "Friend or family",       icon: "people-outline" },
  { value: "reddit",      label: "Reddit",                 icon: "logo-reddit" },
  { value: "twitter",     label: "X / Twitter",            icon: "logo-twitter" },
  { value: "news",        label: "News article or blog",   icon: "newspaper-outline" },
  { value: "other",       label: "Other",                  icon: "ellipsis-horizontal-outline" },
];

type Step = "region" | "source";

export default function RegionIntroScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const setRegion = useSetRegion();

  const [step, setStep] = useState<Step>("region");
  const [selected, setSelected] = useState<Region>(REGION_DEFAULT);
  const [source, setSource] = useState<SourceOption | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  // Show the weight/height/age/goal sheet inline on TOP of this screen once
  // the source is saved. Rendering it here (instead of navigating to the
  // tabs and letting NutritionScreen open the sheet) removes the "tabs
  // flash" the user was seeing — the modal slides up over region-intro
  // with no route change in between.
  const [showNutritionIntro, setShowNutritionIntro] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGIONS;
    return REGIONS.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
  }, [query]);

  const onRegionContinue = () => {
    if (busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Persist region right away (both local + backend) but don't wait — the
    // next screen still works if either call is in flight.
    setRegion.mutateAsync(selected.code).catch(() => {});
    api.post("/region", { code: selected.code }).catch(() => {});
    setQuery("");
    setStep("source");
  };

  const onSourceContinue = async (picked?: SourceOption) => {
    const s = picked ?? source;
    if (busy || !s) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    try {
      // Save the attribution locally for offline safety + fire to the backend.
      await setJSON("@user_source", s.value);
      api.post("/user-source", { source: s.value }).catch(() => {});

      // Mark intro complete so we don't route back here on next login.
      const user = await loadUser();
      const token = (await getSecureToken()) ?? "";
      if (user) {
        await saveSession({ token, user: { ...user, hasIntro: true } });
      }
      // Open the nutrition intro sheet ON TOP of this screen. When it
      // closes we finally hop to the tabs — the user never sees a bare
      // tab bar between the two flows.
      setShowNutritionIntro(true);
    } finally {
      setBusy(false);
    }
  };

  const onNutritionIntroDone = () => {
    setShowNutritionIntro(false);
    router.replace("/(tabs)" as any);
  };

  // ── UI helpers ──────────────────────────────────────────────────────────
  const isRegionStep = step === "region";
  const stepLabel = isRegionStep ? "STEP 1 OF 2" : "STEP 2 OF 2";
  const headline = isRegionStep ? "Where are you based?" : "How did you find us?";
  const subhead = isRegionStep
    ? "We use this to show prices and units in your local format."
    : "Helps us know which channels people love — thanks!";

  const canContinue = isRegionStep ? true : !!source;
  const buttonLabel = busy && !isRegionStep ? "Setting up…" : "Next";

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingTop: theme.spacing.lg }}>
          {/* Header — with a back arrow on step 2 */}
          <View style={{ gap: 6, marginBottom: theme.spacing.xl }}>
            {!isRegionStep ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setStep("region");
                }}
                hitSlop={12}
                style={{ marginBottom: theme.spacing.xs, alignSelf: "flex-start" }}
              >
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </Pressable>
            ) : null}
            <Text
              variant="caption"
              color="textMuted"
              weight="bold"
              style={{ letterSpacing: 0.5, fontSize: 11 }}
            >
              {stepLabel}
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
              {headline}
            </Text>
            <Text variant="body" color="textMuted" style={{ lineHeight: 20 }}>
              {subhead}
            </Text>
          </View>

          {/* Search — region step only */}
          {isRegionStep ? (
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
          ) : null}

          {/* List — regions or sources */}
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
              {isRegionStep
                ? filtered.map((r, i) => {
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
                          backgroundColor: active
                            ? c.surfaceAlt
                            : pressed
                            ? c.surfaceAlt
                            : "transparent",
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
                  })
                : SOURCES.map((s, i) => {
                    const active = source?.value === s.value;
                    return (
                      <Pressable
                        key={s.value}
                        onPress={() => {
                          if (busy) return;
                          Haptics.selectionAsync().catch(() => {});
                          setSource(s);
                        }}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: theme.spacing.md,
                          paddingVertical: 14,
                          gap: theme.spacing.md,
                          backgroundColor: active
                            ? c.surfaceAlt
                            : pressed
                            ? c.surfaceAlt
                            : "transparent",
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: c.border,
                        })}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: c.surfaceAlt,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name={s.icon} size={18} color={c.text} />
                        </View>
                        <Text variant="body" weight="semibold" style={{ flex: 1 }}>
                          {s.label}
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
              {isRegionStep && filtered.length === 0 ? (
                <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
                  <Text variant="caption" color="textMuted">
                    No matches
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>

          {/* Continue / Get started — user asked for a beat to review their
              pick before advancing, so both steps get an explicit button. */}
          <Pressable
            onPress={isRegionStep ? onRegionContinue : () => onSourceContinue()}
            disabled={busy || !canContinue}
            style={({ pressed }) => ({
              marginTop: theme.spacing.lg,
              height: 52,
              borderRadius: 999,
              backgroundColor: c.inverseBg,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: !canContinue ? 0.4 : busy ? 0.5 : pressed ? 0.9 : 1,
            })}
          >
            {busy ? <ActivityIndicator color={c.inverseText} /> : null}
            <Text style={{ color: c.inverseText, fontWeight: "700", fontSize: 16 }}>
              {buttonLabel}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <NutritionIntroSheet
        visible={showNutritionIntro}
        onClose={onNutritionIntroDone}
      />
    </Screen>
  );
}

