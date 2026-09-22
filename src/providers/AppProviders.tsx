import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../theme/ThemeProvider";
import mobileAds from "react-native-google-mobile-ads";
import { hydrateWorkoutLogsFromCache } from "../features/train/api";
import { startAnalytics } from "../features/analytics/track";
import { requestATTPermission } from "../features/ads/att";

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * All app-wide providers in one place. The root layout renders exactly this
 * around the navigator - nothing else wires up context.
 *
 * On mount we also warm the react-query cache from AsyncStorage — so the
 * Progress page can decide "empty vs real" from the last-known workout list
 * without waiting for a round trip. The background revalidation still runs.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateWorkoutLogsFromCache(appQueryClient).catch(() => {});
    // Boot the analytics loop — logs `app_open`, batches `screen_view`
    // events, flushes every 30s and on background. Returns a teardown
    // fn we call on unmount so hot-reloads don't stack listeners.
    const stopAnalytics = startAnalytics();
    // Ask for App Tracking Transparency BEFORE initializing AdMob — Apple's
    // review team explicitly checks that the ATT prompt appears at first
    // launch, and AdMob personalizes ads based on the answer.
    (async () => {
      await requestATTPermission();
      mobileAds().initialize().catch(() => {});
    })();
    return () => {
      stopAnalytics();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={appQueryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
