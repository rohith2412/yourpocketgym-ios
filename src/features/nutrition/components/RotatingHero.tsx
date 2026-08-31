import { useEffect, useRef, useState } from "react";
import {
  View,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { CalorieRing } from "./CalorieRing";
import { WeeklyChart } from "./WeeklyChart";

const CARD_HEIGHT = 184;

/**
 * One macro as a vertical column — value on top, bar filling bottom-up, label
 * beneath. Colours match the macro series used across the nutrition and
 * progress charts so the whole feature reads as one palette.
 */
function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={{ flex: 1, alignItems: "stretch", gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: c.text, textAlign: "center" }}>
        {Math.round(value)}
        <Text style={{ fontSize: 10, fontWeight: "500", color: c.textFaint }}>
          /{goal}
        </Text>
      </Text>

      {/* Track fills the column width — bar grows from the bottom */}
      <View
        style={{
          flex: 1,
          borderRadius: 8,
          backgroundColor: c.surfaceAlt,
          overflow: "hidden",
          justifyContent: "flex-end",
        }}
      >
        <Animated.View
          style={{ width: "100%", height, backgroundColor: color, borderRadius: 8 }}
        />
      </View>

      <Text
        style={{
          fontSize: 9,
          letterSpacing: 0.6,
          fontWeight: "700",
          color: c.textMuted,
          textAlign: "center",
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

type Props = {
  eaten: number;
  goalKcal: number;
  protein: { value: number; goal: number };
  carbs: { value: number; goal: number };
  fat: { value: number; goal: number };
  onEditGoal?: () => void;
};

export function RotatingHero({ eaten, goalKcal, protein, carbs, fat, onEditGoal }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  // Wait for onLayout to give the actual container width — using Dimensions.window
  // here means the wrong value on real devices where the container is inset from
  // the screen edge, causing the pager to snap to the wrong offset.
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState<0 | 1>(0);
  const scrollRef = useRef<ScrollView>(null);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth) as 0 | 1;
    if (next !== page) setPage(next);
  };

  const goTo = (p: 0 | 1) => {
    scrollRef.current?.scrollTo({ x: p * pageWidth, animated: true });
    setPage(p);
  };

  const cardStyle = {
    backgroundColor: c.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: c.border,
    padding: theme.spacing.lg,
    height: CARD_HEIGHT,
  } as const;

  return (
    <View
      style={{ gap: theme.spacing.sm }}
      onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        decelerationRate="fast"
        style={{ height: CARD_HEIGHT }}
      >
        {/* Page 0 — calorie ring + vertical macro bars */}
        <View style={{ width: pageWidth }}>
          <View
            style={{
              ...cardStyle,
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.lg,
            }}
          >
            <Pressable onPress={onEditGoal} hitSlop={6}>
              <CalorieRing eaten={eaten} goal={goalKcal} size={118} strokeWidth={11} />
            </Pressable>

            <View
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 8,
                alignSelf: "stretch",
                paddingVertical: 2,
              }}
            >
              <MacroBar label="Protein" value={protein.value} goal={protein.goal} color="#EF4444" />
              <MacroBar label="Carbs" value={carbs.value} goal={carbs.goal} color="#F59E0B" />
              <MacroBar label="Fat" value={fat.value} goal={fat.goal} color="#8B5CF6" />
            </View>
          </View>
        </View>

        {/* Page 1 — weekly chart */}
        <View style={{ width: pageWidth }}>
          <View style={{ height: CARD_HEIGHT }}>
            <WeeklyChart goal={goalKcal} height={CARD_HEIGHT} />
          </View>
        </View>
      </ScrollView>

      {/* Dots indicator (tap to jump) */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        {([0, 1] as const).map((i) => (
          <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
            <View
              style={{
                width: page === i ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: page === i ? c.text : c.border,
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
