import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View, Text as RNText } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/**
 * Custom animated avatar for users with no profile photo.
 *
 * A rotating linear gradient painted inside a circle, with the seed's first
 * letter floating in the center. No third-party avatar service, no bundled
 * cartoon assets — just react-native-svg + the Animated API. Same seed
 * always resolves to the same colour pair so the avatar stays "yours"
 * across sessions.
 */

// A pool of soft, pastel-ish colour pairs. Each seed picks one deterministically.
// Chosen to feel warm and gym-native without leaning red/aggressive.
const PALETTE: Array<[string, string]> = [
  ["#a1c4fd", "#c2e9fb"], // sky
  ["#fbc2eb", "#a6c1ee"], // rose → periwinkle
  ["#84fab0", "#8fd3f4"], // mint → sky
  ["#ffecd2", "#fcb69f"], // sand → coral
  ["#a18cd1", "#fbc2eb"], // lavender → rose
  ["#fddb92", "#d1fdff"], // butter → ice
  ["#ffd3a5", "#fd6585"], // apricot → pink
  ["#89f7fe", "#66a6ff"], // aqua → blue
  ["#c471f5", "#fa71cd"], // violet → magenta
  ["#43e97b", "#38f9d7"], // green → teal
];

/** Cheap deterministic hash — same string → same index every time. */
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function DefaultAvatar({
  seed,
  size = 44,
}: {
  seed: string;
  size?: number;
}) {
  const { colors, letter } = useMemo(() => {
    const s = seed || "PocketGym";
    const h = hash(s);
    const colors = PALETTE[h % PALETTE.length];
    const letter = s.trim().charAt(0).toUpperCase() || "•";
    return { colors, letter };
  }, [seed]);

  // Slow continuous rotation — one full turn every 12 seconds.
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  // Gentle "breathing" scale on the letter — feels alive without being noisy.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const scale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  // Oversize the gradient so its corners don't flash when it rotates — a
  // 1.5x square rotated around its center still fully covers the parent.
  const inner = size * 1.5;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors[0],
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: inner,
          height: inner,
          transform: [{ rotate: spin }],
        }}
      >
        <Svg width={inner} height={inner}>
          <Defs>
            <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors[0]} />
              <Stop offset="1" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect width={inner} height={inner} fill="url(#g)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale }] }}>
        <RNText
          style={{
            fontSize: size * 0.5,
            fontWeight: "800",
            color: "#ffffff",
            letterSpacing: -0.5,
            textShadowColor: "rgba(0,0,0,0.15)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {letter}
        </RNText>
      </Animated.View>
    </View>
  );
}
