import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePurchase } from "@/src/hooks/usePurchase";
import Svg, { Path, Circle, Rect, Line, G } from "react-native-svg";

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

// Feature icons
function InfinityIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" stroke="#1a1a1a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SparkleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" stroke="#1a1a1a" strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function ChartIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="12" width="4" height="9" rx="1" stroke="#1a1a1a" strokeWidth={1.8} />
      <Rect x="10" y="7" width="4" height="14" rx="1" stroke="#1a1a1a" strokeWidth={1.8} />
      <Rect x="17" y="3" width="4" height="18" rx="1" stroke="#1a1a1a" strokeWidth={1.8} />
    </Svg>
  );
}

function BrainIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" stroke="#1a1a1a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="21" x2="15" y2="21" stroke="#1a1a1a" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="10" y1="24" x2="14" y2="24" stroke="#1a1a1a" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircle() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#1a1a1a" />
      <Path d="M8 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const FEATURES = [
  { icon: InfinityIcon, title: "Unlimited AI Coach", desc: "Train smarter with AI guidance" },
  { icon: SparkleIcon, title: "Macro Scanner", desc: "Snap photos for instant nutrition" },
  { icon: ChartIcon, title: "Full Tracking", desc: "Track every rep and meal" },
  { icon: BrainIcon, title: "Smart Meal Plans", desc: "Personalized to your goals" },
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
        <ActivityIndicator size="large" color="#1a1a1a" />
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

      {/* Header */}
      <View style={s.header}>
        <Text style={s.titleLine}>Unlock your</Text>
        <View style={s.titleRow}>
          <Image source={LOGO} style={s.logoInline} resizeMode="contain" />
          <Text style={s.title}> PocketGym</Text>
          <Text style={s.titleSuper}></Text>
        </View>
        <Text style={s.titleLine}>fitness superpowers</Text>
      </View>

      {/* Feature list */}
      <View style={s.featureCard}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[s.featureRow, i < FEATURES.length - 1 && s.featureRowBorder]}>
            <View style={s.featureLeft}>
              <f.icon />
              <View style={s.featureText}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
            <CheckCircle />
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={s.pricingCard}>
        <View style={s.priceOption}>
          <Text style={s.priceOptionLabel}>Monthly</Text>
          <Text style={s.priceOptionAmount}>$12.99</Text>
          <Text style={s.priceOptionSub}>$12.99 per month</Text>
        </View>
      </View>

      {/* Billing info */}
      <Text style={s.billingMain}>$12.99 per month.</Text>
      <Text style={s.billingDisclosure}>
        Auto-renews unless canceled at least 24 hours before renewal. Cancel anytime in App Store settings.
      </Text>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

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
          <Text style={s.ctaText}>Get premium</Text>
        )}
      </Pressable>

      {/* Footer */}
      <View style={s.footerRow}>
        <Text style={s.footerLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms of service</Text>
        <Text style={s.footerLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy policy</Text>
        <Pressable onPress={handleRestore} disabled={isLoading}>
          <Text style={s.footerLink}>Restore purchase</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fafaf8",
    paddingHorizontal: 20,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fafaf8",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Header */
  header: {
    marginBottom: 24,
  },
  titleLine: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoInline: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  titleSuper: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: -8,
  },

  /* Feature list */
  featureCard: {
    backgroundColor: "#f0ede8",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  featureLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "400",
  },

  /* Pricing */
  pricingCard: {
    backgroundColor: "#f0ede8",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  priceOption: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "#1a1a1a",
  },
  priceOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  priceOptionAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  priceOptionSub: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "400",
  },

  /* Billing */
  billingMain: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 4,
  },
  billingDisclosure: {
    fontSize: 12,
    color: "#aaaaaa",
    textAlign: "center",
    lineHeight: 17,
    fontStyle: "italic",
    paddingHorizontal: 12,
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
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
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
    fontStyle: "italic",
  },

  /* Footer */
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  footerLink: {
    fontSize: 12,
    color: "#bbbbbb",
    fontWeight: "400",
  },
});
