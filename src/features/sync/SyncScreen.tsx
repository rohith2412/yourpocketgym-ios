import { View, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useLastSyncedAt, useSyncNow } from "./useSync";

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "barbell-outline", label: "Training logs & routines" },
  { icon: "restaurant-outline", label: "Food & meal history" },
  { icon: "water-outline", label: "Water intake & goal" },
  { icon: "scale-outline", label: "Body weight history" },
  { icon: "camera-outline", label: "Progress photos metadata" },
  { icon: "sparkles-outline", label: "Coach chat history" },
  { icon: "options-outline", label: "Goals & preferences" },
];

export default function SyncScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { data: lastSyncedAt } = useLastSyncedAt();
  const sync = useSyncNow();

  const onSync = () => {
    if (sync.isPending) return;
    sync.mutate(undefined, {
      onError: (err: any) =>
        Alert.alert("Sync failed", err?.message ?? "Please try again."),
    });
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
        <Text variant="title">Sync data</Text>
      </View>

      {/* Hero */}
      <Card padding="xl" style={{ alignItems: "center", gap: theme.spacing.md }}>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="cloud-outline" size={34} color={c.text} />
        </View>
        <Text variant="heading" center>
          Cloud backup
        </Text>
        <Text variant="body" color="textMuted" center style={{ lineHeight: 20 }}>
          Save everything to your account so it comes back when you sign in on
          another device or reinstall.
        </Text>
        <Text variant="caption" color="textFaint" center style={{ marginTop: 4 }}>
          {lastSyncedAt
            ? `Last synced ${formatRelative(lastSyncedAt)}`
            : "Not yet synced"}
        </Text>
      </Card>

      {/* What gets synced */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          WHAT GETS SYNCED
        </Text>
        <Card padding="lg" style={{ gap: theme.spacing.md }}>
          {ITEMS.map((it, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}
            >
              <Ionicons name={it.icon} size={18} color={c.textMuted} />
              <Text variant="body" style={{ flex: 1 }}>
                {it.label}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color={c.text} />
            </View>
          ))}
        </Card>
      </View>

      {/* CTA */}
      <Pressable
        onPress={onSync}
        disabled={sync.isPending}
        style={({ pressed }) => ({
          height: 54,
          borderRadius: 999,
          backgroundColor: c.inverseBg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: sync.isPending ? 0.5 : pressed ? 0.9 : 1,
        })}
      >
        {sync.isPending ? (
          <ActivityIndicator color={c.inverseText} />
        ) : (
          <Ionicons name="sync" size={18} color={c.inverseText} />
        )}
        <Text style={{ color: c.inverseText, fontWeight: "700", fontSize: 16 }}>
          {sync.isPending ? "Syncing…" : "Sync now"}
        </Text>
      </Pressable>

      {sync.isSuccess && !sync.isPending ? (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Ionicons name="checkmark-circle" size={16} color={c.text} />
          <Text variant="caption" color="textMuted">
            Synced successfully
          </Text>
        </View>
      ) : null}

      <Text variant="caption" color="textFaint" center style={{ lineHeight: 16 }}>
        Your snapshot stays private to your account.{"\n"}
        We never share or sell your data.
      </Text>
    </Screen>
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
