import { Stack, usePathname } from "expo-router";
import Dock from "../components/Dock";
import SubscriptionInit from "../components/SubscriptionInit";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";


const HIDE_DOCK = ["/login", "/register", "/startersIntro", "/"];

function AppShell() {
  const pathname = usePathname();
  const showDock = !HIDE_DOCK.includes(pathname);


  return (
    <View style={[styles.container]}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade", 
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
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/delete-account" />
      </Stack>

      {showDock && <Dock />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SubscriptionInit>
        <AppShell />
      </SubscriptionInit>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf8", // clean app background
  },
});