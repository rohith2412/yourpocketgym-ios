import { Stack } from "expo-router";
import { View } from "react-native";
import SubscriptionInit from "../components/SubscriptionInit";
import { AppProviders } from "../src/providers/AppProviders";
import { useTheme } from "../src/theme/ThemeProvider";

function ThemedStack() {
  const { theme } = useTheme();
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
