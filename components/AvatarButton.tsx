import React, { useEffect, useRef } from "react";
import { TouchableOpacity, Animated, Easing, StyleSheet } from "react-native";
import Svg, {
  Defs, LinearGradient, Stop, ClipPath,
  Circle, Rect, Ellipse, Path, G, Line,
} from "react-native-svg";
import { useRouter } from "expo-router";

const AnimatedCircle  = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath    = Animated.createAnimatedComponent(Path);
const AnimatedG       = Animated.createAnimatedComponent(G);

export default function AvatarButton() {
  const router = useRouter();

  const pressAnim  = useRef(new Animated.Value(1)).current;
  const blinkAnim  = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(0.4)).current;
  // Float only moves the face group via SVG translateY
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float — drives SVG G translateY fill="#3d3d3d"  
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(floatAnim, { toValue:  0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();

    // Blink
    const doBlink = () => {
      Animated.sequence([
      Animated.delay(3000),
        Animated.timing(blinkAnim, { toValue: 0, duration: 80,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 80,  useNativeDriver: false }),
        Animated.delay(120),
        Animated.timing(blinkAnim, { toValue: 0, duration: 70,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 80,  useNativeDriver: false }),
      ]).start(() => doBlink());
    };
    doBlink();

    // Wiggle
    Animated.loop(Animated.sequence([
      Animated.timing(wiggleAnim, { toValue: -2, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(wiggleAnim, { toValue:  2, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();

    // Pulse bg
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.7, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0.4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.92, duration: 100, useNativeDriver: false }),
      Animated.timing(pressAnim, { toValue: 1,    duration: 150, useNativeDriver: false }),
    ]).start(() => router.push("/profile"));
  };

  const leftEyelidRy  = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [26, 0] });
  const rightEyelidRy = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [26, 0] });
  const smileX        = wiggleAnim.interpolate({ inputRange: [-2,2], outputRange: [-3, 3] });
  // Float as SVG translateY string Animated.delay(3000),
  const faceTranslateY = floatAnim.interpolate({ inputRange: [-6,0], outputRange: [-6, 0] });

  const SIZE = 42;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.touch}>
      <Animated.View style={[styles.container, { transform: [{ scale: pressAnim }] }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 288 288">
          <Defs>
            <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#f7f6f3" />
              <Stop offset="100%" stopColor="#eae8e1" />
            </LinearGradient>
            <LinearGradient id="blob" x1="20%" y1="10%" x2="80%" y2="90%">
              <Stop offset="0%"   stopColor="#2f2f2f" />
              <Stop offset="100%" stopColor="#1a1a1a" />
            </LinearGradient>
            <ClipPath id="cc">
              <Circle cx="144" cy="144" r="144" />
            </ClipPath>
          </Defs>

          <G clipPath="url(#cc)">
            {/* ── STATIC background — no animation ── */}
            <Rect width="288" height="288" fill="url(#bg)" />

            {/* Pulse blobs — only opacity animates, position is fixed  touch: { alignSelf: "auto */}
            <AnimatedCircle cx="60"  cy="52"  r="28" fill="#e8e3dc" opacity={pulseAnim} />
            <AnimatedCircle cx="240" cy="68"  r="20" fill="#e8e3dc" opacity={pulseAnim} />
            <AnimatedCircle cx="48"  cy="230" r="22" fill="#e8e3dc" opacity={pulseAnim} />
            <AnimatedCircle cx="248" cy="240" r="30" fill="#e8e3dc" opacity={pulseAnim} />

            {/* Static lines */}
            <Line x1="80" y1="38" x2="208" y2="38" stroke="#c8c3bc" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
            <Line x1="80" y1="50" x2="160" y2="50" stroke="#c8c3bc" strokeWidth="4" strokeLinecap="round" opacity="0.25" />

            {/* Static blob body */}
            <Path
              d="M144,74 C162,64 186,70 200,88 C218,110 220,135 215,162 C210,188 224,208 216,228 C208,246 190,258 168,263 C148,268 126,266 108,258 C88,250 74,232 70,210 C66,190 76,168 74,148 C72,128 60,108 72,90 C84,72 126,84 144,74Z"
              fill="url(#blob)"
            />
            <Path
              d="M144,74 C162,64 186,70 200,88 C210,102 216,118 218,135 Q180,68 144,74Z"
              fill="#3d3d3d" opacity="0.5"
            />

            {/* ── ANIMATED face group — floats up/down only ── */}
            <AnimatedG translateY={faceTranslateY}>
              {/* Left eye */}
              <Ellipse cx="118" cy="158" rx="22" ry="24" fill="#ffffff" />
              <Circle  cx="124" cy="163" r="13"  fill="#1a1a1a" />
              <Circle  cx="129" cy="156" r="5"   fill="#fff" />
              <Circle  cx="119" cy="168" r="2.5" fill="#fff" opacity="0.5" />
              <AnimatedEllipse cx="118" cy="158" rx="23" ry={leftEyelidRy} fill="url(#bg)" />

              {/* Right eye */}
              <Ellipse cx="172" cy="156" rx="22" ry="24" fill="#ffffff" />
              <Circle  cx="178" cy="161" r="13"  fill="#1a1a1a" />
              <Circle  cx="183" cy="154" r="5"   fill="#fff" />
              <Circle  cx="173" cy="166" r="2.5" fill="#fff" opacity="0.5" />
              <AnimatedEllipse cx="172" cy="156" rx="23" ry={rightEyelidRy} fill="url(#bg)" />

              {/* Smile */}
              <AnimatedPath
                d="M128,194 Q144,212 162,194"
                fill="none"
                stroke="#fff"
                strokeWidth="3.5"
                strokeLinecap="round"
                translateX={smileX}
              />

              {/* Cheeks */}
              <Ellipse cx="98"  cy="188" rx="14" ry="8" fill="#c4a882" opacity="0.25" />
              <Ellipse cx="192" cy="186" rx="14" ry="8" fill="#c4a882" opacity="0.25" />
            </AnimatedG>
          </G>
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  touch:     { alignSelf: "auto" },
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#cacaca",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 42, height: 42, borderRadius: 21, overflow: "hidden" },
});