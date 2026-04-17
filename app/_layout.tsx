import { Stack, usePathname } from "expo-router";
import Dock from "../components/Dock"; // update path to wherever your Dock file is

// Screens where the dock should NOT appear
const HIDE_DOCK = ["/login", "/register", "/startersIntro", "/"];

export default function RootLayout() {
  const pathname = usePathname();
  const showDock = !HIDE_DOCK.includes(pathname);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="ai-trainer" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="register" />
        <Stack.Screen name="startersIntro" />
        <Stack.Screen name="tracking" />
      </Stack>

      {showDock && <Dock />}
    </>
  );
}