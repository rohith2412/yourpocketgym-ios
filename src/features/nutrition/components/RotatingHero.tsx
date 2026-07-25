import { useEffect, useRef, useState } from "react";
import {
  View,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text } from "../../../ui";

type MCIName = ComponentProps<typeof MaterialCommunityIcons>["name"];
import { useTheme } from "../../../theme/ThemeProvider";
import { CalorieRing } from "./CalorieRing";
import { WeeklyChart } from "./WeeklyChart";

const CARD_HEIGHT = 170;

function MiniMacro({
  label,
  value,
  goal,
  color,
  icon,
  iconFlip,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  icon: MCIName;
  iconFlip?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = Math.min(1, value / goal);
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
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text variant="caption" weight="bold" style={{ fontSize: 10, color: c.text }}>
        {Math.round(value)}
        <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
          /{goal}g
        </Text>
      </Text>
      <Text
        variant="caption"
        color="textMuted"
        weight="bold"
        style={{ letterSpacing: 0.5, fontSize: 9 }}
      >
        {label.toUpperCase()}
      </Text>
      {/* Vertical bar — fills bottom to top */}
      <View
        style={{
          flex: 1,
          width: 26,
          borderRadius: 13,
          backgroundColor: c.surfaceAlt,
          overflow: "hidden",
          justifyContent: "flex-end",
        }}
      >
        <Animated.View style={{ width: "100%", height, backgroundColor: color, borderRadius: 13 }} />
      </View>
      <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={c.textMuted}
          style={iconFlip ? { transform: [{ scaleX: -1 }, { rotate: "-25deg" }] } : undefined}
        />
      </View>
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
  const [pageWidth, setPageWidth] = useState(Dimensions.get("window").width);
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
        {/* Page 0 — ring + macros */}
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
              <CalorieRing eaten={eaten} goal={goalKcal} size={110} strokeWidth={9} />
            </Pressable>
            <View style={{ flex: 1, flexDirection: "row", gap: 10, alignSelf: "stretch" }}>
              <MiniMacro label="Protein" value={protein.value} goal={protein.goal} color="#EF4444" icon="food-drumstick" />
              <MiniMacro label="Carbs" value={carbs.value} goal={carbs.goal} color="#F59E0B" icon="bread-slice" />
              <MiniMacro label="Fat" value={fat.value} goal={fat.goal} color="#8B5CF6" icon="pizza" iconFlip />
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
