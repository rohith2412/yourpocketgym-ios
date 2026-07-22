import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Badge, ListRow } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  const { theme } = useTheme();
  return (
    <Card style={{ flex: 1 }}>
      <Text variant="title" style={{ fontSize: 26 }}>
        {value}
        {unit ? (
          <Text variant="body" color="textFaint">
            {" "}
            {unit}
          </Text>
        ) : null}
      </Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </Card>
  );
}

export function ProgressScreen() {
  const { theme } = useTheme();

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.xl }}>
      <View style={{ paddingTop: theme.spacing.lg }}>
        <Text variant="caption" color="textMuted">
          Keep it up
        </Text>
        <Text variant="title">Progress</Text>
      </View>

      {/* Streak banner */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
          <Ionicons name="flame" size={28} color={theme.colors.text} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">3-day streak</Text>
            <Text variant="caption" color="textMuted">
              Train today to keep it alive
            </Text>
          </View>
          <Badge label="🏆 New PR" variant="muted" />
        </View>
      </Card>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <Stat value="12" label="Workouts" />
        <Stat value="8.4" unit="t" label="Total volume" />
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <Stat value="5" label="PRs this month" />
        <Stat value="72" unit="kg" label="Body weight" />
      </View>

      {/* Sections */}
      <Card padding="sm">
        <ListRow title="Personal records" icon="trophy-outline" onPress={() => {}} />
        <ListRow title="Body weight log" icon="scale-outline" onPress={() => {}} />
        <ListRow title="Workout history" icon="time-outline" onPress={() => {}} />
        <ListRow title="Apple Health" subtitle="Connected" icon="heart-outline" onPress={() => {}} />
      </Card>
    </Screen>
  );
}
