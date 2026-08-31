import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useAdminUser } from "./api";
import { findRegion } from "../onboarding/regions";
import { relative } from "./AdminScreen";

export function UserDetailSheet({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data, isLoading } = useAdminUser(userId);
  const u = data?.data;
  const region = findRegion(u?.region ?? undefined);

  const maxScreen = Math.max(1, ...(u?.screens ?? []).map((s) => s.count));

  return (
    <BottomSheet visible={!!userId} onClose={onClose}>
      <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        {isLoading || !u ? (
          <Text variant="body" color="textMuted">
            Loading…
          </Text>
        ) : (
          <>
            {/* Identity */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 22 }}>{region?.flag ?? "🌍"}</Text>
                <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
                  {u.name || "—"}
                </Text>
                {u.isSubscribed ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: c.surfaceAlt,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "800",
                        letterSpacing: 0.5,
                        color: c.textMuted,
                      }}
                    >
                      PRO
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="caption" color="textMuted">
                {u.email}
              </Text>
            </View>

            {/* Facts */}
            <View style={{ gap: theme.spacing.xs }}>
              <Fact label="User ID" value={u.id} mono />
              <Fact label="Region" value={region?.name ?? u.region ?? "—"} />
              <Fact label="Joined" value={fmtDate(u.joinedAt)} />
              <Fact label="App opens" value={String(u.opens)} />
              <Fact
                label="Goal"
                value={u.fitnessGoal ?? "—"}
              />
              <Fact label="Experience" value={u.experienceLevel ?? "—"} />
            </View>

            {/* Screen breakdown */}
            {u.screens.length > 0 ? (
              <View style={{ gap: theme.spacing.sm }}>
                <Text variant="label" color="textMuted">
                  SCREENS
                </Text>
                <View style={{ gap: 8 }}>
                  {u.screens.slice(0, 8).map((s) => (
                    <View key={s.screen} style={{ gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text
                          variant="caption"
                          style={{ flex: 1, fontSize: 12, color: c.text }}
                          numberOfLines={1}
                        >
                          {s.screen}
                        </Text>
                        <Text variant="caption" color="textMuted" style={{ fontSize: 11 }}>
                          {s.count}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: c.surfaceAlt,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${(s.count / maxScreen) * 100}%`,
                            height: "100%",
                            borderRadius: 2,
                            backgroundColor: c.text,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Timeline */}
            {u.timeline.length > 0 ? (
              <View style={{ gap: theme.spacing.sm }}>
                <Text variant="label" color="textMuted">
                  RECENT ACTIVITY
                </Text>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                  <View style={{ gap: 10 }}>
                    {u.timeline.map((e, i) => (
                      <View
                        key={i}
                        style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                      >
                        <Ionicons
                          name={
                            e.type === "app_open"
                              ? "log-in-outline"
                              : "eye-outline"
                          }
                          size={13}
                          color={c.textFaint}
                        />
                        <Text
                          variant="caption"
                          style={{ flex: 1, fontSize: 12, color: c.text }}
                          numberOfLines={1}
                        >
                          {e.type === "app_open" ? "Opened app" : e.screen}
                        </Text>
                        <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
                          {relative(e.at)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </>
        )}
      </View>
    </BottomSheet>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: theme.spacing.md }}>
      <Text variant="caption" color="textMuted" style={{ fontSize: 12, width: 96 }}>
        {label}
      </Text>
      <Text
        variant="caption"
        style={{
          flex: 1,
          fontSize: 12,
          color: c.text,
          fontVariant: mono ? ["tabular-nums"] : undefined,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
