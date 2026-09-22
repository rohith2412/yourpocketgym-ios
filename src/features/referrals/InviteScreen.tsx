import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  Share,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Screen, Text } from "../../ui";
import { shareLinkFor } from "./api";
import { useRedeemCode, useReferralStatus } from "./hooks";

/**
 * Invite Friends page.
 *
 * Sections animate in with a short stagger on mount so the page feels
 * alive instead of dumping every element at once. The hero has a slow
 * pulsing diamond and a shimmer sweep across the code — costless
 * pieces of motion that make an otherwise-static list feel warm.
 */
export function InviteScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const { data, isLoading, error, refetch } = useReferralStatus();

  const code = data?.code ?? "····";
  const link = data ? shareLinkFor(data.code) : "";
  const goal = data?.goal ?? 2;
  const balance = data?.balance ?? 0;
  const adsFree = !!data?.adsFree;
  const daysRemaining = data?.daysRemaining ?? 0;
  const pending = data?.pending ?? 0;

  /**
   * One-tap copy via `expo-clipboard` when the native module is linked;
   * silent fallback to the iOS share sheet when it isn't (dev builds
   * from before the module was installed). The try/catch means the
   * missing native module never bubbles up as a red-screen error.
   */
  const copy = async (value: string, label: string) => {
    try {
      // Load lazily so an unlinked native module doesn't crash the whole
      // screen at import time — only at the moment the user actually taps.
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(value);
      Alert.alert(`${label} copied`, value);
    } catch {
      try {
        await Share.share({ message: value });
      } catch {}
    }
  };
  const copyCode = () => data && copy(data.code, "Code");
  const copyLink = () => link && copy(link, "Link");
  const share = async () => {
    if (!data) return;
    try {
      await Share.share({
        message: `I'm using PocketGym — a free AI food scanner. Snap your plate, get calories instantly. Use my code ${data.code} when you sign up: ${link}`,
      });
    } catch {}
  };

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: 120, gap: theme.spacing.lg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textMuted">
            Invite friends
          </Text>
          <Text variant="title">Go Pro for free</Text>
        </View>
      </View>

      {/* Hero — gradient, animated diamond, slot chips instead of a plain bar */}
      <SlideIn delay={0}>
        <LinearGradient
          colors={["#190A05", "#870000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 22,
            gap: 20,
            shadowColor: "#870000",
            shadowOpacity: 0.35,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <PulsingDiamond />
            <View style={{ flex: 1 }}>
              <Text
                variant="body"
                weight="bold"
                style={{ color: "#fff", fontSize: 18 }}
              >
                {adsFree ? "You're ad-free" : "Unlock 1 month ad-free"}
              </Text>
              <Text
                variant="caption"
                style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}
              >
                {adsFree
                  ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left · invite more to extend`
                  : `Invite ${goal} friends to remove every ad`}
              </Text>
            </View>
          </View>

          {/* Slot chips — one per required friend. Filled = credited,
              amber-outline = pending, hollow = empty. Way more emotional
              than a percentage bar. */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {Array.from({ length: goal }).map((_, i) => (
              <SlotChip
                key={i}
                state={
                  i < balance ? "filled" : i < balance + pending ? "pending" : "empty"
                }
                index={i}
              />
            ))}
          </View>
        </LinearGradient>
      </SlideIn>

      {/* Code — big tile with shimmer sweep */}
      <SlideIn delay={80}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            YOUR CODE
          </Text>
          <Pressable
            onPress={() => (error ? refetch() : copyCode())}
            style={({ pressed }) => ({
              opacity: pressed ? 0.75 : 1,
              backgroundColor: c.surface,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: c.border,
              padding: 20,
              alignItems: "center",
              gap: 6,
              overflow: "hidden",
            })}
          >
            {/* Shimmer runs diagonally across the tile every ~4s */}
            <Shimmer />
            <Text
              variant="title"
              style={{
                color: c.text,
                fontSize: 36,
                letterSpacing: 8,
                fontVariant: ["tabular-nums"],
              }}
            >
              {isLoading ? "····" : code}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons
                name={error ? "warning-outline" : isLoading ? "hourglass-outline" : "share-outline"}
                size={12}
                color={c.textMuted}
              />
              <Text
                variant="caption"
                color="textMuted"
                style={{ fontSize: 11, maxWidth: 260, textAlign: "center" }}
                numberOfLines={2}
              >
                {error
                  ? `Load failed: ${(error as Error)?.message ?? "unknown"} — tap`
                  : isLoading
                  ? "Loading…"
                  : "Tap to share or copy"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={copyLink}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.md,
              paddingHorizontal: 14,
              height: 44,
              gap: 8,
            })}
          >
            <Ionicons name="link" size={16} color={c.textMuted} />
            <Text
              variant="caption"
              color="textMuted"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 12 }}
            >
              {link || "yourpocketgym.com/i/……"}
            </Text>
            <Ionicons name="copy-outline" size={16} color={c.textMuted} />
          </Pressable>
        </View>
      </SlideIn>

      {/* Primary CTA — gradient to tie back to the hero */}
      <SlideIn delay={140}>
        <Pressable
          onPress={share}
          disabled={!data}
          style={({ pressed }) => ({
            opacity: !data ? 0.4 : pressed ? 0.9 : 1,
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#870000",
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          })}
        >
          <LinearGradient
            colors={["#190A05", "#870000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 56,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text variant="body" weight="bold" style={{ color: "#fff", fontSize: 16 }}>
              Share invite
            </Text>
          </LinearGradient>
        </Pressable>
      </SlideIn>

      {/* How it works */}
      <SlideIn delay={200}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="textMuted">
            HOW IT WORKS
          </Text>
          <Step
            n={1}
            color="#f97316"
            title="Send your code"
            body="Share the link or your 4-character code with 2 friends."
          />
          <Step
            n={2}
            color="#8b5cf6"
            title="They sign up & log a meal"
            body="Their meal has to be a real one — 1 logged meal within a few days."
          />
          <Step
            n={3}
            color="#10b981"
            title="You get 30 days ad-free"
            body="Every 2 friends who join = another month. Extensions stack."
          />
        </View>
      </SlideIn>

      {/* Redeem — the flip side: entering SOMEONE ELSE'S code */}
      <SlideIn delay={260}>
        <RedeemBlock />
      </SlideIn>

      {/* Live status */}
      {data ? (
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            alignItems: "center",
            paddingVertical: 8,
          })}
        >
          <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
            {data.pending} pending · {data.monthsGranted} month
            {data.monthsGranted === 1 ? "" : "s"} earned · tap to refresh
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

/**
 * "Have a friend's code?" input.
 *
 * A user can redeem exactly one code, ever — the backend enforces this
 * with a unique index on `refereeId`. Once redeemed, we swap the input
 * for a thank-you row so the section still tells a story instead of
 * disappearing entirely.
 */
function RedeemBlock() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [code, setCode] = useState("");
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const redeem = useRedeemCode();

  const submit = () => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      Alert.alert("Enter your friend's code.");
      return;
    }
    redeem.mutate(clean, {
      onSuccess: () => {
        setRedeemedCode(clean);
        setCode("");
        Alert.alert(
          "Code accepted",
          "Your friend gets a credit once you've logged a meal or two — takes a few days.",
        );
      },
      onError: (err: any) => {
        const msg = err?.message ?? "Please try again.";
        Alert.alert("Couldn't redeem", msg);
      },
    });
  };

  if (redeemedCode) {
    return (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="textMuted">
          FRIEND'S CODE
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: c.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: c.border,
            padding: 14,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: c.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark" size={18} color={c.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold" style={{ fontSize: 14 }}>
              You used code {redeemedCode}
            </Text>
            <Text variant="caption" color="textMuted" style={{ fontSize: 12 }}>
              Log a meal or two so your friend earns their credit.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label" color="textMuted">
        HAVE A FRIEND'S CODE?
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: c.border,
            paddingHorizontal: 14,
            height: 52,
          }}
        >
          <TextInput
            value={code}
            onChangeText={(t) =>
              // Normalize to the same alphabet the backend uses — strip
              // spaces, hyphens, ambiguous chars — so users can paste
              // "ABC-D 34" without a false-negative.
              setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
            }
            placeholder="e.g. K7XP"
            placeholderTextColor={c.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="done"
            onSubmitEditing={submit}
            style={{
              flex: 1,
              color: c.text,
              fontSize: 20,
              fontWeight: "700",
              letterSpacing: 4,
              fontVariant: ["tabular-nums"],
            }}
            maxLength={8}
          />
        </View>
        <Pressable
          onPress={submit}
          disabled={redeem.isPending || code.trim().length < 4}
          style={({ pressed }) => ({
            opacity:
              redeem.isPending || code.trim().length < 4
                ? 0.4
                : pressed
                ? 0.85
                : 1,
            height: 52,
            paddingHorizontal: 18,
            borderRadius: theme.radius.md,
            backgroundColor: c.text,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text variant="body" weight="bold" style={{ color: c.bg, fontSize: 14 }}>
            {redeem.isPending ? "…" : "Redeem"}
          </Text>
        </Pressable>
      </View>
      <Text variant="caption" color="textFaint" style={{ fontSize: 11 }}>
        Enter your friend's code to give them credit. You can only redeem once.
      </Text>
    </View>
  );
}

// ─── Motion helpers ─────────────────────────────────────────────────────

/** Fade + slide-up on mount; stack these with different delays for stagger. */
function SlideIn({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, y]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY: y }] }}>
      {children}
    </Animated.View>
  );
}

/** Slow breathing scale — signals liveness without being distracting. */
function PulsingDiamond() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <Animated.View
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.14)",
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
      }}
    >
      <Ionicons name="diamond" size={22} color="#fff" />
    </Animated.View>
  );
}

/** Diagonal light sweep across the code tile every ~4s. */
function Shimmer() {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  const translateX = x.interpolate({
    inputRange: [-1, 1],
    outputRange: [-260, 260],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 120,
        transform: [{ translateX }, { rotate: "20deg" }],
      }}
    >
      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.10)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

/** Slot circles in the hero — represent each required friend visually. */
function SlotChip({
  state,
  index,
}: {
  state: "empty" | "pending" | "filled";
  index: number;
}) {
  // Filled slots get a subtle grow-in on mount so a fresh credit *feels*
  // like something happened. Uses index * 100 so the second slot pops in
  // just after the first.
  const scale = useRef(new Animated.Value(state === "filled" ? 0 : 1)).current;
  useEffect(() => {
    if (state === "filled") {
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }
  }, [state, scale, index]);

  const bg =
    state === "filled"
      ? "#ffffff"
      : state === "pending"
      ? "rgba(255,255,255,0.12)"
      : "rgba(255,255,255,0.06)";
  const border =
    state === "filled"
      ? "#ffffff"
      : state === "pending"
      ? "rgba(255,193,7,0.9)"
      : "rgba(255,255,255,0.25)";
  const fg =
    state === "filled" ? "#870000" : state === "pending" ? "#ffc107" : "rgba(255,255,255,0.55)";

  return (
    <Animated.View
      style={{
        flex: 1,
        height: 56,
        borderRadius: 14,
        backgroundColor: bg,
        borderWidth: state === "pending" ? 1.5 : 1,
        borderColor: border,
        borderStyle: state === "empty" ? "dashed" : "solid",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        transform: [{ scale }],
      }}
    >
      <Ionicons
        name={state === "filled" ? "checkmark" : state === "pending" ? "hourglass-outline" : "person-add-outline"}
        size={18}
        color={fg}
      />
      <Text
        variant="caption"
        weight="semibold"
        style={{ color: fg, fontSize: 10, letterSpacing: 0.5 }}
      >
        {state === "filled" ? "JOINED" : state === "pending" ? "PENDING" : "OPEN"}
      </Text>
    </Animated.View>
  );
}

function Step({
  n,
  color,
  title,
  body,
}: {
  n: number;
  color: string;
  title: string;
  body: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 14,
        backgroundColor: c.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        padding: 14,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text variant="caption" weight="bold" style={{ fontSize: 13, color: "#fff" }}>
          {n}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="semibold" style={{ fontSize: 14 }}>
          {title}
        </Text>
        <Text variant="caption" color="textMuted" style={{ fontSize: 12, lineHeight: 16 }}>
          {body}
        </Text>
      </View>
    </View>
  );
}
