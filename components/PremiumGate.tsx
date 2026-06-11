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
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";
import { LinearGradient } from "expo-linear-gradient";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

const PAYWALL_ENABLED = true;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;
  children: React.ReactNode;
  featureName?: string;
  onPurchaseSuccess?: () => void | Promise<void>;
}

const HERO_IMG = require("@/assets/images/frontComp.png");
Image.prefetch(Image.resolveAssetSource(HERO_IMG).uri).catch(() => {});

export default function PremiumGate({
  isUserPremium,
  subChecking = false,
  children,
  featureName = "Feature",
  onPurchaseSuccess,
}: PremiumGateProps) {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string>("");
  const [ready, setReady] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

  useEffect(() => {
    if (!ready) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [ready]);

  useEffect(() => {
    setTimeout(() => setReady(true), 150);
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
    <View style={[s.root, { paddingBottom: insets.bottom }]}>

      {/* ── Purple/gradient hero area ─────────────────── */}
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={[s.heroSection, { paddingTop: insets.top + 12 }]}
      >
        {/* Close-ish area spacer */}
        <View style={s.heroTopSpacer} />

        {/* Hero image */}
        <Image source={HERO_IMG} style={s.heroImg} resizeMode="contain" />

        {/* Title overlaid on gradient */}
        <Text style={s.heroTitle}>Unlock Everything</Text>
        <Text style={s.heroSubtitle}>
          AI coaching, macro tracking & meal plans
        </Text>
      </LinearGradient>

      {/* ── White bottom card ─────────────────────────── */}
      <Animated.View style={[s.bottomCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Timeline steps */}
        <View style={s.timeline}>
          <TimelineStep
            icon="✓"
            iconBg="#10b981"
            title="Sign Up"
            desc="Create your account for free"
            isLast={false}
          />
          <TimelineStep
            icon="⚡"
            iconBg="#ef4444"
            title="Today: Get Instant Access"
            desc="Unlock all premium features"
            isLast={false}
          />
          <TimelineStep
            icon="💳"
            iconBg="#8b5cf6"
            title="Payment Starts"
            desc="$12.99/mo, cancel anytime in Settings"
            isLast={true}
          />
        </View>

        {/* Pricing selector */}
        <View style={s.planOption}>
          <View style={s.planRadioOuter}>
            <View style={s.planRadioInner} />
          </View>
          <View style={s.planInfo}>
            <Text style={s.planLabel}>Monthly</Text>
          </View>
          <Text style={s.planPrice}>$12.99 / mo</Text>
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
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.ctaText}>Subscribe Now</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Footer */}
        <Pressable onPress={handleRestore} disabled={isLoading}>
          <Text style={[s.restoreText, isLoading && { opacity: 0.4 }]}>
            Restore purchase
          </Text>
        </Pressable>

        <Text style={s.disclosure}>
          Auto-renews at $12.99/mo. Cancel in Settings {">"} Apple ID {">"} Subscriptions.
        </Text>

        <View style={s.legalRow}>
          <Text style={s.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
          <Text style={s.legalDot}>·</Text>
          <Text style={s.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/* ── Timeline Step Component ──────────────────────────── */
function TimelineStep({ icon, iconBg, title, desc, isLast }: {
  icon: string; iconBg: string; title: string; desc: string; isLast: boolean;
}) {
  return (
    <View style={ts.row}>
      <View style={ts.iconCol}>
        <View style={[ts.iconCircle, { backgroundColor: iconBg }]}>
          <Text style={ts.iconText}>{icon}</Text>
        </View>
        {!isLast && <View style={ts.line} />}
      </View>
      <View style={ts.textCol}>
        <Text style={ts.title}>{title}</Text>
        <Text style={ts.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const ts = StyleSheet.create({
  row: {
    flexDirection: "row",
    minHeight: 56,
  },
  iconCol: {
    width: 36,
    alignItems: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 13,
    color: "#ffffff",
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 3,
  },
  desc: {
    fontSize: 12,
    color: "#888888",
    lineHeight: 17,
  },
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Hero ────────────────────────────────────────── */
  heroSection: {
    alignItems: "center",
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopSpacer: {
    height: 8,
  },
  heroImg: {
    width: SCREEN_W * 0.75,
    height: SCREEN_H * 0.26,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 40,
  },

  /* ── Bottom card ─────────────────────────────────── */
  bottomCard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* ── Timeline ────────────────────────────────────── */
  timeline: {
    marginBottom: 20,
  },

  /* ── Plan option ─────────────────────────────────── */
  planOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fef7f7",
  },
  planRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  planPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
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
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    paddingVertical: 17,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },

  /* ── Footer ──────────────────────────────────────── */
  restoreText: {
    fontSize: 13,
    color: "#ef4444",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 12,
  },
  disclosure: {
    fontSize: 10,
    color: "#bbbbbb",
    textAlign: "center",
    lineHeight: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: {
    fontSize: 10,
    color: "#bbbbbb",
    fontWeight: "500",
  },
  legalDot: {
    fontSize: 10,
    color: "#cccccc",
    marginHorizontal: 6,
  },
});
