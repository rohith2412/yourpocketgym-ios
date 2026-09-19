import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient } from "@tanstack/react-query";
import { AppProviders, appQueryClient } from "../src/providers/AppProviders";
import { api } from "../src/api/client";
import { getSecureToken } from "../src/lib/storage";
import { trackingKeys, type WorkoutLog } from "../src/features/train/api";
import { loadFoodEntries } from "../src/features/nutrition/storage";
import { loadWeightLog } from "../src/features/progress/storage";

/**
 * Root layout.
 *
 * Splash sequence: hold a solid black overlay until the Progress page's
 * three data sources are done fetching, then fade out. If the caches are
 * already warm (thanks to AppProviders' hydration step) this is instant;
 * on a fresh install it stays black until the backend responds.
 *
 * A hard 4-second timeout guarantees we never trap the user behind the
 * overlay if a query hangs — the app becomes usable and the queries keep
 * settling in the background.
 */

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_HOLD_MS = 250; // avoid a jarring flash when everything's already cached
const MAX_HOLD_MS = 4000; // safety net
const FADE_MS = 160;

/** Kick off every network read the Progress page depends on. */
async function preloadProgress(qc: QueryClient) {
  const token = await getSecureToken();
  if (!token) return; // signed-out — auth guard will bounce to /welcome

  await Promise.allSettled([
    qc.prefetchQuery({
      queryKey: [...trackingKeys.list(400), "live"],
      queryFn: () => api.get<{ success: true; data: WorkoutLog[] }>("/tracking?limit=400"),
    }),
    qc.prefetchQuery({
      queryKey: ["food-entries"],
      queryFn: loadFoodEntries,
    }),
    qc.prefetchQuery({
      queryKey: ["weight-log"],
      queryFn: loadWeightLog,
    }),
  ]);
}

export default function RootLayout() {
  const [gone, setGone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const start = Date.now();
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_HOLD_MS - elapsed);
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setGone(true);
        });
      }, wait);
    };

    // Race the data preload against a max hold timeout. Whichever fires
    // first wins — user isn't held longer than 4s even on a stalled network.
    const timeout = setTimeout(finish, MAX_HOLD_MS);
    preloadProgress(appQueryClient).finally(() => {
      clearTimeout(timeout);
      finish();
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      {gone ? null : (
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { opacity }]}
        />
      )}
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 9999,
  },
});
