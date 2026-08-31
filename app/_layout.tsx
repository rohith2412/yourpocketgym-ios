import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import SubscriptionInit from "../components/SubscriptionInit";
import { AppProviders } from "../src/providers/AppProviders";
import { useTheme } from "../src/theme/ThemeProvider";
import { startAnalytics, trackScreen } from "../src/features/analytics/track";

function ThemedStack() {
  const { theme } = useTheme();
  const pathname = usePathname();

  // Start the flush loop once, then record each route change.
  useEffect(() => startAnalytics(), []);
  useEffect(() => {
    if (pathname) trackScreen(pathname.replace(/^\//, "") || "home");
  }, [pathname]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="coach" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-detail" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="about" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="region-intro" options={{ animation: "fade" }} />
        <Stack.Screen name="admin" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="progress-photos" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="sync-data" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="recovery" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="body-weight" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="meal-plans" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="premium" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="register" />
        <Stack.Screen name="startersIntro" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/delete-account" />
        <Stack.Screen name="routines/index" />
        <Stack.Screen name="routines/new" />
        <Stack.Screen name="routines/[id]" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <SubscriptionInit>
        <ThemedStack />
      </SubscriptionInit>
    </AppProviders>
  );
}
