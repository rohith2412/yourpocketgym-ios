import { Stack, usePathname } from "expo-router";
import Dock from "../components/Dock";
import { View, StyleSheet } from "react-native";

const HIDE_DOCK = ["/login", "/register", "/startersIntro", "/"];

export default function RootLayout() {
  const pathname = usePathname();
  const showDock = !HIDE_DOCK.includes(pathname);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none", // ❌ removes iOS slide animation completely
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="ai-trainer" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="register" />
        <Stack.Screen name="startersIntro" />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="MacroScanner" />
      </Stack>

      {showDock && <Dock />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf8", // clean app background
  },
});