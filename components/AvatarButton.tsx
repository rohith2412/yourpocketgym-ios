/**
 * AvatarButton — original cartoon character avatar, built entirely from SVG
 * primitives. 100 % in-house art, safe for commercial use.
 *
 * Character: round chubby face, violet irises (matches app palette),
 * dark hair with a small cowlick, rosy cheeks, animated blink + float + smile.
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, TouchableOpacity } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath    = Animated.createAnimatedComponent(Path);
const AnimatedG       = Animated.createAnimatedComponent(G);

export default function AvatarButton({ size = 44, onPress: onPressProp }: { size?: number; onPress?: () => void }) {
  const router = useRouter();

  const pressAnim  = useRef(new Animated.Value(1)).current;
  const blinkAnim  = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle float
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -5, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(floatAnim, { toValue:  0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();

    // Double-blink every ~3.5 s
    const doBlink = () => {
      Animated.sequence([
        Animated.delay(3500),
        Animated.timing(blinkAnim, { toValue: 0, duration: 75,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 75,  useNativeDriver: false }),
        Animated.delay(130),
        Animated.timing(blinkAnim, { toValue: 0, duration: 65,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 80,  useNativeDriver: false }),
      ]).start(() => doBlink());
    };
    doBlink();

    // Subtle smile sway
    Animated.loop(Animated.sequence([
      Animated.timing(wiggleAnim, { toValue: -1.5, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(wiggleAnim, { toValue:  1.5, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ])).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.90, duration: 90,  useNativeDriver: false }),
      Animated.timing(pressAnim, { toValue: 1,    duration: 140, useNativeDriver: false }),
    ]).start(() => {
      if (onPressProp) onPressProp();
      else router.push("/profile");
    });
  };

  // Derived animated values
  const leftLidRy  = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [25, 0] });
  const rightLidRy = blinkAnim.interpolate({ inputRange: [0,1], outputRange: [25, 0] });
  const smileX     = wiggleAnim.interpolate({ inputRange: [-1.5,1.5], outputRange: [-2, 2] });
  const floatY     = floatAnim.interpolate({ inputRange: [-5,0], outputRange: [-5, 0] });

  const SIZE = size;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={st.touch}>
      <Animated.View style={[st.container, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, transform: [{ scale: pressAnim }] }]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 288 288">
          <Defs>
            {/* Clip to circle */}
            <ClipPath id="clip">
              <Circle cx="144" cy="144" r="144" />
            </ClipPath>

            {/* Skin — warm peach, lit from top-left */}
            <LinearGradient id="skin" x1="25%" y1="5%" x2="75%" y2="95%">
              <Stop offset="0%"   stopColor="#fcd5ae" />
              <Stop offset="100%" stopColor="#e8a06a" />
            </LinearGradient>

            {/* Ear — slightly deeper than face */}
            <LinearGradient id="earLg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#f4c090" />
              <Stop offset="100%" stopColor="#d9885a" />
            </LinearGradient>

            {/* Hair — dark brown, subtle highlight */}
            <LinearGradient id="hair" x1="20%" y1="0%" x2="80%" y2="100%">
              <Stop offset="0%"   stopColor="#3a2510" />
              <Stop offset="100%" stopColor="#160e04" />
            </LinearGradient>

            {/* Iris — violet to match app theme */}
            <LinearGradient id="iris" x1="30%" y1="10%" x2="70%" y2="90%">
              <Stop offset="0%"   stopColor="#8b5cf6" />
              <Stop offset="100%" stopColor="#5b21b6" />
            </LinearGradient>

            {/* Face-coloured eyelid cover for blink */}
            <LinearGradient id="lid" x1="25%" y1="0%" x2="75%" y2="100%">
              <Stop offset="0%"   stopColor="#fcd5ae" />
              <Stop offset="100%" stopColor="#eeaa78" />
            </LinearGradient>
          </Defs>

          <G clipPath="url(#clip)">
            {/* ── Page bg ── */}
            <Rect width="288" height="288" fill="#ede9fe" />

            {/* ── Everything floats together ── */}
            <AnimatedG translateY={floatY}>

              {/* ── EARS (behind face) ── */}
              <Ellipse cx="44"  cy="168" rx="33" ry="35" fill="url(#earLg)" />
              <Ellipse cx="44"  cy="172" rx="19" ry="21" fill="#d07848" fillOpacity="0.45" />

              <Ellipse cx="244" cy="168" rx="33" ry="35" fill="url(#earLg)" />
              <Ellipse cx="244" cy="172" rx="19" ry="21" fill="#d07848" fillOpacity="0.45" />

              {/* ── HAIR (drawn before face so face overlaps its base) ── */}
              {/* Main hair mass */}
              <Ellipse cx="144" cy="82"  rx="98" ry="80"  fill="url(#hair)" />
              {/* Cowlick tuft */}
              <Ellipse cx="130" cy="44"  rx="22" ry="28"  fill="#2a1a0a" />
              <Ellipse cx="155" cy="38"  rx="16" ry="22"  fill="#321e0c" />
              {/* Hair highlight sheen */}
              <Ellipse cx="114" cy="58"  rx="26" ry="15"  fill="#6a4828" fillOpacity="0.5" />

              {/* ── FACE ── */}
              <Ellipse cx="144" cy="162" rx="98" ry="100" fill="url(#skin)" />
              {/* Subtle chin shadow */}
              <Ellipse cx="144" cy="248" rx="72" ry="22"  fill="#c08050" fillOpacity="0.18" />

              {/* ── LEFT EYE ── */}
              {/* White (sclera) */}
              <Ellipse cx="110" cy="152" rx="26" ry="27" fill="#ffffff" />
              {/* Iris */}
              <Circle  cx="114" cy="156" r="17"           fill="url(#iris)" />
              {/* Pupil */}
              <Circle  cx="114" cy="156" r="10"           fill="#0d0820" />
              {/* Primary highlight */}
              <Circle  cx="122" cy="148" r="6.5"          fill="#ffffff" />
              {/* Secondary highlight */}
              <Circle  cx="110" cy="164" r="2.5"          fill="#ffffff" fillOpacity="0.55" />
              {/* Animated eyelid */}
              <AnimatedEllipse cx="110" cy="152" rx="27" ry={leftLidRy} fill="url(#lid)" />

              {/* ── RIGHT EYE ── */}
              <Ellipse cx="178" cy="150" rx="26" ry="27" fill="#ffffff" />
              <Circle  cx="182" cy="154" r="17"           fill="url(#iris)" />
              <Circle  cx="182" cy="154" r="10"           fill="#0d0820" />
              <Circle  cx="190" cy="146" r="6.5"          fill="#ffffff" />
              <Circle  cx="178" cy="162" r="2.5"          fill="#ffffff" fillOpacity="0.55" />
              <AnimatedEllipse cx="178" cy="150" rx="27" ry={rightLidRy} fill="url(#lid)" />

              {/* ── EYEBROWS ── */}
              <Path
                d="M 90,128 Q 110,120 132,124"
                fill="none" stroke="#2a1a0a"
                strokeWidth="5.5" strokeLinecap="round"
              />
              <Path
                d="M 156,122 Q 176,116 198,122"
                fill="none" stroke="#2a1a0a"
                strokeWidth="5.5" strokeLinecap="round"
              />

              {/* ── NOSE ── */}
              <Ellipse cx="144" cy="178" rx="9"  ry="7"  fill="#c87848" fillOpacity="0.5" />
              <Circle  cx="138" cy="180" r="4"           fill="#b86838" fillOpacity="0.45" />
              <Circle  cx="150" cy="180" r="4"           fill="#b86838" fillOpacity="0.45" />

              {/* ── CHEEKS ── */}
              <Ellipse cx="82"  cy="190" rx="26" ry="16" fill="#f07060" fillOpacity="0.2" />
              <Ellipse cx="206" cy="188" rx="26" ry="16" fill="#f07060" fillOpacity="0.2" />

              {/* ── SMILE ── */}
              <AnimatedPath
                d="M 116,204 Q 144,226 172,204"
                fill="none" stroke="#c06040"
                strokeWidth="5" strokeLinecap="round"
                translateX={smileX}
              />
              {/* Lower lip accent */}
              <AnimatedPath
                d="M 122,207 Q 144,212 166,207"
                fill="none" stroke="#d07858"
                strokeWidth="2.5" strokeLinecap="round"
                translateX={smileX}
              />

            </AnimatedG>
          </G>
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  touch: { alignSelf: "auto" },
  container: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
