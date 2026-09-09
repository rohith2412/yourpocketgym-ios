import { Stack } from "expo-router";
import { AppProviders } from "../src/providers/AppProviders";

/**
 * Root layout for the v2 app.
 *
 * The old layout wired every screen manually and glued a `<Dock />` component
 * over the whole thing — that's the v1 tab bar, and it's why every launch was
 * landing on the v1 "Tracker/Reps/AI Trainer" screen even after v2 shipped.
 * v2 owns its own bar inside `(tabs)`, so this file's only job is to be a
 * plain Stack that lets expo-router hand off to whichever route we're on.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </AppProviders>
  );
}
