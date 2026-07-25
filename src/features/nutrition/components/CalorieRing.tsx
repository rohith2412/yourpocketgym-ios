import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  eaten: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

export function CalorieRing({ eaten, goal, size = 200, strokeWidth = 14 }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const remaining = Math.max(0, goal - eaten);
  const over = eaten > goal;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, eaten / goal);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 1000,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const dashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={c.inverseBg} stopOpacity="1" />
            <Stop offset="100%" stopColor={c.inverseBg} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#calGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
        />
      </Svg>

      {(() => {
        const bigFont = Math.round(size * 0.24);
        const lineH = Math.round(bigFont * 1.05);
        return (
          <View style={{ position: "absolute", alignItems: "center" }}>
            <Text
              variant="caption"
              color="textMuted"
              weight="bold"
              style={{ letterSpacing: 1, fontSize: Math.max(9, Math.round(size * 0.055)) }}
            >
              {over ? "OVER" : "LEFT"}
            </Text>
            <Text
              style={{
                fontSize: bigFont,
                fontWeight: theme.fontWeight.heavy,
                color: c.text,
                letterSpacing: -2,
                lineHeight: lineH,
                marginTop: 2,
              }}
            >
              {(over ? eaten - goal : remaining).toLocaleString()}
            </Text>
            <Text
              variant="caption"
              color="textFaint"
              style={{ marginTop: 2, fontSize: Math.max(9, Math.round(size * 0.055)) }}
            >
              of {goal.toLocaleString()}
            </Text>
          </View>
        );
      })()}
    </View>
  );
}
