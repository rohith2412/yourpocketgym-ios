import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

type Row = { label: string; value: number; goal: number; color: string };

function Bar({ row }: { row: Row }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = Math.min(1, row.value / row.goal);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text variant="body" weight="semibold" style={{ flex: 1 }}>
          {row.label}
        </Text>
        <Text variant="body" weight="bold">
          {Math.round(row.value)}
          <Text variant="caption" color="textFaint">
            {" / "}
            {row.goal}g
          </Text>
        </Text>
        <Text variant="caption" color="textMuted" style={{ width: 44, textAlign: "right" }}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: c.surfaceAlt,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width,
            height: "100%",
            backgroundColor: row.color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

type MacroProps = {
  protein: { value: number; goal: number };
  carbs: { value: number; goal: number };
  fat: { value: number; goal: number };
};

export function MacroBars({ protein, carbs, fat }: MacroProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const rows: Row[] = [
    { label: "Protein", ...protein, color: "#EF4444" },
    { label: "Carbs", ...carbs, color: "#F59E0B" },
    { label: "Fat", ...fat, color: "#8B5CF6" },
  ];

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      <Text variant="label" color="textMuted" weight="bold">
        MACROS
      </Text>
      {rows.map((r) => (
        <Bar key={r.label} row={r} />
      ))}
    </View>
  );
}
