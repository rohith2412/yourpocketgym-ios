import { useEffect, useMemo } from "react";
import { View } from "react-native";

import {
  Blur,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

/**
 * Two moods for the same object. Food logging gets the warm one — an ember in
 * a pan rather than a cold blue assistant bubble — while workout logging keeps
 * the cool one so the two sheets stay distinguishable at a glance.
 */
const TONES = {
  cool: {
    base: ["#0B2434", "#050B14"] as const,
    blobs: ["#38BDF8", "#6366F1", "#F0F9FF"] as const,
    bloom: ["rgba(56,189,248,0.55)", "rgba(99,102,241,0.18)", "rgba(0,0,0,0)"] as const,
    // Roughly circular drift.
    stretch: 1,
    wave: "#E0F2FE",
  },
  kitchen: {
    base: ["#2A1206", "#120602"] as const,
    blobs: ["#F97316", "#FBBF24", "#FFF7ED"] as const,
    bloom: ["rgba(249,115,22,0.6)", "rgba(251,191,36,0.22)", "rgba(0,0,0,0)"] as const,
    wave: "#FFFFFF",
    // Taller orbits, so the light travels up and down more than side to side —
    // heat rising off a burner rather than something spinning.
    stretch: 1.5,
  },
} as const;

export type OrbTone = keyof typeof TONES;


// Fixed phases/peaks so the bars never move in lockstep — a row that pulses as
// one block looks like a loading indicator, not a voice.
const BAR_PHASES = [0, 1.1, 2.3, 3.6, 4.7];
const BAR_PEAKS = [0.55, 0.85, 1, 0.8, 0.5];

function WaveBar({
  phase,
  peak,
  t,
  level,
  width,
  maxH,
  color,
}: {
  phase: number;
  peak: number;
  t: SharedValue<number>;
  level: SharedValue<number>;
  width: number;
  maxH: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const idle = (Math.sin(t.value * 2 * Math.PI * 3 + phase) + 1) / 2;
    // Floor keeps a visible resting shape; voice drives the rest.
    const amount = 0.16 + idle * 0.1 + level.value * peak * 0.85;
    return { height: maxH * Math.min(1, amount) };
  });

  return (
    <Animated.View
      style={[
        { width, borderRadius: width / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/**
 * The voice orb.
 *
 * Deliberately *not* a shaded sphere — a solid ball with a specular highlight
 * reads as a 3D prop, not as something listening. Instead this is a pool of
 * light: three oversized colour blobs drifting on their own cycles, clipped to
 * a circle and blurred well past their own radius, so the surface never repeats
 * and no single edge dominates. There's no rim — the glow just falls off into
 * the background.
 */
export function VoiceOrb({
  recording,
  level,
  size = 260,
  tone = "cool",
}: {
  recording: boolean;
  level: number;
  size?: number;
  tone?: OrbTone;
}) {
  const palette = TONES[tone];
  // Room for the outer bloom to fade out without clipping against the canvas.
  const PAD = size * 0.3;
  const canvasSize = size + PAD * 2;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const R = size * 0.32;

  const t = useSharedValue(0);
  const breath = useSharedValue(0);
  const liveLevel = useSharedValue(0);

  // One clock for every blob; each reads it at a different rate and phase, so
  // the composite never visibly loops.
  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: recording ? 4200 : 11000, easing: Easing.linear }),
      -1,
    );
  }, [recording]);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    liveLevel.value = withTiming(recording ? level : 0, { duration: 120 });
  }, [level, recording]);

  // Clip path is fixed; the blobs move inside it rather than the shape moving.
  const clip = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, R);
    return p;
  }, [cx, cy, R]);

  const orbR = useDerivedValue(
    () => R * (1 + breath.value * 0.018 + liveLevel.value * 0.05),
  );

  // Each blob orbits a little off-centre so the light pools and thins rather
  // than sweeping round like a lighthouse.
  const drift = R * 0.42;
  const b1x = useDerivedValue(() => cx + Math.cos(t.value * 2 * Math.PI) * drift);
  const b1y = useDerivedValue(
    () => cy + Math.sin(t.value * 2 * Math.PI) * drift * 0.8 * palette.stretch,
  );
  const b2x = useDerivedValue(
    () => cx + Math.cos(t.value * 2 * Math.PI * 1.6 + 2.1) * drift * 0.9,
  );
  const b2y = useDerivedValue(
    () => cy + Math.sin(t.value * 2 * Math.PI * 1.6 + 2.1) * drift * palette.stretch,
  );
  const b3x = useDerivedValue(
    () => cx + Math.cos(-t.value * 2 * Math.PI * 1.15 + 4.2) * drift * 0.7,
  );
  const b3y = useDerivedValue(
    () => cy + Math.sin(-t.value * 2 * Math.PI * 1.15 + 4.2) * drift * 0.9 * palette.stretch,
  );

  const b1c = useDerivedValue(() => vec(b1x.value, b1y.value));
  const b2c = useDerivedValue(() => vec(b2x.value, b2y.value));
  const b3c = useDerivedValue(() => vec(b3x.value, b3y.value));

  const bloomR = useDerivedValue(
    () => R * (1.5 + breath.value * 0.08 + liveLevel.value * 0.5),
  );
  const bloomOpacity = useDerivedValue(() => 0.3 + liveLevel.value * 0.45);

  return (
    <View
      pointerEvents="box-none"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      <Canvas
        pointerEvents="none"
        style={{
          width: canvasSize,
          height: canvasSize,
          position: "absolute",
          left: -PAD,
          top: -PAD,
          backgroundColor: "transparent",
        }}
      >
        {/* Bloom — the light the orb throws, reacting to your voice. */}
        <Circle cx={cx} cy={cy} r={bloomR} opacity={bloomOpacity}>
          <RadialGradient
            c={vec(cx, cy)}
            r={R * 2}
            colors={[...palette.bloom]}
          />
          <Blur blur={38} />
        </Circle>

        {/* The orb itself. Dark base first so the blobs read as light on top of
            something, rather than as paint floating on the page. */}
        <Group clip={clip}>
          <Circle cx={cx} cy={cy} r={orbR}>
            <RadialGradient
              c={vec(cx, cy)}
              r={R}
              colors={[...palette.base]}
            />
          </Circle>

          <Group>
            <Circle cx={b1x} cy={b1y} r={R * 0.9}>
              <RadialGradient
                c={b1c}
                r={R * 0.9}
                colors={[palette.blobs[0], "transparent"]}
              />
            </Circle>
            <Circle cx={b2x} cy={b2y} r={R * 0.8}>
              <RadialGradient
                c={b2c}
                r={R * 0.8}
                colors={[palette.blobs[1], "transparent"]}
              />
            </Circle>
            <Circle cx={b3x} cy={b3y} r={R * 0.55}>
              <RadialGradient
                c={b3c}
                r={R * 0.55}
                colors={[palette.blobs[2], "transparent"]}
              />
            </Circle>
            {/* Blurred far wider than the blobs so they melt into each other
                instead of reading as three overlapping discs. */}
            <Blur blur={30} />
          </Group>
        </Group>

      </Canvas>

      {/* Bars, not a glyph. A mark sitting still on a glowing disc reads as a
          button; five bars moving with your voice is the one shape everyone
          already recognises as "this is listening". They breathe gently at
          rest so the control never looks dead before you tap it. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          flexDirection: "row",
          alignItems: "center",
          gap: size * 0.028,
          height: size * 0.34,
        }}
      >
        {BAR_PHASES.map((phase, i) => (
          <WaveBar
            key={i}
            phase={phase}
            peak={BAR_PEAKS[i]}
            t={t}
            level={liveLevel}
            width={size * 0.032}
            maxH={size * 0.34}
            color={palette.wave}
          />
        ))}
      </View>

    </View>
  );
}
