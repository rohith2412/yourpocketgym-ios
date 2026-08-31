import { useState } from "react";
import { View, Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Screen,
  Text,
  Card,
  Avatar,
  Badge,
  ListRow,
  Separator,
  SegmentedControl,
} from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useEntitlement } from "../subscription/useEntitlement";
import { useDevPremium, useSetDevPremium } from "../subscription/devOverride";
import { useDemoMode, useSetDemoMode } from "../demo/useDemoMode";
import { isReviewAccount } from "../subscription/reviewAccounts";
import { PremiumCta } from "../subscription/PremiumCta";
import { clearSession } from "../auth/session";
import { useCurrentUser } from "../auth/useCurrentUser";
import { resolveProfilePhoto } from "./photoStorage";
import { restorePurchases, isPremium as customerIsPremium } from "../../services/iapService";

export default function ProfileDetailScreen() {
  const { theme, mode, setMode } = useTheme();
  const router = useRouter();
  const { plan } = useEntitlement();
  const { data: devPremium = false } = useDevPremium();
  const setDevPremium = useSetDevPremium();
  const { data: demoOn = false } = useDemoMode();
  const setDemo = useSetDemoMode();
  const { data: user } = useCurrentUser();
  const [restoring, setRestoring] = useState(false);

  // Dev tools are for the owner account only — never the App Review demo
  // account, which should see the app exactly as a paying user does.
  const showDevTools =
    user?.email?.toLowerCase() === "rohithra75@gmail.com" &&
    !isReviewAccount(user?.email);

  const doRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (customerIsPremium(info)) {
        Alert.alert("Restored", "Your Pro subscription is active on this device.");
      } else {
        Alert.alert("No purchases", "No active subscription found for this Apple ID.");
      }
    } catch (err: any) {
      Alert.alert("Restore failed", err?.message ?? "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const signOut = () => {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.lg }}>
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text variant="title">Profile</Text>
      </View>

      {/* Identity */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.lg }}>
          <Avatar uri={resolveProfilePhoto(user?.photo)} name={user?.name} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{user?.name ?? "Athlete"}</Text>
            <Text variant="caption" color="textMuted">
              {user?.email ?? ""}
            </Text>
          </View>
          <Badge label={plan === "premium" ? "Premium" : "Free"} variant={plan === "premium" ? "default" : "muted"} />
        </View>
      </Card>

      {plan === "free" ? <PremiumCta onPress={() => router.push("/premium")} /> : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">APPEARANCE</Text>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          segments={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <Text variant="caption" color="textFaint" style={{ marginTop: 4 }}>
          {mode === "system"
            ? "Following your device setting"
            : `Always ${mode}`}
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">ACCOUNT</Text>
        <Card padding="sm">
          <ListRow title="Edit profile" icon="person-outline" onPress={() => router.push("/edit-profile")} />
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title={restoring ? "Restoring…" : "Restore purchases"}
            icon="refresh-outline"
            chevron={false}
            onPress={doRestore}
          />
          <Separator inset={theme.spacing.lg} />
          <ListRow title="Terms of Service" icon="document-text-outline" onPress={() => router.push("/legal/terms")} />
          <Separator inset={theme.spacing.lg} />
          <ListRow title="Privacy Policy" icon="lock-closed-outline" onPress={() => router.push("/legal/privacy")} />
        </Card>
      </View>

      <Card padding="sm">
        <ListRow title="Sign out" icon="log-out-outline" danger chevron={false} onPress={signOut} />
        <Separator inset={theme.spacing.lg} />
        <ListRow title="Delete account" icon="trash-outline" danger onPress={() => router.push("/legal/delete-account")} />
      </Card>

      {/* Dev tools — only visible to the owner account */}
      {showDevTools ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">DEV</Text>
          <Card padding="lg" style={{ gap: theme.spacing.md }}>
            <Pressable
              onPress={() => router.push("/admin")}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="stats-chart-outline" size={18} color={theme.colors.text} />
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold">Analytics</Text>
                <Text variant="caption" color="textMuted">
                  Users, activity and screen breakdown
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
            </Pressable>

            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold">Force premium</Text>
                <Text variant="caption" color="textMuted">Currently: {plan}</Text>
              </View>
            </View>
            <SegmentedControl<"free" | "premium">
              value={devPremium ? "premium" : "free"}
              onChange={(v) => setDevPremium.mutate(v === "premium")}
              segments={[
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />

            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />

            {/* Screenshot / demo mode */}
            <View>
              <Text variant="body" weight="semibold">Screenshot data</Text>
              <Text variant="caption" color="textMuted">
                Fills every screen with realistic sample data for App Store shots.
              </Text>
            </View>
            <SegmentedControl<"off" | "on">
              value={demoOn ? "on" : "off"}
              onChange={(v) =>
                setDemo.mutate(v === "on", {
                  onError: (err: any) =>
                    Alert.alert("Demo mode failed", err?.message ?? "Please try again."),
                })
              }
              segments={[
                { value: "off", label: "Off" },
                { value: "on", label: "Loaded" },
              ]}
            />
            {setDemo.isPending ? (
              <Text variant="caption" color="textFaint" style={{ marginTop: -4 }}>
                Working…
              </Text>
            ) : null}
          </Card>
        </View>
      ) : null}

      <Text variant="caption" color="textFaint" center>
        PocketGym · v2.0
      </Text>
    </Screen>
  );
}

