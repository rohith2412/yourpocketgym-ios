import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function MiniRing({ pct, size = 44, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, pct),
      duration: 800,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const offset = anim.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surfaceAlt} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={c.text}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
      />
    </Svg>
  );
}

type MacroProps = {
  protein: { value: number; goal: number };
  carbs: { value: number; goal: number };
  fat: { value: number; goal: number };
};

function MacroChip({ label, value, goal }: { label: string; value: number; goal: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.md,
        alignItems: "center",
        gap: theme.spacing.sm,
      }}
    >
      <MiniRing pct={value / goal} />
      <View style={{ alignItems: "center", gap: 2 }}>
        <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: theme.fontWeight.heavy,
              color: c.text,
              letterSpacing: -0.5,
            }}
          >
            {Math.round(value)}
          </Text>
          <Text variant="caption" color="textFaint">
            /{goal}g
          </Text>
        </View>
      </View>
    </View>
  );
}

export function MacroChips({ protein, carbs, fat }: MacroProps) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
      <MacroChip label="Protein" {...protein} />
      <MacroChip label="Carbs" {...carbs} />
      <MacroChip label="Fat" {...fat} />
    </View>
  );
}
