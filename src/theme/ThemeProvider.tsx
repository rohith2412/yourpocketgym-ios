import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet } from "react-native";
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

export type ThemeMode = "light" | "dark";

export type Theme = {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  shadow: typeof shadow;
  statusBar: "light-content" | "dark-content";
};

function buildTheme(mode: ThemeMode): Theme {
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
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: buildTheme("light"),
  mode: "light",
  setMode: () => {},
  toggle: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.themeMode);
        if (saved === "light" || saved === "dark") setModeState(saved);
      } catch {}
      setReady(true);
    })();
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const setMode = (m: ThemeMode) => {
      setModeState(m);
      AsyncStorage.setItem(STORAGE_KEYS.themeMode, m).catch(() => {});
    };
    return {
      theme: buildTheme(mode),
      mode,
      setMode,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
      ready,
    };
  }, [mode, ready]);

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
