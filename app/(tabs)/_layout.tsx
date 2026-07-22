import { useState } from "react";
import { View } from "react-native";
import TabView, { useBottomTabBarHeight } from "react-native-bottom-tabs";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useEntitlement } from "../../src/features/subscription/useEntitlement";
import { TrainScreen } from "../../src/features/train/TrainScreen";
import { ProgressScreen } from "../../src/features/progress/ProgressScreen";
import { NutritionScreen } from "../../src/features/nutrition/NutritionScreen";
import { CoachScreen } from "../../src/features/coach/CoachScreen";
import { ProfileScreen } from "../../src/features/profile/ProfileScreen";

const SCENES: Record<string, React.ComponentType> = {
  train: TrainScreen,
  progress: ProgressScreen,
  nutrition: NutritionScreen,
  coach: CoachScreen,
  profile: ProfileScreen,
};

function makeRoutes(plan: "free" | "premium", tint: string) {
  const train = { key: "train", title: "Train", focusedIcon: { sfSymbol: "figure.strengthtraining.traditional" }, activeTintColor: tint };
  const progress = { key: "progress", title: "Progress", focusedIcon: { sfSymbol: "chart.line.uptrend.xyaxis" }, activeTintColor: tint };
  const nutrition = { key: "nutrition", title: "Nutrition", focusedIcon: { sfSymbol: "fork.knife" }, activeTintColor: tint };
  const coach = { key: "coach", title: "Coach", focusedIcon: { sfSymbol: "sparkles" }, activeTintColor: tint };
  const profile = { key: "profile", title: "Profile", focusedIcon: { sfSymbol: "person.fill" }, activeTintColor: tint };

  return plan === "premium"
    ? [progress, train, nutrition, coach, profile]
    : [progress, train, profile];
}

function SceneWrapper({ children, bg }: { children: React.ReactNode; bg: string }) {
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>{children}</View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: tabBarHeight, backgroundColor: bg, zIndex: -1 }} />
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { plan } = useEntitlement();
  const [index, setIndex] = useState(0);

  const routes = makeRoutes(plan, theme.colors.text);
  const safeIndex = Math.min(index, routes.length - 1);

  return (
    <TabView
      key={`${theme.mode}-${plan}`}
      hapticFeedbackEnabled
      translucent={false}
      tabBarStyle={{ backgroundColor: theme.colors.bg }}
      tabBarActiveTintColor={theme.colors.text}
      tabBarInactiveTintColor={theme.colors.textMuted}
      scrollEdgeAppearance="opaque"
      navigationState={{ index: safeIndex, routes }}
      onIndexChange={setIndex}
      renderScene={({ route }) => {
        const Screen = SCENES[route.key];
        return Screen ? (
          <SceneWrapper bg={theme.colors.bg}>
            <Screen />
          </SceneWrapper>
        ) : null;
      }}
    />
  );
}
