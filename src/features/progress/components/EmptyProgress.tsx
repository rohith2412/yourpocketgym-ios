import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, Card } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useTabNav } from "../../../nav/tabNav";
import { useCurrentUser } from "../../auth/useCurrentUser";

/**
 * What Progress shows when there's nothing to progress on yet.
 *
 * Landing on flatline charts and "0 lb moved" makes a fresh install feel
 * broken — the numbers are all zero, so the layout reads as an error state,
 * not a starting point. This screen is the opposite: it names the three
 * one-tap next steps that will make Progress meaningful.
 *
 * As soon as any of the three (workout / food / weight) has an entry, the
 * real ProgressPager takes over — no toggle to remember, no state to reset.
 */
export function EmptyProgress() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const nav = useTabNav();
  const { data: user } = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "";

  const rows: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    sub: string;
    onPress: () => void;
  }[] = [
    {
      icon: "barbell-outline",
      title: "Log your first workout",
      sub: "Add sets, reps and weights. Streaks start from here.",
      // No tab-nav helper for Train yet — routes work fine.
      onPress: () => router.push("/(tabs)/train" as never),
    },
    {
      icon: "restaurant-outline",
      title: "Log what you've eaten",
      sub: "Track calories, macros and water for today.",
      onPress: () => router.push("/(tabs)/nutrition" as never),
    },
    {
      icon: "scale-outline",
      title: "Record today's weight",
      sub: "One tap. We chart the trend for you.",
      onPress: () => router.push("/body-weight" as never),
    },
  ];

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={{ gap: 4 }}>
        <Text variant="title" style={{ letterSpacing: -0.5 }}>
          {firstName ? `Welcome, ${firstName}.` : "Welcome."}
        </Text>
        <Text variant="body" color="textMuted" style={{ lineHeight: 22 }}>
          Progress fills in as you log. Pick a starting point.
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        {rows.map((r) => (
          <Pressable
            key={r.title}
            onPress={r.onPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Card padding="lg">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.md,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: c.surfaceAlt,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={r.icon} size={22} color={c.text} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="body" weight="bold">
                    {r.title}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ fontSize: 13, lineHeight: 18 }}>
                    {r.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Quiet reassurance — some users see "Welcome" cards and worry they've
          missed a setup step. Naming the thing puts it to bed. */}
      <Text variant="caption" color="textFaint" center style={{ marginTop: theme.spacing.md }}>
        Charts appear here once you've logged something.
      </Text>
    </View>
  );
}
