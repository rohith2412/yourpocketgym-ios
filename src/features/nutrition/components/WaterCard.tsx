import { useEffect, useRef, useState } from "react";
import { View, Pressable, Animated, Easing, StyleSheet } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useWater, useWaterGoal } from "../hooks";
import { toISODay, WATER_GOAL_ML } from "../storage";
import { WaterLogSheet } from "./WaterLogSheet";

// Unified water palette — the same sky-blue everywhere in Nutrition.
const BLUE_LIGHT = "#7DD3FC";
const BLUE_DARK  = "#0284C7";
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Compact horizontal water tank. Tap + to open the water log sheet
 * (target editor + quick add + undo).
 */
export function WaterCard() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: water } = useWater();
  const { data: goalMl = WATER_GOAL_ML } = useWaterGoal();
  const [showLog, setShowLog] = useState(false);

  const today = toISODay();
  const ml = water?.[today] ?? 0;
  const pct = Math.min(1, ml / goalMl);

  const [w, setW] = useState(0);
  const H = 70;
  const R = 18;

  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: pct,
      duration: 800,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: [0, w] });

  const bubble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(bubble, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
  }, []);
  const bubbleY = bubble.interpolate({ inputRange: [0, 1], outputRange: [H - 6, 12] });
  const bubbleOpacity = bubble.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.7, 0.7, 0],
  });

  const openLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowLog(true);
  };

  return (
    <>
      <View
        style={{
          height: H,
          borderRadius: R,
          backgroundColor: c.surfaceAlt,
          overflow: "hidden",
        }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {w > 0 ? (
          <Animated.View style={{ width: fillWidth, height: H, overflow: "hidden" }}>
            <Svg width={w} height={H}>
              <Defs>
                <SvgLinearGradient id="tankGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={BLUE_LIGHT} stopOpacity="1" />
                  <Stop offset="100%" stopColor={BLUE_DARK} stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Path d={`M0,0 L${w},0 L${w},${H} L0,${H} Z`} fill="url(#tankGrad)" />
              <AnimatedCircle cx={w * 0.2} cy={bubbleY} r={2.5} fill="#fff" opacity={bubbleOpacity} />
              <AnimatedCircle cx={w * 0.45} cy={bubbleY} r={1.8} fill="#fff" opacity={bubbleOpacity} />
              <AnimatedCircle cx={w * 0.72} cy={bubbleY} r={1.4} fill="#fff" opacity={bubbleOpacity} />
            </Svg>
          </Animated.View>
        ) : null}

        {/* Amount label overlay */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: pct > 0.15 ? "#ffffff" : c.text,
                letterSpacing: -0.5,
              }}
            >
              {ml < 1000 ? (ml / 1000).toFixed(2) : (ml / 1000).toFixed(1)}
              <Text
                variant="caption"
                style={{
                  color: pct > 0.15 ? "rgba(255,255,255,0.75)" : c.textMuted,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {" "}
                L
              </Text>
            </Text>
            <Text
              variant="caption"
              style={{
                fontSize: 10,
                letterSpacing: 0.5,
                fontWeight: "700",
                color: pct > 0.15 ? "rgba(255,255,255,0.75)" : c.textMuted,
                marginTop: 1,
              }}
            >
              {Math.round(pct * 100)}% · GOAL {(goalMl / 1000).toFixed(1)} L
            </Text>
          </View>
        </View>

        {/* + button — opens the water log sheet */}
        <View style={{ position: "absolute", right: 10, top: 0, bottom: 0, justifyContent: "center" }}>
          <Pressable
            onPress={openLog}
            style={({ pressed }) => ({
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            })}
          >
            <Ionicons name="add" size={22} color={BLUE_DARK} />
          </Pressable>
        </View>
      </View>

      <WaterLogSheet visible={showLog} onClose={() => setShowLog(false)} />
    </>
  );
}
