import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  lightColors,
  darkColors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
  type ColorTokens,
} from "./tokens";
import { STORAGE_KEYS } from "../lib/storage";

/** What the user picked. "system" tracks the OS setting live. */
export type ThemeMode = "light" | "dark" | "system";
/** What the app actually renders — always resolved to a concrete scheme. */
export type ResolvedMode = "light" | "dark";

export type Theme = {
  mode: ResolvedMode;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  shadow: typeof shadow;
  statusBar: "light-content" | "dark-content";
};

function buildTheme(mode: ResolvedMode): Theme {
  return {
    mode,
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    shadow,
    statusBar: mode === "dark" ? "light-content" : "dark-content",
  };
}

type ThemeContextValue = {
  theme: Theme;
  /** The user's stored preference — light / dark / system. */
  mode: ThemeMode;
  /** The concrete scheme currently applied (system resolved). */
  resolvedMode: ResolvedMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: buildTheme("light"),
  mode: "system",
  resolvedMode: "light",
  setMode: () => {},
  toggle: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // "light" | "dark" | null — live updates
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.themeMode);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const resolvedMode: ResolvedMode =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<ThemeContextValue>(() => {
    const setMode = (m: ThemeMode) => {
      setModeState(m);
      AsyncStorage.setItem(STORAGE_KEYS.themeMode, m).catch(() => {});
    };
    return {
      theme: buildTheme(resolvedMode),
      mode,
      resolvedMode,
      setMode,
      // Toggle only cycles between the two concrete modes — keeps the affordance
      // meaningful. If you were on "system", it snaps to the opposite of what
      // was resolved.
      toggle: () => setMode(resolvedMode === "dark" ? "light" : "dark"),
      ready,
    };
  }, [mode, resolvedMode, ready]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Access the full theme + mode controls. */
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Create theme-aware styles the RIGHT way — memoized per theme, no module-level
 * mutation. Usage:
 *
 *   const s = useThemedStyles((t) => ({
 *     card: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg },
 *   }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const { theme } = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
