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

export function CalorieRing({ eaten, goal, size = 220, strokeWidth = 14 }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const remaining = Math.max(0, goal - eaten);
  const over = eaten > goal;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, eaten / goal);

  // Animate stroke on mount/update
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={c.text} stopOpacity="1" />
            <Stop offset="100%" stopColor={c.text} stopOpacity="0.55" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>

      {/* Center label */}
      <View style={{ position: "absolute", alignItems: "center", gap: 2 }}>
        <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 1 }}>
          {over ? "OVER" : "LEFT"}
        </Text>
        <Text
          style={{
            fontSize: 52,
            fontWeight: theme.fontWeight.heavy,
            color: c.text,
            letterSpacing: -2.5,
            lineHeight: 56,
          }}
        >
          {(over ? eaten - goal : remaining).toLocaleString()}
        </Text>
        <Text variant="caption" color="textFaint">
          of {goal.toLocaleString()} kcal
        </Text>
      </View>
    </View>
  );
}
