import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthGuard } from "../features/auth/useAuthGuard";
import { trackScreen } from "../features/analytics/track";
import { NutritionScreen } from "../features/nutrition/NutritionScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { useEntitlement } from "../features/subscription/useEntitlement";
import { TrainScreen } from "../features/train/TrainScreen";
import { useTheme } from "../theme/ThemeProvider";
import { Text } from "../ui";
import { TabNavCtx, type TabNav } from "./tabNav";

/**
 * Pure-JS tab navigator styled to feel native.
 *
 * Why not `react-native-bottom-tabs`:
 *   That library wraps UITabBarController, which on iPadOS 27+ in
 *   iPhone-compatibility mode hands each child view controller a
 *   mid-transition 0-height frame; only the default-focused tab renders,
 *   everything else stays blank. Apple's App Review captured this on the
 *   2.3.1 rejection. A JS tab bar can't reproduce that bug because there
 *   is no native tab controller involved.
 *
 * Look:
 *   - Floating pill with BlurView, inset from the edges. Matches the
 *     iOS 26 Liquid Glass tab bar visually without depending on it.
 *   - Active tab wears a subtle inverse-bg pill so the current selection
 *     reads immediately, the way SF Symbols do inside a native bar.
 *   - Icon + tiny label, so muscle memory transfers from any native app.
 *
 * Layout:
 *   All four scenes stay mounted and toggle visibility with `display`.
 *   Keeps scroll position and query cache between switches, and guarantees
 *   each scene gets a real frame at first paint.
 */

type TabKey = "nutrition" | "train" | "progress" | "profile";

type TabDef = {
  key: TabKey;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconFilled: React.ComponentProps<typeof Ionicons>["name"];
  Component: React.ComponentType;
};

const NUTRITION: TabDef = {
  key: "nutrition",
  title: "Nutrition",
  icon: "restaurant-outline",
  iconFilled: "restaurant",
  Component: NutritionScreen,
};
const TRAIN: TabDef = {
  key: "train",
  title: "Train",
  icon: "barbell-outline",
  iconFilled: "barbell",
  Component: TrainScreen,
};
const PROGRESS: TabDef = {
  key: "progress",
  title: "Progress",
  icon: "trending-up-outline",
  iconFilled: "trending-up",
  Component: ProgressScreen,
};
const PROFILE_FREE: TabDef = {
  key: "profile",
  title: "Profile",
  icon: "person-outline",
  iconFilled: "person",
  Component: ProfileScreen,
};
const PROFILE_PRO: TabDef = {
  key: "profile",
  title: "More",
  icon: "ellipsis-horizontal",
  iconFilled: "ellipsis-horizontal",
  Component: ProfileScreen,
};

function tabsForPlan(plan: "free" | "premium"): TabDef[] {
  return plan === "premium"
    ? [NUTRITION, TRAIN, PROGRESS, PROFILE_PRO]
    : [NUTRITION, TRAIN, PROGRESS, PROFILE_FREE];
}

// Height of the floating pill itself. `bottomPad` below adds the
// safe-area breathing room. Scenes that don't want to slide under
// the bar can query `useTabBarChrome()` for these numbers.
const PILL_HEIGHT = 60;
const PILL_HORIZONTAL_MARGIN = 16;
const PILL_BOTTOM_MARGIN = 6;

export function useTabBarChrome() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  return {
    pillHeight: PILL_HEIGHT,
    // Total vertical space the bar occupies from the screen bottom.
    reserved: PILL_HEIGHT + PILL_BOTTOM_MARGIN + bottomPad,
  };
}

export default function AppTabsLayout() {
  const { theme } = useTheme();
  const c = theme.colors;
  const isDark = theme.mode === "dark";
  const insets = useSafeAreaInsets();
  const { plan } = useEntitlement();
  const [index, setIndex] = useState(0);
  useAuthGuard();

  const tabs = useMemo(() => tabsForPlan(plan), [plan]);
  const safeIndex = Math.min(index, tabs.length - 1);

  useEffect(() => {
    trackScreen(`tabs/${tabs[safeIndex]?.key ?? "unknown"}`);
  }, [safeIndex, tabs]);

  const nav = useMemo<TabNav>(
    () => ({
      goTo: (key) => {
        const i = tabs.findIndex((t) => t.key === key);
        if (i >= 0) setIndex(i);
      },
      goToProfile: () => {
        const i = tabs.findIndex((t) => t.key === "profile");
        if (i >= 0) setIndex(i);
      },
    }),
    [tabs],
  );

  const onTabPress = (i: number) => {
    if (i === safeIndex) return;
    Haptics.selectionAsync().catch(() => {});
    setIndex(i);
  };

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <TabNavCtx.Provider value={nav}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {/* Scenes -- all mounted, only the active one visible. */}
        <View style={{ flex: 1 }}>
          {tabs.map((tab, i) => {
            const isActive = i === safeIndex;
            const Screen = tab.Component;
            return (
              <View
                key={tab.key}
                style={[
                  StyleSheet.absoluteFillObject,
                  { display: isActive ? "flex" : "none" },
                ]}
                pointerEvents={isActive ? "auto" : "none"}
              >
                <Screen />
              </View>
            );
          })}
        </View>

        {/* Floating pill tab bar. Sits above content, not inside a Safe
            Area, so the blur reads through whatever's underneath. */}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: PILL_HORIZONTAL_MARGIN,
            right: PILL_HORIZONTAL_MARGIN,
            bottom: bottomPad + PILL_BOTTOM_MARGIN,
            height: PILL_HEIGHT,
          }}
        >
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={80}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: PILL_HEIGHT / 2,
              overflow: "hidden",
              // A thin hairline border keeps the pill legible when the
              // blur washes out over a same-tone background.
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
              // Soft drop shadow so the pill sits above the content plane.
              shadowColor: "#000",
              shadowOpacity: isDark ? 0.35 : 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              paddingHorizontal: 6,
            }}
          >
            {tabs.map((tab, i) => {
              const isActive = i === safeIndex;
              const tint = isActive ? c.text : c.textMuted;
              const Icon = Ionicons;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => onTabPress(i)}
                  android_ripple={{ color: c.surfaceAlt, borderless: true }}
                  style={{
                    flex: 1,
                    height: PILL_HEIGHT - 12,
                    marginVertical: 6,
                    borderRadius: (PILL_HEIGHT - 12) / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    // Active tab gets a subtle inverse-tinted pill --
                    // reads like the SF Symbols "selected" chip.
                    backgroundColor: isActive
                      ? isDark
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(0,0,0,0.06)"
                      : "transparent",
                  }}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.title}
                  accessibilityState={{ selected: isActive }}
                  hitSlop={6}
                >
                  <Icon
                    name={isActive ? tab.iconFilled : tab.icon}
                    size={22}
                    color={tint}
                  />
                  <Text
                    variant="caption"
                    style={{
                      fontSize: 10,
                      fontWeight: isActive ? "700" : "500",
                      color: tint,
                      letterSpacing: 0.1,
                      // Tight line-height keeps the label snug to the icon
                      // without expanding the pill's implicit height.
                      lineHeight: 12,
                    }}
                  >
                    {tab.title}
                  </Text>
                </Pressable>
              );
            })}
          </BlurView>
        </View>
      </View>
    </TabNavCtx.Provider>
  );
}
