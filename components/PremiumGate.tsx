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
import Svg, { Circle, Path, Line, Rect } from "react-native-svg";

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

/* ── Animated rings illustration ──────────────────────── */
function AnimatedRings() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered fade-in for rings
    Animated.stagger(200, [
      Animated.timing(ring1, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(ring2, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(ring3, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();

    // Continuous gentle pulse on center
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  return (
    <View style={a.container}>
      {/* Outer ring */}
      <Animated.View style={[a.ring, a.ring3, { opacity: ring3, transform: [{ scale: ring3.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]} />
      {/* Middle ring */}
      <Animated.View style={[a.ring, a.ring2, { opacity: ring2, transform: [{ scale: ring2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]} />
      {/* Inner ring */}
      <Animated.View style={[a.ring, a.ring1, { opacity: ring1, transform: [{ scale: ring1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]} />
      {/* Center icon - pulsing */}
      <Animated.View style={[a.center, { transform: [{ scale: pulse }] }]}>
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#ef4444" opacity={0.9} />
        </Svg>
      </Animated.View>

      {/* Floating dots */}
      <Animated.View style={[a.dot, a.dot1, { opacity: ring2 }]} />
      <Animated.View style={[a.dot, a.dot2, { opacity: ring3 }]} />
      <Animated.View style={[a.dot, a.dot3, { opacity: ring1 }]} />
    </View>
  );
}

const a = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ring1: {
    width: 80,
    height: 80,
    borderColor: "rgba(239,68,68,0.25)",
  },
  ring2: {
    width: 130,
    height: 130,
    borderColor: "rgba(239,68,68,0.12)",
  },
  ring3: {
    width: 180,
    height: 180,
    borderColor: "rgba(239,68,68,0.06)",
  },
  center: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff5f5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  dot1: { top: 25, right: 40 },
  dot2: { bottom: 35, left: 30 },
  dot3: { top: 60, left: 25 },
});

/* ── Timeline icons (SVG, no emoji) ───────────────────── */
function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function BoltIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" />
    </Svg>
  );
}
function CalendarIcon() {
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
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
        <ActivityIndicator size="large" color="#ef4444" />
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
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>

      {/* ── Top: animated illustration ──────────────── */}
      <View style={s.illustrationArea}>
        <AnimatedRings />
      </View>

      {/* ── Title ───────────────────────────────────── */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={s.title}>Go Pro</Text>
        <Text style={s.subtitle}>
          Unlock AI coaching, tracking and meal plans
        </Text>

        {/* ── Timeline ────────────────────────────────── */}
        <View style={s.timeline}>
          <View style={s.tlRow}>
            <View style={[s.tlDot, { backgroundColor: "#10b981" }]}><CheckIcon /></View>
            {/* line */}
            <View style={s.tlLineWrap}><View style={s.tlLine} /></View>
            <View style={s.tlText}>
              <Text style={s.tlTitle}>Account Created</Text>
              <Text style={s.tlDesc}>You're all set up</Text>
            </View>
          </View>

          <View style={s.tlRow}>
            <View style={[s.tlDot, { backgroundColor: "#ef4444" }]}><BoltIcon /></View>
            <View style={s.tlLineWrap}><View style={s.tlLine} /></View>
            <View style={s.tlText}>
              <Text style={s.tlTitle}>Instant Access</Text>
              <Text style={s.tlDesc}>All features unlocked today</Text>
            </View>
          </View>

          <View style={s.tlRow}>
            <View style={[s.tlDot, { backgroundColor: "#8b5cf6" }]}><CalendarIcon /></View>
            <View style={s.tlLineWrap} />
            <View style={s.tlText}>
              <Text style={s.tlTitle}>Billed Monthly</Text>
              <Text style={s.tlDesc}>$12.99/mo · Cancel anytime</Text>
            </View>
          </View>
        </View>

        {/* ── Error ────────────────────────────────────── */}
        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── CTA ──────────────────────────────────────── */}
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

        {/* ── Footer ───────────────────────────────────── */}
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
    backgroundColor: "#fafafa",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Illustration ────────────────────────────────── */
  illustrationArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 8,
  },

  /* ── Content ─────────────────────────────────────── */
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#999999",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 28,
    lineHeight: 21,
  },

  /* ── Timeline ────────────────────────────────────── */
  timeline: {
    marginBottom: 24,
    gap: 0,
  },
  tlRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 52,
  },
  tlDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tlLineWrap: {
    position: "absolute",
    left: 13,
    top: 28,
    bottom: 0,
    width: 2,
  },
  tlLine: {
    flex: 1,
    backgroundColor: "#e8e8e8",
    borderRadius: 1,
  },
  tlText: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 12,
  },
  tlTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 2,
  },
  tlDesc: {
    fontSize: 12,
    color: "#aaaaaa",
    fontWeight: "500",
  },

  /* ── Error ───────────────────────────────────────── */
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "500",
  },

  /* ── CTA ─────────────────────────────────────────── */
  cta: {
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 14,
  },
  ctaPressed: {
    backgroundColor: "#333333",
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },

  /* ── Footer ──────────────────────────────────────── */
  restoreText: {
    fontSize: 13,
    color: "#bbbbbb",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 10,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: {
    fontSize: 11,
    color: "#cccccc",
    fontWeight: "500",
  },
  legalDot: {
    fontSize: 11,
    color: "#dddddd",
    marginHorizontal: 6,
  },
});
