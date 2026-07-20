import { Text as RNText, type TextProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import type { FontSize, FontWeight, ColorTokens } from "../theme/tokens";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption";

const VARIANTS: Record<Variant, { size: FontSize; weight: FontWeight }> = {
  display: { size: "3xl", weight: "heavy" },
  title: { size: "2xl", weight: "heavy" },
  heading: { size: "xl", weight: "bold" },
  body: { size: "md", weight: "regular" },
  label: { size: "sm", weight: "semibold" },
  caption: { size: "xs", weight: "medium" },
};

type AppTextProps = TextProps & {
  variant?: Variant;
  /** Semantic color token. Default: "text". */
  color?: keyof ColorTokens;
  weight?: FontWeight;
  center?: boolean;
};

/** The only Text component in the app. Always theme-aware — never black-on-black. */
export function Text({
  variant = "body",
  color = "text",
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();
  const v = VARIANTS[variant];
  return (
    <RNText
      style={[
        {
          fontSize: theme.fontSize[v.size],
          fontWeight: theme.fontWeight[weight ?? v.weight],
          color: theme.colors[color],
          textAlign: center ? "center" : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
