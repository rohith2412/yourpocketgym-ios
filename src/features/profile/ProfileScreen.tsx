import { useState } from "react";
import { View, Alert, Pressable, Share, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Screen,
  Text,
  Card,
  Avatar,
  ListRow,
  Separator,
  SegmentedControl,
} from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useEntitlement } from "../subscription/useEntitlement";
import { useDevPremium, useSetDevPremium } from "../subscription/devOverride";
import { isReviewAccount } from "../subscription/reviewAccounts";
import { PremiumCta } from "../subscription/PremiumCta";
import { restorePurchases, isPremium as customerIsPremium } from "../../services/iapService";
import { clearSession } from "../auth/session";
import { useCurrentUser } from "../auth/useCurrentUser";
import { invalidateAuthCaches } from "../auth/useAuthGuard";
import { useQueryClient } from "@tanstack/react-query";
import { resolveProfilePhoto } from "./photoStorage";
import { WeightChart } from "../progress/components/WeightChart";
import { WeightLogSheet } from "../progress/WeightLogSheet";
import { useWeightLog } from "../progress/hooks";
import { latestWeight } from "../progress/storage";
import { useLastSyncedAt } from "../sync/useSync";

/**
 * The "Profile" tab.
 * - Free: full profile page (identity, weight, appearance, account, danger).
 * - Premium: a compact list menu that routes out to dedicated pages.
 */
export function ProfileScreen() {
  const rateApp = async () => {
    // The native prompt keeps people in the app, which converts far better
    // than bouncing them to the store. Apple caps how often it will actually
    // appear, though, and gives us no way to know whether it did — so if it
    // isn't available we fall back to the store's review composer.
    try {
      // Imported lazily: this is a native module, so on a JS-only reload (or
      // any build made before it was added) the top-level import would throw
      // and take the whole screen down. Here a miss just falls through.
      const StoreReview = await import("expo-store-review");
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }
    } catch {
      // fall through to the link
    }
    Linking.openURL(
      "https://apps.apple.com/nz/app/pocketgym-ai-fitness-tracker/id6765536420?action=write-review",
    ).catch(() => {});
  };

  const { theme, mode, setMode } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { plan, isPremium } = useEntitlement();
  const { data: devPremium = false } = useDevPremium();
  const setDevPremium = useSetDevPremium();
  const { data: user } = useCurrentUser();
  const { data: lastSyncedAt } = useLastSyncedAt();
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

  const qc = useQueryClient();
  const signOut = () => {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          await invalidateAuthCaches(qc);
          router.replace("/welcome");
        },
      },
    ]);
  };

  // ─── Premium: compact list ─────────────────────────────────────────────────
  if (isPremium) {
    return (
      <Screen scroll contentContainerStyle={{ paddingBottom: 120, gap: theme.spacing.lg }}>
        <View style={{ paddingTop: theme.spacing.lg }}>
          <Text variant="caption" color="textMuted">
            Pro member
          </Text>
          <Text variant="title">More</Text>
        </View>

        <Card padding="sm">
          <ListRow
            title={user?.name ?? "Profile"}
            subtitle={user?.email ?? "Account, appearance, sign out"}
            leading={<Avatar uri={resolveProfilePhoto(user?.photo)} name={user?.name} size={36} />}
            onPress={() => router.push("/profile-detail")}
          />
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title="Body weight"
            subtitle="Log & track your weight over time"
            icon="scale-outline"
            onPress={() => router.push("/body-weight")}
          />
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title="Coach AI"
            subtitle="Chat with your AI trainer"
            icon="sparkles"
            onPress={() => router.push("/coach")}
          />
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title="Progress photos"
            subtitle="Daily physique check-in"
            icon="camera-outline"
            onPress={() => router.push("/progress-photos")}
          />
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title="Recovery"
            subtitle="Sleep, mindset & readiness score"
            icon="leaf-outline"
            onPress={() => router.push("/recovery")}
          />
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title="Sync data"
            subtitle={
              lastSyncedAt
                ? `Last synced ${formatRelative(lastSyncedAt)}`
                : "Back up all your data to your account"
            }
            icon="cloud-outline"
            onPress={() => router.push("/sync-data")}
          />
          {/* Meal plans — hidden for now
          <Separator inset={theme.spacing.lg} />
          <ListRow
            title="Meal plans"
            subtitle="Auto-built to match your goal"
            icon="restaurant-outline"
            onPress={() => router.push("/meal-plans")}
          />
          */}
        </Card>

        {/* Support */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
            SUPPORT
          </Text>
          <Card padding="sm">
            <ListRow
              title="Share PocketGym"
              subtitle="Send it to a training partner"
              icon="paper-plane-outline"
              onPress={() =>
                Share.share({
                  message: "Check out PocketGym — the AI-powered fitness tracker I've been using.",
                }).catch(() => {})
              }
            />
            <Separator inset={theme.spacing.lg} />
            <ListRow
              title="Contact support"
              subtitle="rayandteamsupport@gmail.com"
              icon="mail-outline"
              onPress={() => Linking.openURL("mailto:rayandteamsupport@gmail.com").catch(() => {})}
            />
            <Separator inset={theme.spacing.lg} />
            <ListRow
              title="Rate on App Store"
              subtitle="It helps a ton if you enjoy the app"
              icon="star-outline"
              onPress={rateApp}
            />
          </Card>
        </View>

        {/* About */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted" style={{ paddingHorizontal: theme.spacing.sm }}>
            ABOUT
          </Text>
          <Card padding="sm">
            <ListRow
              title="About PocketGym"
              subtitle="What the app does & who built it"
              icon="information-circle-outline"
              onPress={() => router.push("/about")}
            />
            <Separator inset={theme.spacing.lg} />
            <ListRow
              title="Terms of Service"
              icon="document-text-outline"
              onPress={() => router.push("/legal/terms")}
            />
            <Separator inset={theme.spacing.lg} />
            <ListRow
              title="Privacy Policy"
              icon="lock-closed-outline"
              onPress={() => router.push("/legal/privacy")}
            />
          </Card>
        </View>

        <Text variant="caption" color="textFaint" center style={{ marginTop: theme.spacing.sm }}>
          PocketGym · v2.0
        </Text>
      </Screen>
    );
  }

  // ─── Free: full profile page (identity, weight, settings, account) ────────

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: 120, gap: theme.spacing.lg }}>
      <Text variant="title" style={{ paddingTop: theme.spacing.lg }}>
        Profile
      </Text>

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
        </View>
      </Card>

      {/* Get Premium CTA — hidden while everyone gets Pro. */}
      {plan === "free" ? <PremiumCta onPress={() => router.push("/premium")} /> : null}

      {/* Body weight — chart + log button inline */}
      <FreeWeightSection />

      {/* Appearance */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          APPEARANCE
        </Text>
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

      {/* Account */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          ACCOUNT
        </Text>
        <Card padding="sm">
          <ListRow
            title="Edit profile"
            icon="person-outline"
            onPress={() => router.push("/edit-profile")}
          />
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

      {/* Danger */}
      <Card padding="sm">
        <ListRow title="Sign out" icon="log-out-outline" danger chevron={false} onPress={signOut} />
        <Separator inset={theme.spacing.lg} />
        <ListRow title="Delete account" icon="trash-outline" danger onPress={() => router.push("/legal/delete-account")} />
      </Card>

      {/* Dev — only for the owner account */}
      {showDevTools ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            DEV
          </Text>
          <Card padding="lg" style={{ gap: theme.spacing.md }}>
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
          </Card>
        </View>
      ) : null}

      <Text variant="caption" color="textFaint" center>
        PocketGym · v2.0
      </Text>
    </Screen>
  );
}

// ─── Weight card + log button, inline for free users ──────────────────────────
function FreeWeightSection() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [showLog, setShowLog] = useState(false);
  const { data: log = [] } = useWeightLog();
  const latest = latestWeight(log);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label" color="textMuted">
        BODY WEIGHT
      </Text>
      <WeightChart />
      <Pressable
        onPress={() => setShowLog(true)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 48,
          borderRadius: theme.radius.lg,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="add" size={18} color={c.text} />
        <Text variant="body" weight="semibold">
          {latest ? "Log today's weight" : "Log your first weight"}
        </Text>
      </Pressable>
      <WeightLogSheet visible={showLog} onClose={() => setShowLog(false)} />
    </View>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
