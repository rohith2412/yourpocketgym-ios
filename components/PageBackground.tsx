/**
 * PageBackground - light mesh-gradient wash for each main screen.
 *
 * trainer / recipes / tracking / macro  →  violet / indigo / rose  (light wash)
 * profile                                →  crimson / amber / plum  (rich - untouched)
 *
 * The violet wash is deliberately low-opacity (~0.20-0.28) so black text
 * reads cleanly on top.  Profile keeps high opacity - it was already approved.
 */

import React from "react";
import { Dimensions } from "react-native";
import Svg, {
    Defs,
    Ellipse,
    G,
    LinearGradient,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";

const { width: W } = Dimensions.get("window");
const H = 440;
const VW = 390;

export type BgVariant =
  | "trainer"
  | "recipes"
  | "tracking"
  | "profile"
  | "macro";

// ─── Light violet wash (trainer · recipes · tracking · macro) ─────────────────
function VioletBg() {
  return (
    <G>
      <Rect width={VW} height={H} fill="#fafaf8" />
      <Ellipse cx="-10" cy="-30" rx="290" ry="270" fill="url(#vio_a)" />
      <Ellipse cx="400" cy="-20" rx="270" ry="250" fill="url(#vio_b)" />
      <Ellipse cx="195" cy="30" rx="200" ry="180" fill="url(#vio_c)" />
      <Rect width={VW} height={H} fill="url(#fade)" />
    </G>
  );
}

// ─── Rich crimson / amber / plum (profile - unchanged) ───────────────────────
function ProfileBg() {
  return (
    <G>
      <Rect width={VW} height={H} fill="#fafaf8" />
      <Ellipse cx="-20" cy="-30" rx="285" ry="265" fill="url(#pf_a)" />
      <Ellipse cx="415" cy="-20" rx="275" ry="255" fill="url(#pf_b)" />
      <Ellipse cx="195" cy="40" rx="205" ry="185" fill="url(#pf_c)" />
      <Rect width={VW} height={H} fill="url(#fade)" />
    </G>
  );
}

export default function PageBackground({ variant }: { variant: BgVariant }) {
  return (
    <Svg
      width={W}
      height={H}
      viewBox={`0 0 ${VW} ${H}`}
      preserveAspectRatio="xMidYMin slice"
      style={{ position: "absolute", top: 0, left: 0, right: 0 }}
    >
      <Defs>
        {/* Shared bottom fade */}
        <LinearGradient id="fade" x1="0%" y1="45%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#fafaf8" stopOpacity="0" />
          <Stop offset="100%" stopColor="#fafaf8" stopOpacity="1" />
        </LinearGradient>

        {/* ── Violet wash - low opacity so black text reads cleanly ── */}
        <RadialGradient id="vio_a" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6d28d9" stopOpacity="0.26" />
          <Stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="vio_b" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#3730a3" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#3730a3" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="vio_c" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#f43f5e" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </RadialGradient>

        {/* ── Profile: rich opaque - leave as approved ── */}
        <RadialGradient id="pf_a" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#9f1239" stopOpacity="0.82" />
          <Stop offset="100%" stopColor="#9f1239" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pf_b" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#b45309" stopOpacity="0.72" />
          <Stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pf_c" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6b21a8" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#6b21a8" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {variant === "profile" ? <ProfileBg /> : <VioletBg />}
    </Svg>
  );
}
