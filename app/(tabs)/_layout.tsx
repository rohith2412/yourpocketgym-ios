import { useState } from "react";
import { View } from "react-native";
import TabView, { useBottomTabBarHeight } from "react-native-bottom-tabs";
import TrackingScreen from "./tracking";
import AiTrainerScreen from "./ai-trainer";
import RecipesScreen from "./recipes";
import MacroScannerScreen from "./MacroScanner";

const ROUTES = [
  { key: "tracking",      title: "Reps",       focusedIcon: { sfSymbol: "chart.bar.fill" },                        activeTintColor: "#1a1a1a" },
  { key: "ai-trainer",   title: "AI Trainer",  focusedIcon: { sfSymbol: "figure.strengthtraining.traditional" },   activeTintColor: "#1a1a1a" },
  { key: "recipes",      title: "Recipes",     focusedIcon: { sfSymbol: "fork.knife" },                            activeTintColor: "#1a1a1a" },
  { key: "MacroScanner", title: "Scanner",     focusedIcon: { sfSymbol: "camera.fill" },                           activeTintColor: "#1a1a1a" },
];

const SCENES: Record<string, React.ComponentType> = {
  tracking: TrackingScreen,
  "ai-trainer": AiTrainerScreen,
  recipes: RecipesScreen,
  MacroScanner: MacroScannerScreen,
};

function SceneWrapper({ children }: { children: React.ReactNode }) {
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        {children}
      </View>
      {/* White layer behind the translucent tab bar so it blurs white not gray */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: tabBarHeight, backgroundColor: "#ffffff", zIndex: -1 }} />
    </View>
  );
}

export default function TabLayout() {
  const [index, setIndex] = useState(0);

  return (
    <TabView
      hapticFeedbackEnabled

      navigationState={{ index, routes: ROUTES }}
      onIndexChange={setIndex}
      renderScene={({ route }) => {
        const Screen = SCENES[route.key];
        return Screen ? <SceneWrapper><Screen /></SceneWrapper> : null;
      }}
    />
  );
}
