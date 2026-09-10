import { useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * The bottom-and-right edge of a Progress card, drawn as a stroked path rather
 * than a CSS border.
 *
 * A uniform 1px border is inert — it reads as an outlined box. This fades the
 * stroke out toward both ends and leaves it brightest at the corner, so the
 * edge reads as light catching a surface.
 *
 * The gradient runs top-right → bottom-left. On that axis the bottom-right
 * corner projects to exactly the midpoint, so putting the bright stop at 0.5
 * lands the highlight on the corner without any measuring.
 *
 * Drawn as a path because a CSS border can't be a gradient, and two straight
 * gradient Views would cut the rounded corners off.
 */
export function CardEdge({ radius = 28 }: { radius?: number }) {
  const { theme } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const { w, h } = size;
  const R = Math.min(radius, w / 2, h / 2);
  const SW = 1;
  const half = SW / 2;

  // Inset by half the stroke so the outer edge isn't clipped by the viewport.
  const d =
    w > 0 && h > 0
      ? [
          `M${w - R},${half}`,
          `A${R} ${R} 0 0 1 ${w - half},${R}`, // top-right corner
          `L${w - half},${h - R}`, // right edge
          `A${R} ${R} 0 0 1 ${w - R},${h - half}`, // bottom-right corner
          `L${R},${h - half}`, // bottom edge
          `A${R} ${R} 0 0 1 ${half},${h - R}`, // bottom-left corner
        ].join(" ")
      : "";

  // Brighter in dark mode, where the surrounding surface gives less contrast.
  // Kept subtle — the edge is a hint of light on the corner, not a border.
  const stroke = theme.mode === "dark" ? "#FFFFFF" : "#000000";
  const peak = theme.mode === "dark" ? 0.08 : 0.04;

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={StyleSheet.absoluteFill}
    >
      {d ? (
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id="cardEdge" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity="0" />
              <Stop offset="0.5" stopColor={stroke} stopOpacity={peak} />
              <Stop offset="1" stopColor={stroke} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={d}
            fill="none"
            stroke="url(#cardEdge)"
            strokeWidth={SW}
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}
