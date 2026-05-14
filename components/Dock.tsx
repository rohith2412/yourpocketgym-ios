import { usePathname, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";

type IconProps = { active: boolean };
type Tab = { id: string; label: string; href: string; Icon: React.FC<IconProps> };

const stroke = (active: boolean) => (active ? "#111" : "rgba(60,60,67,0.45)");

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const RepsIcon = ({ active }: IconProps) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20V10" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
    <Path d="M18 20V4"  stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 20v-4"  stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" />
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
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={stroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={stroke(active)} strokeWidth="2" />
  </Svg>
);

const TABS: Tab[] = [
  { id: "reps",    label: "Reps",       href: "/tracking",     Icon: RepsIcon    },
  { id: "trainer", label: "AI Trainer", href: "/ai-trainer",   Icon: TrainerIcon },
  { id: "recipes", label: "Recipes",    href: "/recipes",      Icon: RecipesIcon },
  { id: "scanner", label: "Scanner",    href: "/MacroScanner", Icon: ScannerIcon },
];

/* ─── Dock ───────────────────────────────────────────────────────────────── */
export default function Dock() {
  const pathname = usePathname();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const activeIndex = Math.max(TABS.findIndex(t => pathname.startsWith(t.href)), 0);
  const [tabW, setTabW]   = useState(0);
  const bubbleX           = useRef(new Animated.Value(0)).current;
  const initialized       = useRef(false);

  useEffect(() => {
    if (tabW === 0) return;
    const toValue = activeIndex * tabW;
    if (!initialized.current) {
      bubbleX.setValue(toValue);
      initialized.current = true;
      return;
    }
    Animated.spring(bubbleX, {
      toValue,
      useNativeDriver: true,
      tension: 180,
      friction: 22,
    }).start();
  }, [activeIndex, tabW]);

  const onRowLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width / TABS.length;
    if (w !== tabW) setTabW(w);
  };

  return (
    <>
      {/* Space so content doesn't hide behind dock */}
      <View style={{ height: 80 + insets.bottom }} />

      <View
        style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
        pointerEvents="box-none"
      >
        <View style={s.shell}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={s.shellBg} />
          <View style={s.topGloss} pointerEvents="none" />

          <View style={s.row} onLayout={onRowLayout}>
            {/* Single white bubble that slides */}
            {tabW > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  s.bubble,
                  { width: tabW - 12, transform: [{ translateX: bubbleX }] },
                ]}
              />
            )}

            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => router.push(tab.href as any)}
                  style={s.tab}
                >
                  <tab.Icon active={active} />
                  <Text style={[s.label, active && s.labelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    
  },

  

  shell: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 36,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },

  shellBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(240,240,244,0.9)",
    borderRadius: 36,
  },

  topGloss: {
    position: "absolute",
    top: 0, left: 24, right: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 99,
    zIndex: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  bubble: {
    position: "absolute",
    top: 5, bottom: 5,
    left: 6,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },

  label: {
    fontSize: 10,
    fontWeight: "400",
    color: "rgba(60,60,67,0.5)",
    letterSpacing: 0.1,
    textAlign: "center",
  },

  labelActive: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
