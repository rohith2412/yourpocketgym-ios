import { useMemo, useState } from "react";
import { View } from "react-native";
import TabView, { useBottomTabBarHeight } from "react-native-bottom-tabs";
import { useTheme } from "../theme/ThemeProvider";
import { useEntitlement } from "../features/subscription/useEntitlement";
import { TrainScreen } from "../features/train/TrainScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { NutritionScreen } from "../features/nutrition/NutritionScreen";
import { CoachScreen } from "../features/coach/CoachScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { TabNavCtx, type TabNav } from "./tabNav";

const SCENES: Record<string, React.ComponentType> = {
  progress: ProgressScreen,
  train: TrainScreen,
  nutrition: NutritionScreen,
  coach: CoachScreen,
  profile: ProfileScreen,
};

function makeRoutes(plan: "free" | "premium", tint: string) {
  const progress = { key: "progress", title: "Progress", focusedIcon: { sfSymbol: "chart.line.uptrend.xyaxis" }, activeTintColor: tint };
  const train = { key: "train", title: "Train", focusedIcon: { sfSymbol: "figure.strengthtraining.traditional" }, activeTintColor: tint };
  const nutrition = { key: "nutrition", title: "Nutrition", focusedIcon: { sfSymbol: "fork.knife" }, activeTintColor: tint };
  const coach = { key: "coach", title: "Coach", focusedIcon: { sfSymbol: "sparkles" }, activeTintColor: tint };
  const profileFree = { key: "profile", title: "Profile", focusedIcon: { sfSymbol: "person.fill" }, activeTintColor: tint };
  const profilePro = { key: "profile", title: "More", focusedIcon: { sfSymbol: "ellipsis.circle" }, activeTintColor: tint };

  return plan === "premium"
    ? [progress, train, coach, nutrition, profilePro]
    : [progress, train, nutrition, profileFree];
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

export default function AppTabsLayout() {
  const { theme } = useTheme();
  const { plan } = useEntitlement();
  const [index, setIndex] = useState(0);

  const routes = useMemo(() => makeRoutes(plan, theme.colors.text), [plan, theme.colors.text]);
  const safeIndex = Math.min(index, routes.length - 1);
  const profileIndex = routes.findIndex((r) => r.key === "profile");
  const nav = useMemo<TabNav>(
    () => ({ goToProfile: () => profileIndex >= 0 && setIndex(profileIndex) }),
    [profileIndex],
  );
  const navigationState = useMemo(() => ({ index: safeIndex, routes }), [safeIndex, routes]);

  return (
    <TabNavCtx.Provider value={nav}>
      <TabView
        hapticFeedbackEnabled
        translucent={false}
        tabBarStyle={{ backgroundColor: theme.colors.bg }}
        tabBarActiveTintColor={theme.colors.text}
        tabBarInactiveTintColor={theme.colors.textMuted}
        scrollEdgeAppearance="opaque"
        navigationState={navigationState}
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
    </TabNavCtx.Provider>
  );
}
