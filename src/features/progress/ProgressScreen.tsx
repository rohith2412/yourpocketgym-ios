import { View } from "react-native";
import { Screen, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import AvatarButton from "../../../components/AvatarButton";
import { useTabNav } from "../../nav/tabNav";
import { ProgressPager } from "./components/ProgressPager";
import { AdBanner } from "../ads/AdBanner";

export function ProgressScreen() {
  const { theme } = useTheme();
  const { goToProfile } = useTabNav();

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
            Keep it up
          </Text>
          <Text variant="title">Progress</Text>
        </View>
        <AvatarButton size={40} onPress={goToProfile} />
      </View>

      <ProgressPager />

      {/* Banner ad — hidden for Pro users via useShowAds inside the
          component. Sits above the tab bar in the scroll flow. */}
      <AdBanner />
    </Screen>
  );
}
