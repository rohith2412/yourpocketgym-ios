import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";
import Svg, { Circle, Path, Line, Rect, Ellipse } from "react-native-svg";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";
const PAYWALL_ENABLED = true;
const { width: SCREEN_W } = Dimensions.get("window");

// Brand colors from the app's design system
const BRAND     = "#e8380d";
const BRAND_L   = "#ff6b42";
const BRAND_BG  = "#fafaf8";
const DIVIDER   = "#f0ede8";
const NEUTRAL   = "#f4f2ed";
const TEXT_MAIN  = "#1a1a1a";

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;
  children: React.ReactNode;
  featureName?: string;
  onPurchaseSuccess?: () => void | Promise<void>;
}

const LOGO = require("@/assets/images/logo.png");
Image.prefetch(Image.resolveAssetSource(LOGO).uri).catch(() => {});

/* ── Cute animated workout character ──────────────────── */
function CuteCharacterAnimation() {
  // Animations
  const bodyBounce = useRef(new Animated.Value(0)).current;
  const armLeft    = useRef(new Animated.Value(0)).current;
  const armRight   = useRef(new Animated.Value(0)).current;
  const starScale1 = useRef(new Animated.Value(0)).current;
  const starScale2 = useRef(new Animated.Value(0)).current;
  const starScale3 = useRef(new Animated.Value(0)).current;
  const starScale4 = useRef(new Animated.Value(0)).current;
  const glowPulse  = useRef(new Animated.Value(0.6)).current;
  const float1     = useRef(new Animated.Value(0)).current;
  const float2     = useRef(new Animated.Value(0)).current;
  const float3     = useRef(new Animated.Value(0)).current;
  const shimmer    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Body bounces while working out
    Animated.loop(
      Animated.sequence([
        Animated.timing(bodyBounce, { toValue: -8, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(bodyBounce, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      ])
    ).start();

    // Left arm lifts dumbbell
    Animated.loop(
      Animated.sequence([
        Animated.timing(armLeft, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(armLeft, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
      ])
    ).start();

    // Right arm lifts (offset)
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(armRight, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(armRight, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
      ])
    ).start();

    // Sparkle stars pop in/out
    const starAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.spring(anim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(500),
      ]));
    starAnim(starScale1, 0).start();
    starAnim(starScale2, 400).start();
    starAnim(starScale3, 800).start();
    starAnim(starScale4, 1200).start();

    // Background glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    // Floating particles
    Animated.loop(
      Animated.timing(float1, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.linear })
    ).start();
    Animated.loop(
      Animated.timing(float2, { toValue: 1, duration: 5000, useNativeDriver: true, easing: Easing.linear })
    ).start();
    Animated.loop(
      Animated.timing(float3, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.linear })
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);

  const leftY  = armLeft.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const rightY = armRight.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  const float1Y = float1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] });
  const float1X = float1.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 8, 0, -8, 0] });
  const float2Y = float2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -15, 0] });
  const float2X = float2.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -10, 0, 10, 0] });
  const float3Y = float3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -25, 0] });

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });

  return (
    <View style={ca.scene}>
      {/* Glow backdrop */}
      <Animated.View style={[ca.glowBg, { opacity: glowPulse }]} />
      <Animated.View style={[ca.glowBg2, { opacity: glowPulse }]} />

      {/* Floating mini icons */}
      <Animated.View style={[ca.floater, { top: 15, left: 35, transform: [{ translateY: float1Y }, { translateX: float1X }] }]}>
        <View style={ca.floaterBubble}>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 16.96 19.32C18.73 17.62 19.38 15.04 18.43 12.79L18.3 12.49C18.1 12.08 17.83 11.56 17.66 11.2Z" fill={BRAND} opacity={0.8} /></Svg>
        </View>
      </Animated.View>

      <Animated.View style={[ca.floater, { top: 25, right: 30, transform: [{ translateY: float2Y }, { translateX: float2X }] }]}>
        <View style={ca.floaterBubble}>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={BRAND} opacity={0.8} /></Svg>
        </View>
      </Animated.View>

      <Animated.View style={[ca.floater, { bottom: 30, right: 45, transform: [{ translateY: float3Y }] }]}>
        <View style={ca.floaterBubble}>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M7 17L17 7M17 7H7M17 7V17" stroke={BRAND} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </View>
      </Animated.View>

      {/* Main character group */}
      <Animated.View style={[ca.characterWrap, { transform: [{ translateY: bodyBounce }] }]}>
        {/* Shadow under character */}
        <View style={ca.shadow} />

        <Svg width={140} height={145} viewBox="0 0 140 145">
          {/* ── Cute round body ── */}
          {/* Torso - rounded cute body */}
          <Ellipse cx="70" cy="82" rx="28" ry="30" fill={BRAND} />
          {/* Shine on body */}
          <Ellipse cx="62" cy="74" rx="8" ry="12" fill="#fff" opacity={0.15} />

          {/* Head - big cute round head */}
          <Circle cx="70" cy="38" r="26" fill="#fcd6b3" />
          {/* Cheek blush */}
          <Circle cx="54" cy="42" r="6" fill="#ffb3a7" opacity={0.5} />
          <Circle cx="86" cy="42" r="6" fill="#ffb3a7" opacity={0.5} />
          {/* Eyes - big cute eyes */}
          <Circle cx="61" cy="35" r="5" fill="#1a1a1a" />
          <Circle cx="79" cy="35" r="5" fill="#1a1a1a" />
          {/* Eye shine */}
          <Circle cx="63" cy="33" r="2" fill="#ffffff" />
          <Circle cx="81" cy="33" r="2" fill="#ffffff" />
          {/* Cute smile */}
          <Path d="M62 46 Q70 54 78 46" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Hair */}
          <Path d="M44 30 Q44 10 70 10 Q96 10 96 30" fill="#292524" />
          <Path d="M52 14 Q60 6 70 10" fill="#292524" />

          {/* Legs - cute stubby */}
          <Rect x="54" y="108" width="12" height="18" rx="6" fill="#1e293b" />
          <Rect x="74" y="108" width="12" height="18" rx="6" fill="#1e293b" />
          {/* Shoes */}
          <Ellipse cx="60" cy="128" rx="10" ry="5" fill={BRAND} />
          <Ellipse cx="80" cy="128" rx="10" ry="5" fill={BRAND} />
          <Ellipse cx="60" cy="127" rx="10" ry="3" fill={BRAND_L} />
          <Ellipse cx="80" cy="127" rx="10" ry="3" fill={BRAND_L} />

          {/* Headband */}
          <Rect x="44" y="18" width="52" height="5" rx="2.5" fill={BRAND} />
        </Svg>

        {/* Left dumbbell arm */}
        <Animated.View style={[ca.armLeft, { transform: [{ translateY: leftY }] }]}>
          <Svg width={55} height={50} viewBox="0 0 55 50">
            {/* Arm */}
            <Rect x="30" y="16" width="14" height="22" rx="7" fill="#fcd6b3" />
            {/* Dumbbell */}
            <Rect x="18" y="4" width="24" height="8" rx="4" fill="#a3a3a3" />
            <Rect x="10" y="0" width="12" height="16" rx="4" fill="#525252" />
            <Rect x="38" y="0" width="12" height="16" rx="4" fill="#525252" />
            {/* Shine on weight */}
            <Rect x="12" y="2" width="3" height="8" rx="1.5" fill="#737373" />
            <Rect x="40" y="2" width="3" height="8" rx="1.5" fill="#737373" />
          </Svg>
        </Animated.View>

        {/* Right dumbbell arm */}
        <Animated.View style={[ca.armRight, { transform: [{ translateY: rightY }] }]}>
          <Svg width={55} height={50} viewBox="0 0 55 50">
            <Rect x="11" y="16" width="14" height="22" rx="7" fill="#fcd6b3" />
            <Rect x="8" y="4" width="24" height="8" rx="4" fill="#a3a3a3" />
            <Rect x="0" y="0" width="12" height="16" rx="4" fill="#525252" />
            <Rect x="28" y="0" width="12" height="16" rx="4" fill="#525252" />
            <Rect x="2" y="2" width="3" height="8" rx="1.5" fill="#737373" />
            <Rect x="30" y="2" width="3" height="8" rx="1.5" fill="#737373" />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* Sparkle stars */}
      <Animated.View style={[ca.star, { top: 8, right: 55, transform: [{ scale: starScale1 }] }]}>
        <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M12 2l2 6.5H21l-5.5 4 2 6.5L12 15l-5.5 4 2-6.5L3 8.5h7L12 2z" fill="#fbbf24" /></Svg>
      </Animated.View>
      <Animated.View style={[ca.star, { top: 45, left: 22, transform: [{ scale: starScale2 }] }]}>
        <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 2l2 6.5H21l-5.5 4 2 6.5L12 15l-5.5 4 2-6.5L3 8.5h7L12 2z" fill={BRAND_L} /></Svg>
      </Animated.View>
      <Animated.View style={[ca.star, { bottom: 40, left: 35, transform: [{ scale: starScale3 }] }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M12 2l2 6.5H21l-5.5 4 2 6.5L12 15l-5.5 4 2-6.5L3 8.5h7L12 2z" fill="#fbbf24" /></Svg>
      </Animated.View>
      <Animated.View style={[ca.star, { top: 70, right: 28, transform: [{ scale: starScale4 }] }]}>
        <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="M12 2l2 6.5H21l-5.5 4 2 6.5L12 15l-5.5 4 2-6.5L3 8.5h7L12 2z" fill={BRAND} /></Svg>
      </Animated.View>

      {/* Shimmer streak across */}
      <Animated.View style={[ca.shimmer, { transform: [{ translateX: shimmerX }] }]} />
    </View>
  );
}

const ca = StyleSheet.create({
  scene: {
    width: SCREEN_W,
    height: 290,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glowBg: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(232,56,13,0.07)",
  },
  glowBg2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(232,56,13,0.03)",
  },
  characterWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    position: "absolute",
    bottom: -8,
    width: 60,
    height: 12,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  armLeft: {
    position: "absolute",
    left: -18,
    top: 28,
  },
  armRight: {
    position: "absolute",
    right: -18,
    top: 28,
  },
  floater: {
    position: "absolute",
    zIndex: 10,
  },
  floaterBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  star: {
    position: "absolute",
    zIndex: 20,
  },
  shimmer: {
    position: "absolute",
    width: 4,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
    transform: [{ rotate: "20deg" }],
  },
});

/* ── Timeline SVG icons ───────────────────────────────── */
function CheckSvg() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function BoltSvg() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" />
    </Svg>
  );
}
function CalendarSvg() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#fff" strokeWidth={2} />
      <Line x1="3" y1="10" x2="21" y2="10" stroke="#fff" strokeWidth={2} />
      <Line x1="8" y1="2" x2="8" y2="6" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function PremiumGate({
  isUserPremium,
  subChecking = false,
  children,
  featureName = "Feature",
  onPurchaseSuccess,
}: PremiumGateProps) {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string>("");
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((userStr) => {
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setUserId(user.sub || user.uid || user.id || "");
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  if (!PAYWALL_ENABLED || isUserPremium) return <>{children}</>;

  if (subChecking) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  const handlePurchase = async () => {
    if (!userId) { Alert.alert("Error", "Please log in first."); return; }
    const result = await purchaseMonthlySubscription(userId);
    if (result.success) await onPurchaseSuccess?.();
    else if (result.error) Alert.alert("Purchase Failed", result.error);
  };

  const handleRestore = async () => {
    if (!userId) { Alert.alert("Error", "Please log in first."); return; }
    const result = await restorePurchases(userId);
    if (result.success) await onPurchaseSuccess?.();
    else Alert.alert("No Purchases Found", "No active subscription found.");
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 6 }]}>

      {/* ── Animated character ─────────────────────── */}
      <CuteCharacterAnimation />

      {/* ── Bottom content ─────────────────────────── */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo + Title */}
        <View style={s.titleRow}>
          <Image source={LOGO} style={s.logoMini} resizeMode="contain" />
          <Text style={s.title}>PocketGym Pro</Text>
        </View>
        <Text style={s.subtitle}>Unlock your full fitness potential</Text>

        {/* Timeline */}
        <View style={s.timeline}>
          <View style={s.tlRow}>
            <View style={[s.tlDot, { backgroundColor: "#22c55e" }]}><CheckSvg /></View>
            <View style={s.tlLineWrap}><View style={s.tlLine} /></View>
            <View style={s.tlText}>
              <Text style={s.tlTitle}>Account Created</Text>
              <Text style={s.tlDesc}>You're all set up</Text>
            </View>
          </View>
          <View style={s.tlRow}>
            <View style={[s.tlDot, { backgroundColor: BRAND }]}><BoltSvg /></View>
            <View style={s.tlLineWrap}><View style={s.tlLine} /></View>
            <View style={s.tlText}>
              <Text style={s.tlTitle}>Instant Access</Text>
              <Text style={s.tlDesc}>All premium features unlocked</Text>
            </View>
          </View>
          <View style={s.tlRow}>
            <View style={[s.tlDot, { backgroundColor: "#a78bfa" }]}><CalendarSvg /></View>
            <View style={s.tlLineWrap} />
            <View style={s.tlText}>
              <Text style={s.tlTitle}>Billed Monthly</Text>
              <Text style={s.tlDesc}>$12.99/mo · Cancel anytime</Text>
            </View>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed, isLoading && s.ctaDisabled]}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.ctaText}>Continue — $12.99/mo</Text>
          )}
        </Pressable>

        {/* Footer */}
        <Pressable onPress={handleRestore} disabled={isLoading}>
          <Text style={[s.restoreText, isLoading && { opacity: 0.4 }]}>Restore purchase</Text>
        </Pressable>
        <View style={s.legalRow}>
          <Text style={s.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
          <Text style={s.legalDot}>·</Text>
          <Text style={s.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: BRAND_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },

  /* Title */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 10,
  },
  logoMini: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: TEXT_MAIN,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: "#a3a3a3",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 24,
  },

  /* Timeline */
  timeline: { marginBottom: 20 },
  tlRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 50 },
  tlDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tlLineWrap: { position: "absolute", left: 13, top: 28, bottom: 0, width: 2 },
  tlLine: { flex: 1, backgroundColor: DIVIDER, borderRadius: 1 },
  tlText: { flex: 1, marginLeft: 14, paddingBottom: 10 },
  tlTitle: { fontSize: 14, fontWeight: "700", color: TEXT_MAIN, marginBottom: 2 },
  tlDesc: { fontSize: 12, color: "#b5b5b5", fontWeight: "500" },

  /* Error */
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { fontSize: 12, color: "#dc2626", textAlign: "center", fontWeight: "500" },

  /* CTA */
  cta: {
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  ctaPressed: { backgroundColor: "#c02e0a" },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#ffffff", letterSpacing: -0.2 },

  /* Footer */
  restoreText: { fontSize: 13, color: "#c7c7c7", textAlign: "center", fontWeight: "600", marginBottom: 10 },
  legalRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  legalLink: { fontSize: 11, color: "#c7c7c7", fontWeight: "500" },
  legalDot: { fontSize: 11, color: "#d4d4d4", marginHorizontal: 6 },
});
