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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";

const TERMS_URL   = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";
const PAYWALL_ENABLED = true;

const BRAND = "#e8380d";

interface PremiumGateProps {
  isUserPremium: boolean;
  subChecking?: boolean;
  children: React.ReactNode;
  featureName?: string;
  onPurchaseSuccess?: () => void | Promise<void>;
}

const LOGO = require("@/assets/images/logo.png");

export default function PremiumGate({
  isUserPremium,
  subChecking = false,
  children,
  featureName = "Feature",
  onPurchaseSuccess,
}: PremiumGateProps) {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string>("");
  const { isLoading, error, purchaseMonthlySubscription, restorePurchases } =
    usePurchase();

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
    <View style={[s.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }]}>

      {/* Close button area */}
      <View style={s.topBar}>
        <View style={{ width: 28 }} />
      </View>

      {/* Logo */}
      <View style={s.logoWrap}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
      </View>

      {/* Title */}
      <Text style={s.title}>Get PocketGym Pro</Text>
      <Text style={s.subtitle}>
        Unlock AI coaching, macro tracking{"\n"}and personalized meal plans.
      </Text>

      {/* Badge */}
      <View style={s.badgeRow}>
        <Text style={s.badgeLeaf}>🌿</Text>
        <View style={s.badgeTextWrap}>
          <Text style={s.badgeTop}>Featured on</Text>
          <Text style={s.badgeMain}>App Store</Text>
          <Text style={s.badgeBottom}>Health & Fitness</Text>
        </View>
        <Text style={s.badgeLeaf}>🌿</Text>
      </View>

      {/* Review card */}
      <View style={s.reviewCard}>
        <Text style={s.reviewTitle}>Your AI fitness companion</Text>
        <Text style={s.reviewStars}>★★★★★</Text>
        <Text style={s.reviewBody}>
          Finally an app that actually tracks my workouts and gives me real coaching. The AI trainer is like having a personal trainer in my pocket!
        </Text>
        <Text style={s.reviewAuthor}>FitnessFan2026</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Pricing */}
      <View style={s.pricingRow}>
        <View style={[s.priceBox, s.priceBoxSelected]}>
          <Text style={[s.priceNumber, s.priceNumberSelected]}>1</Text>
          <Text style={[s.priceLabel, s.priceLabelSelected]}>MONTH</Text>
          <Text style={[s.priceAmount, s.priceAmountSelected]}>$12.99</Text>
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
          <Text style={s.ctaText}>Continue</Text>
        )}
      </Pressable>

      {/* Footer */}
      <View style={s.footerRow}>
        <Pressable onPress={handleRestore} disabled={isLoading}>
          <Text style={s.footerLink}>Restore Purchases</Text>
        </Pressable>
        <Text style={s.footerLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
        <Text style={s.footerLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy</Text>
      </View>
    </View>
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

  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 72,
    height: 72,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  badgeLeaf: {
    fontSize: 16,
  },
  badgeTextWrap: {
    alignItems: "center",
  },
  badgeTop: {
    fontSize: 10,
    color: "#aaaaaa",
    fontWeight: "500",
    fontStyle: "italic",
  },
  badgeMain: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },
  badgeBottom: {
    fontSize: 10,
    color: "#aaaaaa",
    fontWeight: "500",
    fontStyle: "italic",
  },

  reviewCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  reviewStars: {
    fontSize: 14,
    color: "#f59e0b",
    marginBottom: 8,
    letterSpacing: 2,
  },
  reviewBody: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 19,
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 12,
    color: "#aaaaaa",
    fontWeight: "500",
  },

  pricingRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  priceBox: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    paddingVertical: 16,
    alignItems: "center",
  },
  priceBoxSelected: {
    borderColor: BRAND,
    backgroundColor: "#fff5f3",
  },
  priceNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  priceNumberSelected: {
    color: BRAND,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999999",
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceLabelSelected: {
    color: BRAND,
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  priceAmountSelected: {
    color: BRAND,
  },

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

  cta: {
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  ctaPressed: {
    backgroundColor: "#c02e0a",
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  footerLink: {
    fontSize: 12,
    color: "#bbbbbb",
    fontWeight: "500",
  },
});
