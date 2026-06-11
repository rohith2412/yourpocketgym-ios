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
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

// Set to false to bypass the paywall during development
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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <Line x1="10" y1="22" x2="14" y2="22" />
      <Line x1="9" y1="9" x2="15" y2="9" />
      <Line x1="12" y1="6" x2="12" y2="12" />
    </Svg>
  );
}

function RecipeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <Line x1="9" y1="7" x2="16" y2="7" />
      <Line x1="9" y1="11" x2="14" y2="11" />
    </Svg>
  );
}

function ScanIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

function ListIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <Line x1="9" y1="10" x2="15" y2="10" />
      <Line x1="9" y1="14" x2="15" y2="14" />
      <Line x1="9" y1="18" x2="13" y2="18" />
    </Svg>
  );
}

const FEATURES = [
  { icon: CoachIcon, title: "Unlimited AI Coach", desc: "Personal training guidance anytime" },
  { icon: RecipeIcon, title: "All Recipes & Meal Plans", desc: "Curated meals matched to your goals" },
  { icon: ScanIcon, title: "Macro Scanner", desc: "Snap a photo, get instant nutrition" },
  { icon: ListIcon, title: "Weekly Shopping Lists", desc: "Auto-generated from your meal plan" },
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
        <ActivityIndicator size="large" color="#000000" />
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
          <Text style={s.subtitle}>Unlock everything. Train smarter.</Text>

          {/* Features */}
          <View style={s.features}>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <f.icon />
                </View>
                <View style={s.featureInfo}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          <View style={s.planCard}>
            <Text style={s.planName}>Monthly</Text>
            <View style={s.planPriceBlock}>
              <Text style={s.planAmount}>$12.99</Text>
              <Text style={s.planPeriod}>per month</Text>
            </View>
            <Text style={s.planSubtext}>Billed monthly. Cancel anytime.</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              s.cta,
              pressed && s.ctaPressed,
              isLoading && s.ctaDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={s.ctaText}>Continue</Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable onPress={handleRestore} disabled={isLoading}>
            <Text style={[s.restore, isLoading && { opacity: 0.5 }]}>
              Restore purchase
            </Text>
          </Pressable>

          {/* Apple-required disclosure */}
          <Text style={s.renewalNotice}>
            Subscription auto-renews monthly unless cancelled at least 24 hours
            before the end of the current period. Payment is charged to your
            Apple ID account. Manage or cancel anytime in Settings {">"} Apple ID {">"} Subscriptions.
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
    backgroundColor: "#ffffff",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  features: {
    width: "100%",
    gap: 20,
    marginBottom: 36,
    paddingHorizontal: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: "#8e8e93",
    lineHeight: 18,
  },
  planCard: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    marginBottom: 24,
  },
  planName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  planPriceBlock: {
    alignItems: "center",
    marginBottom: 10,
  },
  planAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    lineHeight: 32,
  },
  planPeriod: {
    fontSize: 12,
    color: "#8e8e93",
    fontWeight: "500",
    marginTop: 4,
  },
  planSubtext: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 16,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  errorText: {
    fontSize: 12,
    color: "#991b1b",
    textAlign: "center",
  },
  cta: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaPressed: {
    backgroundColor: "#333333",
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
  restore: {
    fontSize: 13,
    color: "#8e8e93",
    marginBottom: 16,
  },
  renewalNotice: {
    fontSize: 10,
    color: "#c7c7cc",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: {
    fontSize: 10,
    color: "#8e8e93",
    textDecorationLine: "underline",
  },
  legalDot: {
    fontSize: 10,
    color: "#8e8e93",
  },
});
