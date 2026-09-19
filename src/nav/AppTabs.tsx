import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import TabView from "react-native-bottom-tabs";
import { useAuthGuard } from "../features/auth/useAuthGuard";
import { trackScreen } from "../features/analytics/track";
import { NutritionScreen } from "../features/nutrition/NutritionScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { useEntitlement } from "../features/subscription/useEntitlement";
import { TrainScreen } from "../features/train/TrainScreen";
import { useTheme } from "../theme/ThemeProvider";
import { TabNavCtx, type TabNav } from "./tabNav";

const SCENES: Record<string, React.ComponentType> = {
  progress: ProgressScreen,
  train: TrainScreen,
  nutrition: NutritionScreen,
  profile: ProfileScreen,
};

function makeRoutes(plan: "free" | "premium") {
  const progress = { key: "progress", title: "Progress", focusedIcon: { sfSymbol: "chart.line.uptrend.xyaxis" } };
  const train = { key: "train", title: "Train", focusedIcon: { sfSymbol: "figure.strengthtraining.traditional" } };
  const nutrition = { key: "nutrition", title: "Nutrition", focusedIcon: { sfSymbol: "fork.knife" } };
  const profileFree = { key: "profile", title: "Profile", focusedIcon: { sfSymbol: "person.fill" } };
  const profilePro = { key: "profile", title: "More", focusedIcon: { sfSymbol: "ellipsis.circle" } };

  return plan === "premium"
    ? [progress, train, nutrition, profilePro]
    : [progress, train, nutrition, profileFree];
}

function SceneWrapper({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export default function AppTabsLayout() {
  const { theme } = useTheme();
  const { plan } = useEntitlement();
  const [index, setIndex] = useState(0);
  useAuthGuard();

  const routes = useMemo(() => makeRoutes(plan), [plan]);
  const safeIndex = Math.min(index, routes.length - 1);

  // Fire a `screen_view` event whenever the active tab changes. The batch
  // flusher inside `track.ts` sends these to /analytics/event in the
  // background so the admin dashboard sees real per-tab traffic.
  useEffect(() => {
    trackScreen(`tabs/${routes[safeIndex]?.key ?? "unknown"}`);
  }, [safeIndex, routes]);
  const profileIndex = routes.findIndex((r) => r.key === "profile");
  const nav = useMemo<TabNav>(
    () => ({
      goTo: (key) => {
        const i = routes.findIndex((r) => r.key === key);
        if (i >= 0) setIndex(i);
      },
      goToProfile: () => profileIndex >= 0 && setIndex(profileIndex),
    }),
    [routes, profileIndex],
  );
  const navigationState = useMemo(() => ({ index: safeIndex, routes }), [safeIndex, routes]);

  const isDark = theme.mode === "dark";

  return (
    <TabNavCtx.Provider value={nav}>
      <TabView
        // Force full rebuild of UITabBarAppearance when the theme flips —
        // iOS caches the appearance across renders so a live-toggle needs
        // a fresh instance to pick up the new tint.
        key={theme.mode}
        hapticFeedbackEnabled
        // Theme-matched nav: dark bar in dark mode, light bar in light mode.
        // Opaque + scrollEdgeAppearance opaque stops iOS 26's Liquid Glass
        // material from tinting the bar the wrong colour.
        translucent={false}
        scrollEdgeAppearance="opaque"
        tabBarStyle={{ backgroundColor: theme.colors.bg }}
        tabBarActiveTintColor={theme.colors.text}
        tabBarInactiveTintColor={theme.colors.textMuted}
        // Smaller labels shave a few points off the bar height without
        // hiding them entirely.
        tabLabelStyle={{ fontSize: 10, fontWeight: "600" }}
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
