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
const LOGO     = require("@/assets/images/logo.png");
Image.prefetch(Image.resolveAssetSource(HERO_IMG).uri).catch(() => {});
Image.prefetch(Image.resolveAssetSource(LOGO).uri).catch(() => {});

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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

  useEffect(() => {
    if (!ready) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [ready]);

  useEffect(() => {
    setTimeout(() => setReady(true), 100);
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
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* ── Hero image area ─────────────────────────────── */}
      <View style={s.heroSection}>
        <Image source={HERO_IMG} style={s.heroImg} resizeMode="contain" />
      </View>

      {/* ── Bottom content ──────────────────────────────── */}
      <Animated.View style={[s.bottom, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Title block */}
        <View style={s.titleBlock}>
          <Text style={s.title}>
            Unlock <Text style={s.titleAccent}>Pro</Text>
          </Text>
          <Text style={s.subtitle}>
            AI coaching, macro tracking, meal plans — all unlimited.
          </Text>
        </View>

        {/* Pricing pill */}
        <View style={s.pricingPill}>
          <View style={s.pillLeft}>
            <Text style={s.pillPrice}>$12.99</Text>
            <Text style={s.pillPeriod}>/month</Text>
          </View>
          <View style={s.pillDivider} />
          <Text style={s.pillDetail}>Cancel anytime</Text>
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
            <Text style={s.ctaText}>Continue</Text>
          )}
        </Pressable>

        {/* Restore + Legal */}
        <View style={s.footerRow}>
          <Pressable onPress={handleRestore} disabled={isLoading}>
            <Text style={[s.footerLink, isLoading && { opacity: 0.4 }]}>Restore</Text>
          </Pressable>
          <Text style={s.footerDot}>·</Text>
          <Text style={s.footerLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
          <Text style={s.footerDot}>·</Text>
          <Text style={s.footerLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy</Text>
        </View>

        <Text style={s.disclosure}>
          Auto-renews at $12.99/mo. Cancel in Settings anytime.
        </Text>
      </Animated.View>
    </View>
  );
}

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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  heroImg: {
    width: SCREEN_W * 0.85,
    height: SCREEN_H * 0.38,
  },

  /* ── Bottom ──────────────────────────────────────── */
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  titleBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -1,
    marginBottom: 8,
  },
  titleAccent: {
    color: "#ef4444",
  },
  subtitle: {
    fontSize: 15,
    color: "#888888",
    lineHeight: 22,
    fontWeight: "500",
  },

  /* ── Pricing pill ────────────────────────────────── */
  pricingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pillLeft: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  pillPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
  },
  pillPeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888888",
    marginLeft: 2,
  },
  pillDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#dddddd",
    marginHorizontal: 16,
  },
  pillDetail: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888888",
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
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  ctaPressed: {
    backgroundColor: "#222222",
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },

  /* ── Footer ──────────────────────────────────────── */
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#aaaaaa",
  },
  footerDot: {
    fontSize: 12,
    color: "#cccccc",
    marginHorizontal: 8,
  },
  disclosure: {
    fontSize: 10,
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "400",
  },
});
