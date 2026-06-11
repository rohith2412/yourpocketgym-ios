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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";
import Svg, { Path, Circle, Line, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

const PAYWALL_ENABLED = true;

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;
  children: React.ReactNode;
  featureName?: string;
  onPurchaseSuccess?: () => void | Promise<void>;
}

const LOGO = require("@/assets/images/logo.png");
Image.prefetch(Image.resolveAssetSource(LOGO).uri).catch(() => {});

// ── SVG Icon Components ──────────────────────────────────────────────────────
function CoachIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6" r="2.5" fill="#ef4444" opacity="0.2" />
      <Path d="M12 9v6m-3-6v6m6 0v6" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <Rect x="9" y="15" width="6" height="6" rx="1" fill="#ef4444" opacity="0.1" stroke="#ef4444" strokeWidth="1.5" />
    </Svg>
  );
}

function RecipeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" fill="#ef4444" opacity="0.1" stroke="#ef4444" strokeWidth="1.5" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ScanIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" fill="#ef4444" opacity="0.1" stroke="#ef4444" strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="3.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="1.5" fill="#ef4444" />
    </Svg>
  );
}

function ListIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2z" fill="#ef4444" />
      <Path d="M8 7h12M8 12h12M8 17h12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

const FEATURES = [
  { icon: CoachIcon, title: "Unlimited AI Coach", desc: "Personal training guidance tailored to you" },
  { icon: RecipeIcon, title: "All Recipes & Meal Plans", desc: "Curated nutrition matched to your goals" },
  { icon: ScanIcon, title: "Macro Scanner", desc: "AI-powered food recognition" },
  { icon: ListIcon, title: "Smart Tracking", desc: "Track every workout and meal" },
];

export default function PremiumGate({
  isUserPremium,
  subChecking = false,
  children,
  featureName = "Feature",
  onPurchaseSuccess,
}: PremiumGateProps) {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string>("");
  const [logoReady, setLogoReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

  useEffect(() => {
    if (!logoReady) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [logoReady]);

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((userStr) => {
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setUserId(user.sub || user.uid || user.id || "");
          } catch (e) {
            console.error("Failed to parse user data:", e);
          }
        }
      })
      .catch((e) => console.error("Failed to get user:", e));
  }, []);

  if (!PAYWALL_ENABLED || isUserPremium) {
    return <>{children}</>;
  }

  if (subChecking) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const handlePurchase = async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated. Please log in.");
      return;
    }
    const result = await purchaseMonthlySubscription(userId);
    if (result.success) {
      await onPurchaseSuccess?.();
    } else {
      Alert.alert("Purchase Failed", result.error || "Please try again.");
    }
  };

  const handleRestore = async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated. Please log in.");
      return;
    }
    const result = await restorePurchases(userId);
    if (result.success) {
      await onPurchaseSuccess?.();
    } else {
      Alert.alert("No Purchases Found", "You don't have any previous purchases to restore.");
    }
  };

  return (
    <View style={s.root}>
      <Animated.View
        style={[
          s.container,
          {
            opacity: fadeAnim,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Decorative top element */}
          <View style={s.topDecor} />

          {/* Logo */}
          <Image
            source={LOGO}
            style={s.logo}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setLogoReady(true)}
            onError={() => setLogoReady(true)}
          />

          {/* Title */}
          <Text style={s.title}>PocketGym Pro</Text>
          <Text style={s.subtitle}>Unlock your fitness potential</Text>

          {/* Features Grid */}
          <View style={s.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureCard}>
                <View style={s.featureIconBox}>
                  <f.icon />
                </View>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Card - Premium Design */}
          <View style={s.premiumPricingCard}>
            <View style={s.pricingHeader}>
              <Text style={s.planNamePremium}>Monthly Subscription</Text>
              <View style={s.pricingBadge}>
                <Text style={s.badgeText}>7-DAY FREE TRIAL</Text>
              </View>
            </View>

            <View style={s.priceDisplay}>
              <Text style={s.priceCurrency}>$</Text>
              <Text style={s.priceAmount}>12.99</Text>
              <Text style={s.pricePeriod}>/month</Text>
            </View>

            <Text style={s.priceSubtext}>Cancel anytime. Auto-renews monthly.</Text>

            <View style={s.pricingDivider} />

            <View style={s.whatsIncluded}>
              <Text style={s.whatsIncludedTitle}>What's Included:</Text>
              <View style={s.checkmarkItem}>
                <Text style={s.checkmark}>✓</Text>
                <Text style={s.checkmarkText}>Unlimited AI Coach Sessions</Text>
              </View>
              <View style={s.checkmarkItem}>
                <Text style={s.checkmark}>✓</Text>
                <Text style={s.checkmarkText}>Full Tracking & Analytics</Text>
              </View>
              <View style={s.checkmarkItem}>
                <Text style={s.checkmark}>✓</Text>
                <Text style={s.checkmarkText}>All Recipes & Meal Plans</Text>
              </View>
              <View style={s.checkmarkItem}>
                <Text style={s.checkmark}>✓</Text>
                <Text style={s.checkmarkText}>Priority Support</Text>
              </View>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Premium CTA Button */}
          <Pressable
            style={({ pressed }) => [
              s.ctaPremium,
              pressed && s.ctaPremiumPressed,
              isLoading && s.ctaDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={s.ctaTextPremium}>Start Free Trial</Text>
                <Text style={s.ctaSubtext}>Then $12.99/month</Text>
              </>
            )}
          </Pressable>

          {/* Restore Link */}
          <Pressable onPress={handleRestore} disabled={isLoading}>
            <Text style={[s.restoreLink, isLoading && { opacity: 0.5 }]}>
              Already a member? Restore purchase
            </Text>
          </Pressable>

          {/* Apple-required disclosure */}
          <Text style={s.renewalNotice}>
            Subscription auto-renews monthly unless cancelled at least 24 hours before the end of the current period. Payment is charged to your Apple ID account. Manage or cancel anytime in Settings.
          </Text>

          {/* Legal links */}
          <View style={s.legalRow}>
            <Text
              style={s.legalLink}
              onPress={() => Linking.openURL(TERMS_URL)}
            >
              Terms
            </Text>
            <Text style={s.legalDot}> · </Text>
            <Text
              style={s.legalLink}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              Privacy
            </Text>
          </View>
        </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topDecor: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ef4444",
    opacity: 0.08,
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 18,
    marginBottom: 24,
    marginTop: -65,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: "500",
  },
  featuresGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: "#999999",
    textAlign: "center",
    lineHeight: 15,
  },
  premiumPricingCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  pricingHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  planNamePremium: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  pricingBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ef4444",
    letterSpacing: 0.5,
  },
  priceDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ef4444",
    marginRight: 4,
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 56,
    fontWeight: "900",
    color: "#000000",
    lineHeight: 64,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
    marginLeft: 8,
    marginTop: 12,
  },
  priceSubtext: {
    fontSize: 13,
    color: "#999999",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  pricingDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 18,
  },
  whatsIncluded: {
    width: "100%",
  },
  whatsIncludedTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666666",
    marginBottom: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  checkmarkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkmark: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "900",
    marginRight: 10,
    marginTop: -2,
  },
  checkmarkText: {
    fontSize: 13,
    color: "#333333",
    fontWeight: "500",
    flex: 1,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  errorText: {
    fontSize: 12,
    color: "#991b1b",
    textAlign: "center",
    fontWeight: "500",
  },
  ctaPremium: {
    width: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  ctaPremiumPressed: {
    backgroundColor: "#dc2626",
    shadowOpacity: 0.35,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaTextPremium: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
  ctaSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontWeight: "500",
  },
  restoreLink: {
    fontSize: 13,
    color: "#ef4444",
    marginBottom: 20,
    fontWeight: "600",
  },
  renewalNotice: {
    fontSize: 10,
    color: "#999999",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 12,
    paddingHorizontal: 8,
    fontWeight: "400",
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: {
    fontSize: 10,
    color: "#999999",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  legalDot: {
    fontSize: 10,
    color: "#999999",
  },
});
