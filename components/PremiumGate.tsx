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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";
import Svg, { Circle, Path, Line, Rect, G } from "react-native-svg";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";
const PAYWALL_ENABLED = true;
const { width: SCREEN_W } = Dimensions.get("window");

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;
  children: React.ReactNode;
  featureName?: string;
  onPurchaseSuccess?: () => void | Promise<void>;
}

/* ── Animated workout scene ───────────────────────────── */
function WorkoutAnimation() {
  const bounce    = useRef(new Animated.Value(0)).current;
  const barFill   = useRef(new Animated.Value(0)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;
  const sparkle1  = useRef(new Animated.Value(0)).current;
  const sparkle2  = useRef(new Animated.Value(0)).current;
  const sparkle3  = useRef(new Animated.Value(0)).current;
  const armSwing  = useRef(new Animated.Value(0)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Dumbbell bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -12, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(bounce, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.bounce }),
      ])
    ).start();

    // Progress bar fills up
    Animated.loop(
      Animated.sequence([
        Animated.timing(barFill, { toValue: 1, duration: 2500, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
        Animated.delay(800),
        Animated.timing(barFill, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.delay(400),
      ])
    ).start();

    // Floating icons orbit
    Animated.loop(
      Animated.timing(iconFloat, { toValue: 1, duration: 6000, useNativeDriver: true, easing: Easing.linear })
    ).start();

    // Sparkles pop in/out
    const sparkleAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(800),
        ])
      );
    sparkleAnim(sparkle1, 0).start();
    sparkleAnim(sparkle2, 500).start();
    sparkleAnim(sparkle3, 1000).start();

    // Arm pumping
    Animated.loop(
      Animated.sequence([
        Animated.timing(armSwing, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(armSwing, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
      ])
    ).start();

    // Heartbeat
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(heartBeat, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(heartBeat, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(heartBeat, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(1200),
      ])
    ).start();
  }, []);

  const orbitX = iconFloat.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 70, 0, -70, 0] });
  const orbitY = iconFloat.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [-50, 0, 50, 0, -50] });
  const orbit2X = iconFloat.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [60, 0, -60, 0, 60] });
  const orbit2Y = iconFloat.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -45, 0, 45, 0] });
  const orbit3X = iconFloat.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [-50, 30, 50, -30, -50] });
  const orbit3Y = iconFloat.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [30, 50, -30, -50, 30] });

  const armRotate = armSwing.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-25deg"] });

  const barWidth = barFill.interpolate({ inputRange: [0, 1], outputRange: [0, 100] });

  return (
    <View style={wa.scene}>
      {/* Background soft circle */}
      <View style={wa.bgCircle} />

      {/* Orbiting icons */}
      <Animated.View style={[wa.orbitIcon, { transform: [{ translateX: orbitX }, { translateY: orbitY }] }]}>
        <View style={wa.floatingBubble}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#f97316" opacity={0.7} />
          </Svg>
        </View>
      </Animated.View>

      <Animated.View style={[wa.orbitIcon, { transform: [{ translateX: orbit2X }, { translateY: orbit2Y }] }]}>
        <View style={wa.floatingBubble}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 16.96 19.32C18.73 17.62 19.38 15.04 18.43 12.79L18.3 12.49C18.1 12.08 17.83 11.56 17.66 11.2ZM14.5 17.7C14.22 17.95 13.76 18.22 13.4 18.34C12.19 18.75 11 18.18 10.35 17.31C11.4 17.07 12.11 16.25 12.34 15.29C12.52 14.39 12.18 13.64 11.9 12.81C11.64 12.02 11.6 11.31 11.84 10.52C12.05 11.05 12.37 11.53 12.7 11.93C13.72 13.13 15.27 13.67 15.54 15.35C15.58 15.52 15.6 15.69 15.6 15.87C15.6 16.55 15.3 17.19 14.5 17.7Z" fill="#f97316" opacity={0.6} />
          </Svg>
        </View>
      </Animated.View>

      <Animated.View style={[wa.orbitIcon, { transform: [{ translateX: orbit3X }, { translateY: orbit3Y }] }]}>
        <View style={wa.floatingBubble}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M7 17L17 7M17 7H7M17 7V17" stroke="#f97316" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </Animated.View>

      {/* Center character - person lifting */}
      <Animated.View style={[wa.character, { transform: [{ translateY: bounce }] }]}>
        {/* Body */}
        <Svg width={100} height={120} viewBox="0 0 100 120">
          {/* Head */}
          <Circle cx="50" cy="22" r="16" fill="#fdba74" />
          <Circle cx="44" cy="19" r="2" fill="#292524" />
          <Circle cx="56" cy="19" r="2" fill="#292524" />
          <Path d="M45 26 Q50 31 55 26" stroke="#292524" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Hair */}
          <Path d="M34 18 Q34 6 50 6 Q66 6 66 18" fill="#292524" />
          {/* Body */}
          <Rect x="38" y="38" width="24" height="30" rx="5" fill="#f97316" />
          {/* Shorts */}
          <Rect x="38" y="65" width="10" height="16" rx="3" fill="#1e293b" />
          <Rect x="52" y="65" width="10" height="16" rx="3" fill="#1e293b" />
          {/* Shoes */}
          <Rect x="36" y="79" width="14" height="6" rx="3" fill="#f97316" />
          <Rect x="50" y="79" width="14" height="6" rx="3" fill="#f97316" />
        </Svg>
        {/* Dumbbell - animated arm */}
        <Animated.View style={[wa.dumbbell, { transform: [{ rotate: armRotate }] }]}>
          <Svg width={80} height={24} viewBox="0 0 80 24">
            {/* Bar */}
            <Rect x="15" y="9" width="50" height="6" rx="3" fill="#a3a3a3" />
            {/* Left weight */}
            <Rect x="2" y="3" width="16" height="18" rx="4" fill="#525252" />
            {/* Right weight */}
            <Rect x="62" y="3" width="16" height="18" rx="4" fill="#525252" />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* Sparkles */}
      <Animated.View style={[wa.sparkle, { top: 20, right: 30, opacity: sparkle1, transform: [{ scale: sparkle1 }] }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill="#fdba74" /></Svg>
      </Animated.View>
      <Animated.View style={[wa.sparkle, { top: 50, left: 20, opacity: sparkle2, transform: [{ scale: sparkle2 }] }]}>
        <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill="#f97316" /></Svg>
      </Animated.View>
      <Animated.View style={[wa.sparkle, { bottom: 30, right: 25, opacity: sparkle3, transform: [{ scale: sparkle3 }] }]}>
        <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill="#fed7aa" /></Svg>
      </Animated.View>

      {/* Heartbeat icon */}
      <Animated.View style={[wa.heartFloat, { transform: [{ scale: heartBeat }] }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ef4444" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Animated progress bar */}
      <View style={wa.progressWrap}>
        <Animated.View style={[wa.progressFill, { width: barWidth }]} />
        <Text style={wa.progressLabel}>GAINS</Text>
      </View>
    </View>
  );
}

const wa = StyleSheet.create({
  scene: {
    width: SCREEN_W,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bgCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#fff7ed",
  },
  character: {
    alignItems: "center",
  },
  dumbbell: {
    marginTop: -50,
    transformOrigin: "center",
  },
  orbitIcon: {
    position: "absolute",
  },
  floatingBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sparkle: {
    position: "absolute",
  },
  heartFloat: {
    position: "absolute",
    top: 35,
    left: 45,
  },
  progressWrap: {
    position: "absolute",
    bottom: 15,
    width: 120,
    height: 6,
    backgroundColor: "#fed7aa",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#f97316",
    borderRadius: 3,
  },
  progressLabel: {
    position: "absolute",
    top: -14,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "800",
    color: "#f97316",
    letterSpacing: 2,
  },
});

/* ── Timeline icons (SVG) ─────────────────────────────── */
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
        <ActivityIndicator size="large" color="#f97316" />
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

      {/* ── Animated workout scene ─────────────────── */}
      <WorkoutAnimation />

      {/* ── Bottom content ─────────────────────────── */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={s.title}>Level Up Your Fitness</Text>
        <Text style={s.subtitle}>Unlock AI coaching, tracking and nutrition</Text>

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
            <View style={[s.tlDot, { backgroundColor: "#f97316" }]}><BoltSvg /></View>
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
    backgroundColor: "#fffbf5",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fffbf5",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    letterSpacing: -0.6,
    marginBottom: 6,
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
  tlLine: { flex: 1, backgroundColor: "#f3e8d8", borderRadius: 1 },
  tlText: { flex: 1, marginLeft: 14, paddingBottom: 10 },
  tlTitle: { fontSize: 14, fontWeight: "700", color: "#292524", marginBottom: 2 },
  tlDesc: { fontSize: 12, color: "#b5b5b5", fontWeight: "500" },

  /* Error */
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { fontSize: 12, color: "#dc2626", textAlign: "center", fontWeight: "500" },

  /* CTA */
  cta: {
    backgroundColor: "#f97316",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  ctaPressed: { backgroundColor: "#ea580c" },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#ffffff", letterSpacing: -0.2 },

  /* Footer */
  restoreText: { fontSize: 13, color: "#d4d4d4", textAlign: "center", fontWeight: "600", marginBottom: 10 },
  legalRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  legalLink: { fontSize: 11, color: "#d4d4d4", fontWeight: "500" },
  legalDot: { fontSize: 11, color: "#e5e5e5", marginHorizontal: 6 },
});
