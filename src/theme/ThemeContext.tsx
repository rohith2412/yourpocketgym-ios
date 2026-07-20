import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

export type Palette = {
  mode: ThemeMode;
  bg: string;        // screen background
  card: string;      // primary card surface
  cardAlt: string;   // secondary / inset surface
  text: string;      // primary text
  textMuted: string; // secondary text
  textFaint: string; // tertiary text
  border: string;    // hairline borders
  pill: string;      // subtle chip/pill fill
  accent: string;    // brand accent (orange)
  statusBar: "dark-content" | "light-content";
};

export const LIGHT: Palette = {
  mode: "light",
  bg: "#fafaf8",
  card: "#ffffff",
  cardAlt: "#f2f2f7",
  text: "#0e0e0e",
  textMuted: "#71717a",
  textFaint: "#a1a1aa",
  border: "#e4e4e7",
  pill: "rgba(0,0,0,0.06)",
  accent: "#e8380d",
  statusBar: "dark-content",
};

export const DARK: Palette = {
  mode: "dark",
  bg: "#0b0b0c",
  card: "#0f0f11",
  cardAlt: "#17171a",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  textFaint: "#71717a",
  border: "#27272a",
  pill: "rgba(255,255,255,0.08)",
  accent: "#f7663f",
  statusBar: "light-content",
};

const STORAGE_KEY = "themeMode";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  colors: LIGHT,
  setMode: () => {},
  toggle: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  // Load persisted choice on startup
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") setModeState(saved);
      } catch {}
      setReady(true);
    })();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === "dark" ? DARK : LIGHT,
      setMode,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
      ready,
    }),
    [mode, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
