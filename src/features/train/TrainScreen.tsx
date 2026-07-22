import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Button, Card, ListRow, Badge } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";

// Placeholder routines — replaced by real data (backend) as we build Train out.
const ROUTINES = [
  { name: "Push Day", meta: "Chest · Shoulders · Triceps", count: 6 },
  { name: "Pull Day", meta: "Back · Biceps", count: 5 },
  { name: "Leg Day", meta: "Quads · Hamstrings · Calves", count: 7 },
];

export function TrainScreen() {
  const { theme } = useTheme();

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.xl }}>
      {/* Header */}
      <View style={{ paddingTop: theme.spacing.lg }}>
        <Text variant="caption" color="textMuted">
          Ready to move?
        </Text>
        <Text variant="title">Train</Text>
      </View>

      {/* Start workout */}
      <Button
        title="Start Empty Workout"
        variant="primary"
        size="lg"
        radius="lg"
        glow
        haptic="medium"
        left={<Ionicons name="add" size={20} color={theme.colors.inverseText} />}
        onPress={() => {}}
      />

      {/* Routines */}
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="label" color="textMuted">
            YOUR ROUTINES
          </Text>
          <Text variant="label" color="text">
            + New
          </Text>
        </View>

        {ROUTINES.map((r) => (
          <Card key={r.name} onPress={() => {}} padding="lg">
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body" weight="semibold">
                  {r.name}
                </Text>
                <Text variant="caption" color="textMuted">
                  {r.meta}
                </Text>
              </View>
              <Badge label={`${r.count} exercises`} variant="muted" />
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
            </View>
          </Card>
        ))}
      </View>

      {/* Library */}
      <Card padding="sm">
        <ListRow
          title="Exercise library"
          subtitle="Browse 300+ exercises"
          icon="barbell-outline"
          onPress={() => {}}
        />
      </Card>
    </Screen>
  );
}
