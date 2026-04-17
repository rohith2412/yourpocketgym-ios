import { usePathname, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Line,
  Path,
} from "react-native-svg";

// ── Types ─────────────────────────────────────────────────────────────────────
type IconProps = { active: boolean };

type Tab = {
  id:    string;
  label: string;
  href:  string;
  Icon:  React.FC<IconProps>;
};

type TabItemProps = {
  tab:     Tab;
  active:  boolean;
  onPress: () => void;
};

// ── Icon color helper ────────────────────────────────────────────────────────
const ic = (active: boolean): string => (active ? "#1a1a1a" : "#8e8e93");

// ── Icons ────────────────────────────────────────────────────────────────────
const RepsIcon: React.FC<IconProps> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20V10" stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M18 20V4"  stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M6 20v-4"  stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const TrainerIcon: React.FC<IconProps> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={ic(active)} strokeWidth="1.8" />
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const RecipesIcon: React.FC<IconProps> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="7" y1="2" x2="7" y2="22" stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ScannerIcon: React.FC<IconProps> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={ic(active)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={ic(active)} strokeWidth="1.8" />
  </Svg>
);

// ── Tab config ──────────────────────────────────────────────────────────────── MacroScanner.jsx
const TABS: Tab[] = [
  { id: "reps",    label: "Reps",       href: "/tracking",   Icon: RepsIcon    },
  { id: "trainer", label: "AI Trainer", href: "/ai-trainer", Icon: TrainerIcon },
  { id: "recipes", label: "Recipes",    href: "/recipes",    Icon: RecipesIcon },
  { id: "scanner", label: "Scanner",    href: "/MacroScanner", Icon: ScannerIcon },
];

// ── Animated tab pill ─────────────────────────────────────────────────────────
function TabItem({ tab, active, onPress }: TabItemProps) {
  const scale       = useRef(new Animated.Value(1)).current;
  const pillOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;
  const pillScale   = useRef(new Animated.Value(active ? 1 : 0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillOpacity, {
        toValue: active ? 1 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.spring(pillScale, {
        toValue: active ? 1 : 0.8,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  }, [active]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={s.tabOuter}
    >
      <Animated.View style={[s.tabInner, { transform: [{ scale }] }]}>
        {/* Active pill background */}
        <Animated.View
          style={[
            s.activePill,
            {
              opacity:   pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        />
        <tab.Icon active={active} />
        <Text style={[s.label, active && s.labelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Dock ──────────────────────────────────────────────────────────────────────
export default function Dock() {
  const pathname = usePathname();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  return (
    <>
      <View style={{ height: 82 + insets.bottom }} />

      <View
        style={[
          s.wrapper,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
        pointerEvents="box-none"
      >
        {/* Liquid glass pill */}
        <View style={s.dockShell}>
          {/* Frosted glass layer */}
          <BlurView
            intensity={Platform.OS === "ios" ? 72 : 40}
            tint="light"
            style={StyleSheet.absoluteFill}
          />

          {/* Subtle inner highlight (top edge shimmer) */}
          <View style={s.topHighlight} pointerEvents="none" />

          {/* Tabs */}
          <View style={s.tabRow}>
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <TabItem
                  key={tab.id}
                  tab={tab}
                  active={active}
                  onPress={() => router.push(tab.href)}
                />
              );
            })}
          </View>
        </View>
      </View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    position:   "absolute",
    bottom:     0,
    left:       0,
    right:      0,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  dockShell: {
    width:        "100%",
    maxWidth:     430,
    borderRadius: 26,
    overflow:     "hidden",
    borderWidth:  0.5,
    borderColor:  "rgba(255,255,255,0.55)",
    // Outer shadow — iOS only
    shadowColor:  "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation:    12,                      // Android fallback
    backgroundColor: Platform.OS === "android"
      ? "rgba(248,248,250,0.94)"           // Android: semi-opaque fallback
      : "rgba(255,255,255,0.22)",          // iOS: transparent so BlurView shows
  },

  topHighlight: {
    position:        "absolute",
    top:             0,
    left:            16,
    right:           16,
    height:          1,
    borderRadius:    99,
    backgroundColor: "rgba(255,255,255,0.7)",
    zIndex:          10,
  },

  tabRow: {
    flexDirection:  "row",
    justifyContent: "space-around",
    alignItems:     "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },

  tabOuter: {
    flex:       1,
    alignItems: "center",
  },

  tabInner: {
    alignItems:   "center",
    gap:           4,
    paddingVertical:   6,
    paddingHorizontal: 10,
  },

  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    14,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth:     0.5,
    borderColor:     "rgba(255,255,255,0.9)",
    // Inner pill shadow
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    6,
  },

  label: {
    fontSize:    10,
    fontWeight:  "400",
    color:       "#8e8e93",
    letterSpacing: 0.1,
  },

  labelActive: {
    fontWeight: "600",
    color:      "#1a1a1a",
  },
});