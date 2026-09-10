import { useMemo, useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Card } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useAdminUsers, type AdminUserRow } from "./api";
import { findRegion } from "../onboarding/regions";
import { UserDetailSheet } from "./UserDetailSheet";
import { computeInsights, type Insights } from "./insights";

type Tab = "overview" | "users";

export default function AdminScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = useAdminUsers();
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = data?.data ?? [];
  const insights = useMemo(() => computeInsights(rows), [rows]);

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
          <Text variant="title">Analytics</Text>
        </View>
        <Pressable onPress={() => refetch()} hitSlop={12}>
          <Ionicons
            name="refresh"
            size={20}
            color={isRefetching ? c.textFaint : c.textMuted}
          />
        </Pressable>
      </View>

      {/* Segmented tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: c.surfaceAlt,
          borderRadius: 12,
          padding: 3,
        }}
      >
        {(["overview", "users"] as Tab[]).map((k) => {
          const active = tab === k;
          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: active ? c.surface : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                variant="caption"
                weight={active ? "bold" : "semibold"}
                style={{
                  color: active ? c.text : c.textMuted,
                  textTransform: "capitalize",
                }}
              >
                {k}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Card padding="lg">
          <Text variant="body" style={{ color: c.danger }}>
            {(error as Error).message}
          </Text>
        </Card>
      ) : null}

      {isLoading ? (
        <Card padding="lg">
          <Text variant="caption" color="textMuted">
            Loading…
          </Text>
        </Card>
      ) : tab === "overview" ? (
        <OverviewTab insights={insights} />
      ) : (
        <UsersTab
          q={q}
          setQ={setQ}
          rows={filtered}
          onSelect={setSelected}
        />
      )}

      <UserDetailSheet
        userId={selected}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

/* ─────────────────────────── Overview tab ─────────────────────────── */

function OverviewTab({ insights }: { insights: Insights }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const h = insights.headline;

  const maxSignup = Math.max(1, ...insights.signupSparkline.map((d) => d.count));
  const maxEng = Math.max(1, ...insights.engagement.map((b) => b.count));
  const maxRegion = Math.max(1, ...insights.regions.map((r) => r.count));

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {/* Headline grid — 3 across */}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Metric label="USERS" value={h.users} delta={`+${h.newThisWeek} / 7d`} />
        <Metric label="ACTIVE 7D" value={h.active7d} accent={c.success} />
        <Metric label="OPENS" value={h.opens} />
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <Metric label="RETENTION 7D" value={h.retention7dPct} suffix="%" />
        <Metric label="ENGAGED (3+)" value={h.engagedUsers} />
        <Metric label="MED OPENS" value={h.medianOpens} />
      </View>

      {/* Signup sparkline */}
      <Card padding="lg">
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Text variant="body" weight="bold">Signups</Text>
          <Text variant="caption" color="textMuted" style={{ fontSize: 10, letterSpacing: 0.4 }}>
            LAST 30 DAYS · {h.newThisMonth} TOTAL
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 2,
            height: 72,
            marginTop: theme.spacing.md,
          }}
        >
          {insights.signupSparkline.map((d) => {
            const barH = Math.max(2, Math.round((d.count / maxSignup) * 68));
            const recent = Date.parse(d.day) >= Date.now() - 7 * 24 * 60 * 60 * 1000;
            return (
              <View
                key={d.day}
                style={{
                  flex: 1,
                  height: barH,
                  borderRadius: 2,
                  backgroundColor: d.count === 0 ? c.surfaceAlt : recent ? c.primary : c.textMuted,
                  opacity: d.count === 0 ? 0.4 : 1,
                }}
              />
            );
          })}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>30d ago</Text>
          <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>today</Text>
        </View>
      </Card>

      {/* Engagement histogram */}
      <Card padding="lg">
        <Text variant="body" weight="bold">Engagement</Text>
        <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
          Opens per user · {insights.ghostCount} never opened · {insights.atRiskCount} at risk
        </Text>
        <View style={{ gap: 8, marginTop: theme.spacing.md }}>
          {insights.engagement.map((b) => {
            const w = `${Math.round((b.count / maxEng) * 100)}%`;
            return (
              <View key={b.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text
                  variant="caption"
                  style={{ width: 40, fontSize: 11, color: c.textMuted }}
                >
                  {b.label}
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: c.surfaceAlt,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: w as any,
                      height: "100%",
                      backgroundColor: b.label === "Zero" ? c.textFaint : c.primary,
                      borderRadius: 5,
                    }}
                  />
                </View>
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ width: 32, textAlign: "right", fontSize: 11, color: c.text }}
                >
                  {b.count}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Regions */}
      <Card padding="lg">
        <Text variant="body" weight="bold">Top regions</Text>
        <View style={{ gap: 8, marginTop: theme.spacing.md }}>
          {insights.regions.length === 0 ? (
            <Text variant="caption" color="textMuted">
              No region data yet.
            </Text>
          ) : (
            insights.regions.map((r) => {
              const region = findRegion(r.region);
              const flag = region?.flag ?? (r.region === "Other" ? "🌐" : "🌍");
              const label = region?.name ?? r.region;
              const w = `${Math.round((r.count / maxRegion) * 100)}%`;
              return (
                <View key={r.region} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 16 }}>{flag}</Text>
                  <Text
                    variant="caption"
                    style={{ width: 90, fontSize: 12, color: c.text }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: c.surfaceAlt,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: w as any,
                        height: "100%",
                        backgroundColor: c.primary,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <Text
                    variant="caption"
                    weight="bold"
                    style={{ width: 32, textAlign: "right", fontSize: 11, color: c.text }}
                  >
                    {r.count}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </Card>
    </View>
  );
}

/* ─────────────────────────── Users tab ─────────────────────────── */

function UsersTab({
  q,
  setQ,
  rows,
  onSelect,
}: {
  q: string;
  setQ: (v: string) => void;
  rows: AdminUserRow[];
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={{ gap: theme.spacing.lg }}>
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

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          {rows.length} {rows.length === 1 ? "USER" : "USERS"}
        </Text>
        <Card padding="sm">
          {rows.length === 0 ? (
            <View style={{ padding: theme.spacing.lg }}>
              <Text variant="caption" color="textMuted">
                No users match.
              </Text>
            </View>
          ) : (
            rows.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                first={i === 0}
                onPress={() => onSelect(u.id)}
              />
            ))
          )}
        </Card>
      </View>
    </View>
  );
}

/* ─────────────────────────── Bits ─────────────────────────── */

function Metric({
  label,
  value,
  suffix,
  delta,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  accent?: string;
}) {
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
          color: accent ?? c.text,
        }}
      >
        {value.toLocaleString()}
        {suffix ? (
          <Text style={{ fontSize: 14, fontWeight: "700", color: c.textMuted }}>
            {suffix}
          </Text>
        ) : null}
      </Text>
      {delta ? (
        <Text style={{ fontSize: 10, color: c.textFaint, fontWeight: "600" }}>
          {delta}
        </Text>
      ) : null}
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
