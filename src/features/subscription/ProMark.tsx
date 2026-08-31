import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
  /** Stroke weight. Bump it slightly at larger sizes to keep the mark solid. */
  strokeWidth?: number;
};

/**
 * The Pro mark — a faceted gem.
 *
 * Drawn as strokes rather than a filled shape so it sits at the same visual
 * weight as the Ionicons outline set used across Profile, and inherits the
 * theme text colour in both light and dark.
 */
export function ProMark({ size = 22, color, strokeWidth = 1.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outline: crown shoulders down to the culet */}
      <Path
        d="M7.5 3.5h9l4.5 6-9 11.5L3 9.5l4.5-6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Girdle — the horizontal break between crown and pavilion */}
      <Path
        d="M3 9.5h18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Crown facets meeting at the table's centre */}
      <Path
        d="M7.5 3.5 12 9.5l4.5-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
