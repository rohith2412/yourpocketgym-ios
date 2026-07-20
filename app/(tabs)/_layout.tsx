import { useState } from "react";
import { View } from "react-native";
import TabView, { useBottomTabBarHeight } from "react-native-bottom-tabs";
import TrackingScreen from "./tracking";
import AiTrainerScreen from "./ai-trainer";
import RecipesScreen from "./recipes";
import MacroScannerScreen from "./MacroScanner";
import { useTheme } from "../../src/theme/ThemeContext";

const makeRoutes = (tint: string) => [
  { key: "tracking",      title: "Reps",       focusedIcon: { sfSymbol: "chart.bar.fill" },                        activeTintColor: tint },
  { key: "ai-trainer",   title: "AI Trainer",  focusedIcon: { sfSymbol: "figure.strengthtraining.traditional" },   activeTintColor: tint },
  { key: "recipes",      title: "Recipes",     focusedIcon: { sfSymbol: "fork.knife" },                            activeTintColor: tint },
  { key: "MacroScanner", title: "Scanner",     focusedIcon: require("../../assets/images/scanner-tab.png"),         activeTintColor: tint },
];

const SCENES: Record<string, React.ComponentType> = {
  tracking: TrackingScreen,
  "ai-trainer": AiTrainerScreen,
  recipes: RecipesScreen,
  MacroScanner: MacroScannerScreen,
};

function SceneWrapper({ children, bg }: { children: React.ReactNode; bg: string }) {
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        {children}
      </View>
      {/* Solid layer behind the translucent tab bar so it blurs the theme color */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: tabBarHeight, backgroundColor: bg, zIndex: -1 }} />
    </View>
  );
}

export default function TabLayout() {
  const [index, setIndex] = useState(0);
  const { colors } = useTheme();
  const routes = makeRoutes(colors.text);

  return (
    <TabView
      key={colors.mode}
      hapticFeedbackEnabled
      translucent={false}
      tabBarStyle={{ backgroundColor: colors.card }}
      tabBarActiveTintColor={colors.text}
      tabBarInactiveTintColor={colors.textMuted}
      scrollEdgeAppearance="opaque"
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={({ route }) => {
        const Screen = SCENES[route.key];
        return Screen ? <SceneWrapper bg={colors.bg}><Screen /></SceneWrapper> : null;
      }}
    />
  );
}
