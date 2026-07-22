import { useEffect, useState } from "react";
import { View, Alert } from "react-native";
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
import { loadUser, clearSession, type AuthUser } from "../auth/session";

export function ProfileScreen() {
  const { theme, mode, setMode } = useTheme();
  const router = useRouter();
  const { plan } = useEntitlement();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    loadUser().then(setUser);
  }, []);

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
      <Text variant="title" style={{ paddingTop: theme.spacing.lg }}>
        Profile
      </Text>

      {/* Identity */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.lg }}>
          <Avatar uri={user?.photo} name={user?.name} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{user?.name ?? "Athlete"}</Text>
            <Text variant="caption" color="textMuted">
              {user?.email ?? ""}
            </Text>
          </View>
          <Badge label={plan === "premium" ? "Premium" : "Free"} variant={plan === "premium" ? "default" : "muted"} />
        </View>
      </Card>

      {/* Go Pro — the single premium entry point (free users only) */}
      {plan === "free" ? (
        <Card onPress={() => router.push("/premium")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            <Ionicons name="sparkles" size={22} color={theme.colors.text} />
            <View style={{ flex: 1 }}>
              <Text variant="body" weight="semibold">
                Go Pro
              </Text>
              <Text variant="caption" color="textMuted">
                AI coaching, nutrition, analytics & more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
          </View>
        </Card>
      ) : null}

      {/* Appearance */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          APPEARANCE
        </Text>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          segments={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </View>

      {/* Account */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          ACCOUNT
        </Text>
        <Card padding="sm">
          <ListRow title="Edit profile" icon="person-outline" onPress={() => {}} />
          <Separator inset={theme.spacing.lg} />
          <ListRow title="Restore purchases" icon="refresh-outline" onPress={() => {}} />
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

      <Text variant="caption" color="textFaint" center>
        PocketGym · v2.0
      </Text>
    </Screen>
  );
}
