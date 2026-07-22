import { View } from "react-native";
import { Screen, Text, Card, Progress, ListRow } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";

function Macro({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="label">{label}</Text>
        <Text variant="label" color="textMuted">
          {value} / {goal} {unit}
        </Text>
      </View>
      <Progress value={value / goal} />
    </View>
  );
}

export function NutritionScreen() {
  const { theme } = useTheme();
  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.xl }}>
      <View style={{ paddingTop: theme.spacing.lg }}>
        <Text variant="caption" color="textMuted">
          Fuel your training
        </Text>
        <Text variant="title">Nutrition</Text>
      </View>

      <Card style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Text variant="heading">Today</Text>
          <Text variant="body" color="textMuted">
            1,540 / 2,300 kcal
          </Text>
        </View>
        <Macro label="Protein" value={98} goal={160} unit="g" />
        <Macro label="Carbs" value={180} goal={250} unit="g" />
        <Macro label="Fat" value={42} goal={70} unit="g" />
      </Card>

      <Card padding="sm">
        <ListRow title="Log a meal" icon="add-circle-outline" onPress={() => {}} />
        <ListRow title="Meal plans" icon="restaurant-outline" onPress={() => {}} />
        <ListRow title="Scan food" icon="scan-outline" onPress={() => {}} />
      </Card>
    </Screen>
  );
}
