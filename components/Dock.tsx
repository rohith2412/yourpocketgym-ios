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
import Svg, { Circle, Line, Path } from "react-native-svg";

type IconProps = { active: boolean };
type Tab = { id: string; label: string; href: string; Icon: React.FC<IconProps> };
type TabItemProps = { tab: Tab; active: boolean; onPress: () => void };

const stroke = (active: boolean) =>
  active ? "#111111" : "rgba(60,60,67,0.55)";

/* ---------------- ICONS ---------------- */

const RepsIcon = ({ active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20V10" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
    <Path d="M18 20V4" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 20v-4" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const TrainerIcon = ({ active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={stroke(active)} strokeWidth="2" />
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const RecipesIcon = ({ active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="7" y1="2" x2="7" y2="22" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
    <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);


const ScannerIcon = ({ active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke={stroke(active)}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={stroke(active)} strokeWidth="2" />
  </Svg>
);

/* ---------------- TABS ---------------- */

const TABS: Tab[] = [
  { id: "reps", label: "Reps", href: "/tracking", Icon: RepsIcon },
  { id: "trainer", label: "AI Trainer", href: "/ai-trainer", Icon: TrainerIcon },
  { id: "recipes", label: "Recipes", href: "/recipes", Icon: RecipesIcon },
  { id: "scanner", label: "Scanner", href: "/MacroScanner", Icon: ScannerIcon },
];

/* ---------------- TAB ITEM ---------------- */

function TabItem({ tab, active, onPress }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pillOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;
  const pillScale = useRef(new Animated.Value(active ? 1 : 0.8)).current;

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

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.88,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }).start()
      }
      style={s.tabOuter}
    >
      <Animated.View style={[s.tabInner, { transform: [{ scale }] }]}>
        <Animated.View
          style={[
            s.activePill,
            {
              opacity: pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        />
        <tab.Icon active={active} />
        <Text style={[s.label, active && s.labelActive]}>{tab.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/* ---------------- DOCK ---------------- */

export default function Dock() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={{ height: 82 + insets.bottom }} />

      <View
        style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
        pointerEvents="box-none"
      >
        <View style={s.dockShell}>
          <View style={[StyleSheet.absoluteFill, s.dockBgFallback]} />

          <BlurView
            intensity={80}
            tint="light"
            style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
          />

          <View style={s.topHighlight} pointerEvents="none" />

          <View style={s.tabRow}>
            {TABS.map((tab) => (
              <TabItem
                key={tab.id}
                tab={tab}
                active={pathname.startsWith(tab.href)}
                onPress={() => router.push(tab.href as any)}
              />
            ))}
          </View>
        </View>
      </View>
    </>
  );
}

/* ---------------- STYLES ---------------- */

const s = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },

  dockShell: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 14,
  },

  dockBgFallback: {
    backgroundColor: "rgba(248,248,250,0.92)",
    borderRadius: 28,
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 10,
  },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  tabOuter: {
    width: 85,
    alignItems: "center",
  },

  tabInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },

  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  label: {
    fontSize: 10,
    fontWeight: "400",
    color: "rgba(60,60,67,0.55)",
    letterSpacing: 0.1,
    textAlign: "center",
    width: "100%",
  },

  labelActive: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
});