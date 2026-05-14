import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

// Set to false to bypass the paywall during development
const PAYWALL_ENABLED = true;

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;   // while true → don't show paywall (status still resolving)
  children: React.ReactNode;
  featureName?: string;
}

const DOCK_RESERVED = 110;
const LOGO = require("@/assets/images/logo.png");

// Pre-warm the image asset so it's in memory before the component mounts
Image.prefetch(Image.resolveAssetSource(LOGO).uri).catch(() => {});

export default function PremiumGate({
  isUserPremium,
  subChecking = false,
  children,
  featureName = "Feature",
}: PremiumGateProps) {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = React.useState<string>("");
  const [logoReady, setLogoReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

  // Only start the fade once the logo has fired onLoad
  useEffect(() => {
    if (!logoReady) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
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

  // Paywall disabled (dev mode) or confirmed premium — show content
  if (!PAYWALL_ENABLED || isUserPremium) {
    return <>{children}</>;
  }

  // Still checking subscription — show a neutral loader so no inner modals/intros fire
  if (subChecking) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color="#e8380d" />
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
      Alert.alert("Welcome to Premium", "Your subscription is now active. Refresh to continue.");
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
      Alert.alert("Restored", "Your purchases have been restored. Refresh to continue.");
    } else {
      Alert.alert("No Purchases Found", "You don't have any previous purchases to restore.");
    }
  };

  return (
    <View style={s.root} pointerEvents="box-none">
      {/* Never mount children when paywall is active — prevents inner modals
          (MealPlanView onboarding, ProfileIntro, etc.) from firing */}

      <Animated.View
        style={[
          s.overlay,
          {
            opacity: fadeAnim,
            paddingTop: insets.top,
            paddingBottom: DOCK_RESERVED + insets.bottom,
          },
        ]}
      >
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={s.scrim} />

        <View style={s.cardWrap}>
          <View style={s.card}>

            {/* White header band */}
            <View style={s.cardBand}>
              <View style={s.bandLeft}>
                <Image
                  source={LOGO}
                  style={s.logo}
                  resizeMode="contain"
                  fadeDuration={0}
                  onLoad={() => setLogoReady(true)}
                  // Safety net: if onLoad never fires, fade in anyway after 400ms
                  onError={() => setLogoReady(true)}
                />
                <View>
                  <Text style={s.eyebrow}>POCKETGYM PREMIUM</Text>
                  <Text style={s.bandTitle}>Monthly</Text>
                </View>
              </View>
              <View style={s.priceBadge}>
                <Text style={s.priceAmount}>$12.99</Text>
                <Text style={s.pricePer}>/mo</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Body */}
            <View style={s.body}>
              <Text style={s.subtitle}>
                Everything you need to train, eat, and recover smarter.
              </Text>

              <View style={s.features}>
                <Feature text="Unlimited AI Training Coach" />
                <Feature text="Unlimited Recipes" />
                <Feature text="Unlimited Macro Scanner" />
                <Feature text="Unlimited AI Chat Bots" />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

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
                  <View style={s.ctaInner}>
                    <Text style={s.ctaText}>Continue</Text>
                    <View style={s.ctaPricePill}>
                      <Text style={s.ctaPriceText}>$12.99 / mo</Text>
                    </View>
                  </View>
                )}
              </Pressable>

              <Pressable onPress={handleRestore} disabled={isLoading}>
                <Text style={[s.restore, isLoading && { opacity: 0.5 }]}>
                  Restore purchase
                </Text>
              </Pressable>

              {/* Apple-required subscription disclosure */}
              <Text style={s.renewalNotice}>
                PocketGym Premium · $12.99 / month (auto-renews){"\n"}
                Subscription auto-renews monthly unless cancelled at least 24 hours before the end of the current period. Payment is charged to your Apple ID account. You can manage or cancel your subscription at any time in your App Store account settings.
              </Text>

              <View style={s.legalRow}>
                <Text
                  style={s.legalLink}
                  onPress={() => Linking.openURL(TERMS_URL)}
                >
                  Terms of Use
                </Text>
                <Text style={s.legalDot}> · </Text>
                <Text
                  style={s.legalLink}
                  onPress={() => Linking.openURL(PRIVACY_URL)}
                >
                  Privacy Policy
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={s.featureRow}>
      <View style={s.checkCircle}>
        <Text style={s.checkMark}>✓</Text>
      </View>
      <Text style={s.featureText}>{text}</Text>
    </View>
  );
}

const ORANGE = "#e8380d";
const ORANGE_DARK = "#c42e09";
const INK = "#1a1a1a";
const MUTED = "#6b6b6b";
const HAIRLINE = "#e8e6e1";
const ORANGE_TINT = "#fff3f0";

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fafaf8",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrap: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: HAIRLINE,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
  cardBand: {
    backgroundColor: "#ffffff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 2,
    marginBottom: 2,
  },
  bandTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.5,
  },
  priceBadge: {
    backgroundColor: ORANGE_TINT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fdd5cc",
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: ORANGE,
    lineHeight: 24,
  },
  pricePer: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: HAIRLINE,
    marginHorizontal: 20,
  },
  body: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 19,
  },
  features: {
    width: "100%",
    gap: 10,
    marginBottom: 22,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ORANGE_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 11,
    color: ORANGE_DARK,
    fontWeight: "700",
    lineHeight: 14,
  },
  featureText: {
    fontSize: 13,
    color: INK,
    fontWeight: "500",
    flex: 1,
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
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 14,
  },
  ctaPressed: {
    backgroundColor: ORANGE_DARK,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  ctaPricePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: "absolute",
    right: 0,
  },
  ctaPriceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  restore: {
    fontSize: 13,
    color: MUTED,
    textDecorationLine: "underline",
    marginBottom: 12,
  },
  renewalNotice: {
    fontSize: 10,
    color: MUTED,
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legalLink: {
    fontSize: 11,
    color: "#4a90d9",
    textDecorationLine: "underline",
  },
  legalDot: {
    fontSize: 11,
    color: MUTED,
  },
});