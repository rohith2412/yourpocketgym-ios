import { useTheme } from "../../theme/ThemeProvider";

/**
 * Fill for the Progress-page cards.
 *
 * Currently transparent (`…00` alpha) — the cards read purely from their
 * bottom/right hairline borders, so they sit on the page like edges of light
 * rather than raised panels. The colours are kept rather than hardcoding
 * `"transparent"` so the fill can be dialled back up by dropping the alpha
 * suffix, without hunting for values again.
 */
export function useProgressCardColor(): string {
  const { theme } = useTheme();
  return theme.mode === "dark" ? "#0c0c0c00" : "#e4e4e600";
}
