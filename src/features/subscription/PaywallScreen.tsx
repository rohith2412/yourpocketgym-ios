import { useEffect, useState } from "react";
import { View, Pressable, Alert, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";
import { Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPremium as customerIsPremium,
} from "../../services/iapService";

/**
 * Geist-style palette: near-black ground, hairline borders, one solid action.
 *
 * Derived from the theme rather than hardcoded, so light mode inverts properly
 * instead of rendering white text on white. The hairlines stay as alpha over
 * the current foreground, which is what keeps them hairlines in both modes —
 * a fixed grey goes muddy in one of them.
 */
function usePalette() {
  const { theme } = useTheme();
  const c = theme.colors;
  const dark = theme.mode === "dark";
  const line = dark ? "255,255,255" : "0,0,0";
  return {
    BG: c.bg,
    SURFACE: c.surface,
    BORDER: `rgba(${line},0.14)`,
    BORDER_STRONG: `rgba(${line},0.32)`,
    FG: c.text,
    MUTED: c.textMuted,
    FAINT: c.textFaint,
    // The action is the inverse of the page, whichever way round that is.
    ON_ACTION: c.inverseText,
    ACTION: c.inverseBg,
  };
}
/** Small, consistent radius — the flat corners are half the aesthetic. */
const R = 8;

/** Temporarily hides the yearly option so only Monthly is offered.
 *  Flip back to true to restore it — the RevenueCat product and all the
 *  pricing logic below stay wired up either way. */
const SHOW_YEARLY = false;

const TERMS_URL = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

// A tile each, in a two-up grid. A checklist reads as fine print you skim; a
// grid of named capabilities reads as an inventory of what you're buying.
//
// This is every surface actually gated behind `isPremium` — meal plans, barcode
// scanning and water tracking were all shipped but missing from the pitch.
const FEATURES: { title: string; sub: string }[] = [
  { title: "Coach AI",        sub: "Chat with your trainer" },
  { title: "Photo scan",      sub: "Snap a meal to log it" },
  { title: "Voice logging",   sub: "Say meals and workouts" },
  { title: "Barcode scan",    sub: "Any packaged food" },
  { title: "Meal plans",      sub: "Built around your goal" },
  { title: "Recovery",        sub: "Sleep and readiness" },
  { title: "Water tracking",  sub: "Daily intake and goal" },
  { title: "Progress photos", sub: "Track how you look" },
  { title: "Cloud sync",      sub: "Backed up everywhere" },
];

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const { BG, SURFACE, BORDER, BORDER_STRONG, FG, MUTED, FAINT, ON_ACTION, ACTION } = usePalette();
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [yearlyPkg, setYearlyPkg] = useState<PurchasesPackage | null>(null);
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selected, setSelected] = useState<"yearly" | "monthly">(
    SHOW_YEARLY ? "yearly" : "monthly",
  );

  useEffect(() => {
    (async () => {
      try {
        const offering = await getOfferings();
        const pkgs = offering?.availablePackages ?? [];
        const monthly =
          offering?.monthly ??
          pkgs.find((p) => p.packageType === "MONTHLY") ??
          null;
        const yearly =
          offering?.annual ??
          pkgs.find((p) => p.packageType === "ANNUAL") ??
          null;
        setMonthlyPkg(monthly);
        setYearlyPkg(yearly);
      } catch (err) {
        console.warn("[Paywall] offerings failed:", err);
      } finally {
        setLoadingPkgs(false);
      }
    })();
  }, []);

  const yearlyPrice = yearlyPkg?.product.priceString ?? "$79.99";
  const monthlyPrice = monthlyPkg?.product.priceString ?? "$7.99";
  const yearlyRaw = yearlyPkg?.product.price ?? 79.99;
  const monthlyRaw = monthlyPkg?.product.price ?? 7.99;
  const monthEquiv = `$${(yearlyRaw / 12).toFixed(2)}`;
  const savePct = Math.round((1 - yearlyRaw / (monthlyRaw * 12)) * 100);
  const saveBadge = savePct > 0 ? `Save ${savePct}%` : undefined;

  const purchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const pkg =
      selected === "yearly"
        ? yearlyPkg ?? monthlyPkg
        : monthlyPkg ?? yearlyPkg;
    if (!pkg) {
      Alert.alert("Not available", "This plan isn't available right now. Try again in a moment.");
      return;
    }
    setBuying(true);
    try {
      const info = await purchasePackage(pkg);
      if (customerIsPremium(info)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.back();
      }
    } catch (err: any) {
      if (err?.userCancelled) return;
      Alert.alert("Purchase failed", err?.message ?? String(err));
    } finally {
      setBuying(false);
    }
  };

  const restore = async () => {
    try {
      const info = await restorePurchases();
      if (customerIsPremium(info)) {
        Alert.alert("Restored", "Your Pro subscription is active.");
        router.back();
      } else {
        Alert.alert("No purchases", "No active subscription found for this Apple ID.");
      }
    } catch (err: any) {
      Alert.alert("Restore failed", err?.message ?? String(err));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Close */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: R,
            borderWidth: 1,
            borderColor: BORDER,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? SURFACE : "transparent",
          })}
        >
          <Ionicons name="close" size={16} color={MUTED} />
        </Pressable>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.md,
          gap: theme.spacing.lg,
        }}
      >
        {/* Title */}
        <View style={{ paddingTop: theme.spacing.sm, gap: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 1.2,
              color: FAINT,
            }}
          >
            PRICING
          </Text>
          <Text
            style={{
              fontSize: 34,
              fontWeight: "700",
              color: FG,
              letterSpacing: -1.4,
              lineHeight: 38,
            }}
          >
            Premium
          </Text>
          <Text style={{ fontSize: 15, color: MUTED, lineHeight: 21 }}>
            Everything unlocked, one subscription.
          </Text>
        </View>

        {/* Features — two-up grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={{
                // Two per row; grow absorbs the odd pixel so the rows line up.
                flexBasis: "48%",
                flexGrow: 1,
                borderRadius: R,
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: SURFACE,
                padding: 14,
              }}
            >
              <View style={{ gap: 3 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: FG }}>{f.title}</Text>
                <Text style={{ fontSize: 12, color: MUTED, lineHeight: 16 }}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* With one plan there's nothing to choose, so we state the price
            instead of rendering a selector — a control with a single option is
            just a label that pretends to be interactive. Flip SHOW_YEARLY and
            the real selector comes back. */}
        {SHOW_YEARLY ? (
          <View style={{ gap: theme.spacing.sm }}>
            <PlanOption
              active={selected === "yearly"}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelected("yearly");
              }}
              title="Yearly"
              priceMain={`${yearlyPrice}/year`}
              priceSub={`${monthEquiv}/month`}
              badge={saveBadge}
            />
            <PlanOption
              active={selected === "monthly"}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelected("monthly");
              }}
              title="Monthly"
              priceMain={`${monthlyPrice}/month`}
            />
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 6,
              paddingVertical: theme.spacing.sm,
            }}
          >
            <Text style={{ fontSize: 34, fontWeight: "700", color: FG, letterSpacing: -1 }}>
              {monthlyPrice}
            </Text>
            <Text style={{ fontSize: 15, color: MUTED }}>/ month</Text>
          </View>
        )}

        {/* CTA */}
        <View style={{ gap: theme.spacing.sm }}>
          <Pressable
            onPress={purchase}
            disabled={buying || loadingPkgs}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: R,
              backgroundColor: ACTION,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: buying || loadingPkgs ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            {buying ? <ActivityIndicator color={ON_ACTION} size="small" /> : null}
            <Text style={{ color: ON_ACTION, fontWeight: "600", fontSize: 15 }}>
              {buying ? "Processing…" : loadingPkgs ? "Loading…" : "Continue"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Text style={{ fontSize: 12, color: FAINT }}>Cancel anytime</Text>
          </View>
        </View>

        {/* Footer links */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: -theme.spacing.xs }}>
          <Pressable onPress={restore}>
            <Text style={{ fontSize: 11, color: FAINT }}>
              Restore
            </Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: FAINT }}>
            ·
          </Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={{ fontSize: 11, color: MUTED, textDecorationLine: "underline" }}>
              Terms
            </Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: FAINT }}>
            ·
          </Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={{ fontSize: 11, color: MUTED, textDecorationLine: "underline" }}>
              Privacy
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Plan option ─────────────────────────────────────────────────────────────
function PlanOption({
  active,
  onPress,
  title,
  priceMain,
  priceSub,
  badge,
}: {
  active: boolean;
  onPress: () => void;
  title: string;
  priceMain: string;
  priceSub?: string;
  badge?: string;
}) {
  const { SURFACE, BORDER, BORDER_STRONG, FG, MUTED, ACTION, ON_ACTION } = usePalette();
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: R,
        borderWidth: 1,
        borderColor: active ? BORDER_STRONG : BORDER,
        backgroundColor: SURFACE,
        padding: theme.spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Radio */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1.5,
          borderColor: active ? BORDER_STRONG : BORDER,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {active ? (
          <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: FG }} />
        ) : null}
      </View>

      {/* Label + price */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: FG }}>{title}</Text>
          {badge ? (
            <View
              style={{
                backgroundColor: ACTION,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: ON_ACTION, fontSize: 10, fontWeight: "700" }}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {priceSub ? (
          <Text style={{ marginTop: 2, fontSize: 12, color: MUTED }}>
            {priceSub}
          </Text>
        ) : null}
      </View>

      {/* Right-side main price */}
      <Text style={{ fontSize: 15, fontWeight: "600", color: FG }}>{priceMain}</Text>
    </Pressable>
  );
}
