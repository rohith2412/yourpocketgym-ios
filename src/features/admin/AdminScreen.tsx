import { useMemo, useState } from "react";
import { View, Pressable, ScrollView, TextInput, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useAdminUsers, type AdminUserRow } from "./api";
import { findRegion } from "../onboarding/regions";
import { UserDetailSheet } from "./UserDetailSheet";

export default function AdminScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = useAdminUsers();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = data?.data ?? [];
  const totals = data?.totals;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (u) =>
        u.name?.toLowerCase().includes(needle) ||
        u.email?.toLowerCase().includes(needle) ||
        (u.region ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q]);

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
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            Admin
          </Text>
          <Text variant="title">Users</Text>
        </View>
        <Pressable onPress={() => refetch()} hitSlop={12}>
          <Ionicons
            name="refresh"
            size={20}
            color={isRefetching ? c.textFaint : c.textMuted}
          />
        </Pressable>
      </View>

      {/* Totals */}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Stat label="USERS" value={totals?.users ?? 0} />
        <Stat label="ACTIVE 7D" value={totals?.active7d ?? 0} />
        <Stat label="OPENS" value={totals?.opens ?? 0} />
      </View>

      {/* Search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          height: 44,
          borderRadius: 12,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Ionicons name="search" size={16} color={c.textFaint} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Name, email or region"
          placeholderTextColor={c.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 15, color: c.text, paddingVertical: 0 }}
        />
        {q ? (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={c.textFaint} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Card padding="lg">
          <Text variant="body" style={{ color: c.danger }}>
            {(error as Error).message}
          </Text>
        </Card>
      ) : null}

      {/* List */}
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          {filtered.length} {filtered.length === 1 ? "USER" : "USERS"}
        </Text>
        <Card padding="sm">
          {isLoading ? (
            <View style={{ padding: theme.spacing.lg }}>
              <Text variant="caption" color="textMuted">
                Loading…
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ padding: theme.spacing.lg }}>
              <Text variant="caption" color="textMuted">
                No users match.
              </Text>
            </View>
          ) : (
            filtered.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                first={i === 0}
                onPress={() => setSelected(u.id)}
              />
            ))
          )}
        </Card>
      </View>

      <UserDetailSheet
        userId={selected}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        gap: 2,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 0.6,
          fontWeight: "700",
          color: c.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          letterSpacing: -0.8,
          color: c.text,
        }}
      >
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

function UserRow({
  user,
  first,
  onPress,
}: {
  user: AdminUserRow;
  first: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const region = findRegion(user.region ?? undefined);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
        backgroundColor: pressed ? c.surfaceAlt : "transparent",
      })}
    >
      <Text style={{ fontSize: 20 }}>{region?.flag ?? "🌍"}</Text>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {user.name || "—"}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1} style={{ fontSize: 11 }}>
          {user.email}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text variant="caption" weight="bold" style={{ fontSize: 12, color: c.text }}>
          {user.opens}
          <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
            {" opens"}
          </Text>
        </Text>
        <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
          {relative(user.lastSeenAt)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color={c.textFaint} />
    </Pressable>
  );
}

/** Short "how long ago" label. Exported so the detail sheet reads the same. */
export function relative(iso: string | null): string {
  if (!iso) return "never";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "never";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
