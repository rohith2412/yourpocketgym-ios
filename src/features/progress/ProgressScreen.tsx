import { useState } from "react";
import { View } from "react-native";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import AvatarButton from "../../../components/AvatarButton";
import { useTabNav } from "../../nav/tabNav";
import { ProgressPager } from "./components/ProgressPager";
import { WeightLogSheet } from "./WeightLogSheet";

export function ProgressScreen() {
  const { theme } = useTheme();
  const { goToProfile } = useTabNav();
  const [showWeight, setShowWeight] = useState(false);

  return (
    <Screen
      scroll
      contentContainerStyle={{ paddingBottom: theme.spacing["3xl"], gap: theme.spacing.xl }}
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
            Keep it up
          </Text>
          <Text variant="title">Progress</Text>
        </View>
        <AvatarButton size={40} onPress={goToProfile} />
      </View>

      <ProgressPager onOpenWeight={() => setShowWeight(true)} />

      <WeightLogSheet visible={showWeight} onClose={() => setShowWeight(false)} />
    </Screen>
  );
}
