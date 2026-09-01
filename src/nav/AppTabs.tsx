import { useMemo, useState } from "react";
import { View } from "react-native";
import TabView from "react-native-bottom-tabs";
import { useTheme } from "../theme/ThemeProvider";
import { useEntitlement } from "../features/subscription/useEntitlement";
import { TrainScreen } from "../features/train/TrainScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { NutritionScreen } from "../features/nutrition/NutritionScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { TabNavCtx, type TabNav } from "./tabNav";

const SCENES: Record<string, React.ComponentType> = {
  progress: ProgressScreen,
  train: TrainScreen,
  nutrition: NutritionScreen,
  profile: ProfileScreen,
};

function makeRoutes(plan: "free" | "premium", tint: string) {
  const progress = { key: "progress", title: "Progress", focusedIcon: { sfSymbol: "chart.line.uptrend.xyaxis" }, activeTintColor: tint };
  const train = { key: "train", title: "Train", focusedIcon: { sfSymbol: "figure.strengthtraining.traditional" }, activeTintColor: tint };
  const nutrition = { key: "nutrition", title: "Nutrition", focusedIcon: { sfSymbol: "fork.knife" }, activeTintColor: tint };
  const profileFree = { key: "profile", title: "Profile", focusedIcon: { sfSymbol: "person.fill" }, activeTintColor: tint };
  const profilePro = { key: "profile", title: "More", focusedIcon: { sfSymbol: "ellipsis.circle" }, activeTintColor: tint };

  return plan === "premium"
    ? [progress, train, nutrition, profilePro]
    : [progress, train, nutrition, profileFree];
}

// Scenes run the full height and content passes beneath the tab bar — that's
// the point of a translucent bar. Reserving `tabBarHeight` here (and painting
// a solid strip behind it, as this used to) puts an opaque black band under the
// glass with nothing to show through it. Each screen keeps its own bottom
// padding so the last row still clears the bar.
function SceneWrapper({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
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
        translucent
        // A fully transparent bar leaves iOS 26 free to fall back on its default
        // light glass material, which reads as a pale dock over a black app. A
        // translucent tint in the theme's own ground colour keeps the blur while
        // pushing the material to the right side of light/dark.
        tabBarStyle={{
          backgroundColor:
            theme.mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)",
        }}
        tabBarActiveTintColor={theme.colors.text}
        tabBarInactiveTintColor={theme.colors.textMuted}
        scrollEdgeAppearance="transparent"
        navigationState={navigationState}
        onIndexChange={setIndex}
        renderScene={({ route }) => {
          const Screen = SCENES[route.key];
          return Screen ? (
            <SceneWrapper>
              <Screen />
            </SceneWrapper>
          ) : null;
        }}
      />
    </TabNavCtx.Provider>
  );
}
