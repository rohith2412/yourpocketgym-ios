import { View } from "react-native";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import AvatarButton from "../../../components/AvatarButton";
import { useTabNav } from "../../nav/tabNav";
import { ProgressPager } from "./components/ProgressPager";
import { EmptyProgress } from "./components/EmptyProgress";
import { useWorkoutLogs } from "../train/api";
import { useFoodEntries } from "../nutrition/hooks";
import { useWeightLog } from "./hooks";

export function ProgressScreen() {
  const { theme } = useTheme();
  const { goToProfile } = useTabNav();

  // Zero-state detection: a fresh signup has none of these. As soon as any
  // single row lands anywhere, the real charts take over — no toggle, no
  // reset, and no misleading "your streak is 0" empty flatline.
  const { data: workouts = [] } = useWorkoutLogs();
  const { data: foods = [] } = useFoodEntries();
  const { data: weights = [] } = useWeightLog();
  const hasAnything = workouts.length + foods.length + weights.length > 0;

  return (
    <Screen
      scroll
      contentContainerStyle={{ paddingBottom: 120, gap: theme.spacing.xl }}
    >
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text variant="caption" color="textMuted">
            {hasAnything ? "Keep it up" : "Get started"}
          </Text>
          <Text variant="title">Progress</Text>
        </View>
        <AvatarButton size={40} onPress={goToProfile} />
      </View>

      {hasAnything ? <ProgressPager /> : <EmptyProgress />}
    </Screen>
  );
}
