/**
 * LoginCreature — chibi gym character doing a double-bicep flex.
 * Animations: body float · double blink · bicep pump (rx/ry swell) ·
 *             action lines at peak · eye sparkle sync'd to pump.
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath    = Animated.createAnimatedComponent(Path);
const AnimatedG       = Animated.createAnimatedComponent(G);

export default function LoginCreature({ size = 160 }: { size?: number }) {
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const pumpAnim    = useRef(new Animated.Value(0)).current;
  const blinkAnim   = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle whole-body float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -7, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue:  0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    ).start();

    // Bicep pump: quick flex → hold → slow release → rest
    Animated.loop(
      Animated.sequence([
        Animated.timing(pumpAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.delay(280),
        Animated.timing(pumpAnim, { toValue: 0, duration: 680, easing: Easing.in(Easing.cubic),  useNativeDriver: false }),
        Animated.delay(460),
      ]),
    ).start();

    // Eye sparkle — independent, slightly offset so it feels alive
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(sparkleAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
        Animated.delay(380),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 520, useNativeDriver: false }),
        Animated.delay(900),
      ]),
    ).start();

    // Double-blink every ~3.8 s
    const doBlink = () => {
      Animated.sequence([
        Animated.delay(3800),
        Animated.timing(blinkAnim, { toValue: 0, duration: 60,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 75,  useNativeDriver: false }),
        Animated.delay(110),
        Animated.timing(blinkAnim, { toValue: 0, duration: 55,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 75,  useNativeDriver: false }),
      ]).start(() => doBlink());
    };
    doBlink();
  }, []);

  // ── Derived animated values ──────────────────────────────────────────────────
  const floatY    = floatAnim.interpolate({ inputRange: [-7, 0],  outputRange: [-7, 0] });
  const bicepRx   = pumpAnim.interpolate({ inputRange: [0, 1],    outputRange: [20, 31] });
  const bicepRy   = pumpAnim.interpolate({ inputRange: [0, 1],    outputRange: [18, 27] });
  // Action lines only appear in the final 30% of the pump stroke
  const lineAlpha = pumpAnim.interpolate({ inputRange: [0, 0.68, 0.85, 1], outputRange: [0, 0, 0.7, 1] });
  const lidRy     = blinkAnim.interpolate({ inputRange: [0, 1],   outputRange: [30, 0] });
  const sparkleOp = sparkleAnim;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
      <Svg width={size} height={size} viewBox="0 0 288 288">
        <Defs>
          <ClipPath id="lc_clip">
            <Circle cx="144" cy="144" r="144" />
          </ClipPath>

          {/* Skin — warm peach, lit top-left */}
          <RadialGradient id="lc_skin" cx="32%" cy="18%" r="76%">
            <Stop offset="0%"   stopColor="#fde5c8" />
            <Stop offset="100%" stopColor="#e8956a" />
          </RadialGradient>

          {/* Arm skin */}
          <LinearGradient id="lc_arm" x1="20%" y1="0%" x2="80%" y2="100%">
            <Stop offset="0%"   stopColor="#fcd5ae" />
            <Stop offset="100%" stopColor="#d98050" />
          </LinearGradient>

          {/* Bicep peak — warm highlight to shadow */}
          <RadialGradient id="lc_bicep" cx="28%" cy="20%" r="68%">
            <Stop offset="0%"   stopColor="#fff0d8" />
            <Stop offset="50%"  stopColor="#f0a060" />
            <Stop offset="100%" stopColor="#b86830" />
          </RadialGradient>

          {/* Fist */}
          <RadialGradient id="lc_fist" cx="28%" cy="22%" r="72%">
            <Stop offset="0%"   stopColor="#f8c898" />
            <Stop offset="100%" stopColor="#c87040" />
          </RadialGradient>

          {/* Hair — dark brown */}
          <LinearGradient id="lc_hair" x1="22%" y1="0%" x2="78%" y2="100%">
            <Stop offset="0%"   stopColor="#3d2814" />
            <Stop offset="100%" stopColor="#160e04" />
          </LinearGradient>

          {/* Tank top — brand purple */}
          <LinearGradient id="lc_tank" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%"   stopColor="#9333ea" />
            <Stop offset="100%" stopColor="#5b21b6" />
          </LinearGradient>

          {/* Eye iris — violet depth */}
          <RadialGradient id="lc_iris" cx="30%" cy="20%" r="70%">
            <Stop offset="0%"   stopColor="#ddd6fe" />
            <Stop offset="45%"  stopColor="#8b5cf6" />
            <Stop offset="100%" stopColor="#3b0764" />
          </RadialGradient>

          {/* Eyelid — skin tone for blink cover */}
          <LinearGradient id="lc_lid" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%"   stopColor="#fcd5ae" />
            <Stop offset="100%" stopColor="#e8956a" />
          </LinearGradient>

          {/* Bear ear — purple-toned to match palette */}
          <RadialGradient id="lc_ear" cx="35%" cy="28%" r="70%">
            <Stop offset="0%"   stopColor="#c4b5fd" />
            <Stop offset="100%" stopColor="#7c3aed" />
          </RadialGradient>
        </Defs>

        <G clipPath="url(#lc_clip)">
          {/* ── Background ── */}
          <Rect width="288" height="288" fill="#f0ebff" />
          {/* Soft vignette corners */}
          <Ellipse cx="0"   cy="0"   rx="100" ry="100" fill="#ddd6fe" fillOpacity="0.28" />
          <Ellipse cx="288" cy="288" rx="100" ry="100" fill="#c4b5fd" fillOpacity="0.2" />

          {/* Everything floats together */}
          <AnimatedG translateY={floatY}>

            {/* ── BEAR EARS (behind head) ── */}
            <Circle cx="88"  cy="48" r="26" fill="url(#lc_ear)" />
            <Circle cx="88"  cy="48" r="15" fill="#f5d0fe" fillOpacity="0.75" />
            <Circle cx="200" cy="48" r="26" fill="url(#lc_ear)" />
            <Circle cx="200" cy="48" r="15" fill="#f5d0fe" fillOpacity="0.75" />

            {/* ── LEFT ARM ── */}
            {/* Upper arm */}
            <Path d="M 97,186 L 44,130" stroke="#fcd5ae" strokeWidth="24" strokeLinecap="round" fill="none" />
            {/* Forearm */}
            <Path d="M 44,130 L 56,100" stroke="#e8aa7a" strokeWidth="19" strokeLinecap="round" fill="none" />
            {/* Fist */}
            <Circle cx="56" cy="95" r="15" fill="url(#lc_fist)" />
            {/* Knuckle lines */}
            <Path d="M 46,91 Q 56,86 66,91" fill="none" stroke="#b86030" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />

            {/* Left bicep peak — star of the show */}
            <AnimatedEllipse cx="65" cy="154" rx={bicepRx} ry={bicepRy} fill="url(#lc_bicep)" />
            {/* Bicep shine */}
            <Ellipse cx="58" cy="147" rx="9" ry="7" fill="#fff8f0" fillOpacity="0.52" />

            {/* Left action lines (appear at pump peak) */}
            <AnimatedPath d="M 40,136 L 28,130" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />
            <AnimatedPath d="M 37,152 L 24,152" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />
            <AnimatedPath d="M 40,168 L 28,175" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />
            <AnimatedPath d="M 46,124 L 38,115" stroke="#a78bfa" strokeWidth="2"   strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />

            {/* ── RIGHT ARM ── */}
            <Path d="M 191,186 L 244,130" stroke="#fcd5ae" strokeWidth="24" strokeLinecap="round" fill="none" />
            <Path d="M 244,130 L 232,100" stroke="#e8aa7a" strokeWidth="19" strokeLinecap="round" fill="none" />
            <Circle cx="232" cy="95" r="15" fill="url(#lc_fist)" />
            <Path d="M 222,91 Q 232,86 242,91" fill="none" stroke="#b86030" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />

            {/* Right bicep peak */}
            <AnimatedEllipse cx="223" cy="154" rx={bicepRx} ry={bicepRy} fill="url(#lc_bicep)" />
            <Ellipse cx="216" cy="147" rx="9" ry="7" fill="#fff8f0" fillOpacity="0.52" />

            {/* Right action lines */}
            <AnimatedPath d="M 248,136 L 260,130" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />
            <AnimatedPath d="M 251,152 L 264,152" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />
            <AnimatedPath d="M 248,168 L 260,175" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />
            <AnimatedPath d="M 242,124 L 250,115" stroke="#a78bfa" strokeWidth="2"   strokeLinecap="round" fill="none" strokeOpacity={lineAlpha} />

            {/* ── BODY (tank top) ── */}
            <Ellipse cx="144" cy="230" rx="50" ry="46" fill="url(#lc_tank)" />
            {/* Left strap */}
            <Path d="M 122,184 L 118,208 Q 126,217 135,209 L 137,184 Z" fill="#7c3aed" />
            {/* Right strap */}
            <Path d="M 166,184 L 170,208 Q 162,217 153,209 L 151,184 Z" fill="#7c3aed" />
            {/* Chest centre seam */}
            <Path d="M 144,186 L 144,254" stroke="#4c1d95" strokeWidth="1.8" strokeOpacity="0.3" fill="none" />
            {/* Ab rows */}
            <Path d="M 128,224 L 160,224" stroke="#4c1d95" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.28" fill="none" />
            <Path d="M 130,238 L 158,238" stroke="#4c1d95" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.22" fill="none" />
            {/* Pec definition */}
            <Path d="M 100,196 Q 120,204 138,196" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.22" fill="none" />
            <Path d="M 150,196 Q 168,204 188,196" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.22" fill="none" />

            {/* ── NECK ── */}
            <Ellipse cx="144" cy="184" rx="20" ry="11" fill="url(#lc_skin)" />

            {/* ── HEAD ── */}
            <Circle cx="144" cy="106" r="78" fill="url(#lc_skin)" />
            {/* Chin shadow */}
            <Ellipse cx="144" cy="176" rx="50" ry="11" fill="#c07848" fillOpacity="0.13" />

            {/* ── HAIR ── */}
            {/* Main mass */}
            <Ellipse cx="144" cy="55" rx="82" ry="44" fill="url(#lc_hair)" />
            {/* Spiky top — centre tufts */}
            <Path d="M 130,28 Q 136,6  144,4  Q 150,13 148,30 Z" fill="#2a1a0a" />
            <Path d="M 149,26 Q 159,3  170,7  Q 163,25 154,32 Z" fill="#321e0c" />
            <Path d="M 112,36 Q 112,14 124,12 Q 128,28 122,38 Z" fill="#2a1a0a" />
            {/* Side bangs */}
            <Path d="M 78,64 Q 72,84 76,103 Q 87,97 93,80 Q 93,65 84,58 Z" fill="#2a1a0a" />
            <Path d="M 210,62 Q 216,82 212,101 Q 201,95 195,78 Q 195,63 204,56 Z" fill="#2a1a0a" />
            {/* Hair sheen */}
            <Ellipse cx="116" cy="50" rx="30" ry="15" fill="#6a4828" fillOpacity="0.4" />

            {/* ── LEFT EYE ── */}
            {/* Soft halo behind eye */}
            <Ellipse cx="114" cy="111" rx="32" ry="33" fill="#ede9fe" fillOpacity="0.45" />
            {/* Sclera */}
            <Ellipse cx="114" cy="108" rx="29" ry="31" fill="#ffffff" />
            {/* Iris */}
            <Circle  cx="118" cy="112" r="21" fill="url(#lc_iris)" />
            {/* Pupil */}
            <Circle  cx="118" cy="112" r="12" fill="#0e0820" />
            {/* Primary sparkle highlight */}
            <Circle  cx="129" cy="100" r="9.5" fill="#ffffff" />
            {/* Secondary sparkle dots */}
            <Circle  cx="112" cy="123" r="4.5" fill="#ffffff" fillOpacity="0.72" />
            <Circle  cx="123" cy="127" r="2.8" fill="#ffffff" fillOpacity="0.5" />
            {/* Animated sparkle — appears with pump */}
            <AnimatedEllipse cx="133" cy="104" rx="3.5" ry="3.5" fill="#ffffff" opacity={sparkleOp} />
            {/* Blink lid */}
            <AnimatedEllipse cx="114" cy="108" rx="30" ry={lidRy} fill="url(#lc_lid)" />
            {/* Upper lash line */}
            <Path d="M 84,104 Q 112,91 143,102" fill="none" stroke="#1a0e06" strokeWidth="5" strokeLinecap="round" />
            {/* Lower lash hint */}
            <Path d="M 87,120 Q 112,130 139,120" fill="none" stroke="#1a0e06" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />

            {/* ── RIGHT EYE ── */}
            <Ellipse cx="174" cy="109" rx="32" ry="33" fill="#ede9fe" fillOpacity="0.45" />
            <Ellipse cx="174" cy="106" rx="29" ry="31" fill="#ffffff" />
            <Circle  cx="170" cy="110" r="21" fill="url(#lc_iris)" />
            <Circle  cx="170" cy="110" r="12" fill="#0e0820" />
            <Circle  cx="181" cy="98"  r="9.5" fill="#ffffff" />
            <Circle  cx="164" cy="121" r="4.5" fill="#ffffff" fillOpacity="0.72" />
            <Circle  cx="175" cy="125" r="2.8" fill="#ffffff" fillOpacity="0.5" />
            <AnimatedEllipse cx="185" cy="102" rx="3.5" ry="3.5" fill="#ffffff" opacity={sparkleOp} />
            <AnimatedEllipse cx="174" cy="106" rx="30" ry={lidRy} fill="url(#lc_lid)" />
            <Path d="M 145,100 Q 172,89 204,102" fill="none" stroke="#1a0e06" strokeWidth="5" strokeLinecap="round" />
            <Path d="M 149,118 Q 174,128 201,118" fill="none" stroke="#1a0e06" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />

            {/* ── EYEBROWS — arched high, confident ── */}
            <Path d="M 82,88  Q 106,75 138,84" fill="none" stroke="#1a0e06" strokeWidth="5.5" strokeLinecap="round" />
            <Path d="M 150,82 Q 182,70 210,83" fill="none" stroke="#1a0e06" strokeWidth="5.5" strokeLinecap="round" />

            {/* ── NOSE — tiny, cute ── */}
            <Ellipse cx="144" cy="134" rx="8"  ry="5"  fill="#c07848" fillOpacity="0.38" />
            <Circle  cx="140" cy="135" r="3.5" fill="#b06838" fillOpacity="0.32" />
            <Circle  cx="148" cy="135" r="3.5" fill="#b06838" fillOpacity="0.32" />

            {/* ── ROSY CHEEKS ── */}
            <Ellipse cx="80"  cy="138" rx="24" ry="15" fill="#f07060" fillOpacity="0.21" />
            <Ellipse cx="208" cy="136" rx="24" ry="15" fill="#f07060" fillOpacity="0.21" />

            {/* ── MOUTH — big proud smile + teeth ── */}
            <Path
              d="M 113,151 Q 144,176 175,151"
              fill="none" stroke="#c06040" strokeWidth="5.5" strokeLinecap="round"
            />
            {/* Teeth fill */}
            <Path
              d="M 115,152 Q 144,163 173,152 L 171,159 Q 144,170 117,159 Z"
              fill="#ffffff"
            />
            {/* Lip accent */}
            <Path
              d="M 120,153 Q 144,158 168,153"
              fill="none" stroke="#e88060" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"
            />

            {/* ── SWEAT DROP — effort detail ── */}
            <Path
              d="M 196,70 Q 200,60 204,70 Q 204,79 200,80 Q 196,79 196,70 Z"
              fill="#bfdbfe" fillOpacity="0.92"
            />

          </AnimatedG>
        </G>
      </Svg>
    </View>
  );
}
