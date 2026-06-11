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
  Easing,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";
const PAYWALL_ENABLED = true;
const BRAND = "#e8380d";
const { width: SCREEN_W } = Dimensions.get("window");

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;
  children: React.ReactNode;
  featureName?: string;
  onPurchaseSuccess?: () => void | Promise<void>;
}

const LOGO = require("@/assets/images/logo.png");
const LAUREL_LEFT  = require("@/assets/images/laurel-left.webp");
const LAUREL_RIGHT = require("@/assets/images/laurel-right.webp");

const REVIEWS = [
  { title: "Life changing app", body: "The AI trainer actually understands my goals. Lost 12 lbs in 2 months just following the plans!", author: "Mike R.", stars: 5 },
  { title: "Your AI fitness companion", body: "Finally an app that tracks my workouts and gives real coaching. Like a personal trainer in my pocket!", author: "Sarah K.", stars: 5 },
  { title: "Worth every penny", body: "Macro scanner alone saves me 20 min a day. The workout plans are perfectly tailored to my home gym.", author: "Alex T.", stars: 5 },
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
  const [reviewIdx, setReviewIdx] = useState(0);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const reviewFade = useRef(new Animated.Value(1)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  // Auto-rotate reviews
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(reviewFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setReviewIdx(i => (i + 1) % REVIEWS.length);
        Animated.timing(reviewFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Subtle CTA pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaScale, { toValue: 1.02, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(ctaScale, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
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

  const review = REVIEWS[reviewIdx];

  return (
    <Animated.View style={[s.root, { opacity: fadeIn, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 }]}>

      {/* Logo + Title inline */}
      <Animated.View style={[s.titleRow, { transform: [{ scale: logoScale }] }]}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Get PocketGym Pro</Text>
      </Animated.View>
      <Text style={s.subtitle}>
        Unlock AI coaching, macro tracking{"\n"}and personalized meal plans.
      </Text>

      {/* Badge */}
      <View style={s.badgeRow}>
        <Image source={LAUREL_LEFT} style={s.laurelImg} resizeMode="contain" />
        <View style={s.badgeTextWrap}>
          <Text style={s.badgeTop}>Available on the</Text>
          <Text style={s.badgeMain}>App Store</Text>
          <Text style={s.badgeBottom}>Health & Fitness</Text>
        </View>
        <Image source={LAUREL_RIGHT} style={s.laurelImg} resizeMode="contain" />
      </View>

      {/* Review card — auto-rotating */}
      <Animated.View style={[s.reviewCard, { opacity: reviewFade }]}>
        <Text style={s.reviewTitle}>{review.title}</Text>
        <Text style={s.reviewStars}>{"★".repeat(review.stars)}</Text>
        <Text style={s.reviewBody}>{review.body}</Text>
        <Text style={s.reviewAuthor}>{review.author}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={s.dotsRow}>
        {REVIEWS.map((_, i) => (
          <View key={i} style={[s.dot, i === reviewIdx && s.dotActive]} />
        ))}
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Pricing — full width, aligned with CTA */}
      <View style={s.priceBox}>
        <Text style={s.priceNumber}>1</Text>
        <Text style={s.priceLabel}>MONTH</Text>
        <Text style={s.priceAmount}>$12.99</Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* CTA with subtle pulse */}
      <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
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
      </Animated.View>

      {/* Footer */}
      <View style={s.footerRow}>
        <Pressable onPress={handleRestore} disabled={isLoading}>
          <Text style={s.footerLink}>Restore Purchases</Text>
        </Pressable>
        <Text style={s.footerLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
        <Text style={s.footerLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },

  /* Badge */
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  laurelImg: {
    width: 28,
    height: 44,
  },
  badgeTextWrap: {
    alignItems: "center",
  },
  badgeTop: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "500",
    fontStyle: "italic",
  },
  badgeMain: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },
  badgeBottom: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "500",
    fontStyle: "italic",
  },

  /* Review */
  reviewCard: {
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    minHeight: 140,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  reviewStars: {
    fontSize: 14,
    color: "#f59e0b",
    marginBottom: 10,
    letterSpacing: 2,
  },
  reviewBody: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewAuthor: {
    fontSize: 12,
    color: "#bbbbbb",
    fontWeight: "600",
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
  },
  dotActive: {
    backgroundColor: BRAND,
    width: 18,
    borderRadius: 3,
  },

  /* Pricing */
  priceBox: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BRAND,
    alignItems: "center",
    backgroundColor: "#fff5f3",
    marginBottom: 14,
  },
  priceNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: BRAND,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND,
    letterSpacing: 1,
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND,
  },

  /* Error */
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

  /* CTA */
  cta: {
    backgroundColor: "#f06040",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#f06040",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  ctaPressed: {
    backgroundColor: "#e04e30",
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },

  /* Footer */
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  footerLink: {
    fontSize: 12,
    color: "#cccccc",
    fontWeight: "500",
  },
});
