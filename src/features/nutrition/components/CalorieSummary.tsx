import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  View,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";

type MCIName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Same palette the macro charts and Progress page use, so it reads as one app. */
const CALORIES = "#4ADE80";
const PROTEIN = "#EF4444";
const CARBS = "#F59E0B";
const FAT = "#8B5CF6";

/**
 * An open gauge rather than a closed ring: 270° of arc with the gap at the
 * bottom, so the track reads as a scale with a beginning and an end instead of
 * a loop. The number lives inside it, which is where the eye already is.
 */
function Gauge({
  size,
  strokeWidth,
  pct,
  color,
  track,
  children,
}: {
  size: number;
  strokeWidth: number;
  pct: number;
  color: string;
  track: string;
  children?: ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const SWEEP = 0.75; // 270°
  const arc = circ * SWEEP;
  const target = Math.min(1, Math.max(0, pct));

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      // Stroke offset isn't a transform, so this one can't go native.
      useNativeDriver: false,
    }).start();
  }, [target]);

  // Dashes draw from the arc's start, so shrinking the offset fills it forward.
  const dashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [arc, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Circles start at 3 o'clock; 135° puts the gap centred on the bottom. */}
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "135deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${arc} ${circ}`}
        />
        {target > 0 ? (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${arc} ${circ}`}
            strokeDashoffset={dashoffset}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

/** A flat track that fills left to right. */
function Bar({ pct, color }: { pct: number; color: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const target = Math.min(1, Math.max(0, pct));

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [target]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: c.surfaceAlt,
        overflow: "hidden",
      }}
    >
      <Animated.View style={{ width, height: "100%", backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

/**
 * One macro tile. The icon sits with the label as a caption, and the fill runs
 * along the bottom edge — a bar compares across three tiles at a glance in a
 * way three separate rings can't.
 */
function MacroTile({
  value,
  goal,
  label,
  color,
  icon,
}: {
  value: number;
  goal: number;
  label: string;
  color: string;
  icon: MCIName;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = goal > 0 ? value / goal : 0;
  const left = Math.max(0, Math.round(goal - value));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: theme.radius["2xl"],
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.4,
            color: c.textMuted,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      </View>

      <Text style={{ fontSize: 22, fontWeight: "800", color: c.text, letterSpacing: -0.6 }}>
        {Math.round(value)}
        <Text style={{ fontSize: 12, fontWeight: "600", color: c.textFaint }}>
          /{Math.round(goal)}g
        </Text>
      </Text>

      <Bar pct={pct} color={color} />

      <Text variant="caption" color="textFaint" style={{ fontSize: 10 }}>
        {left}g left
      </Text>
    </View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 16 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? c.text : c.border,
          }}
        />
      ))}
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
  /** Swiped to from the macros. Omitted (free plan) means no pager at all. */
  waterPage?: ReactNode;
};

export function CalorieSummary({
  eaten,
  goalKcal,
  protein,
  carbs,
  fat,
  onEditGoal,
  waterPage,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pct = goalKcal > 0 ? eaten / goalKcal : 0;
  const over = eaten > goalKcal;
  const left = Math.round(goalKcal - eaten);

  // Measured rather than taken from Dimensions: this sits inside a padded
  // scroll view, so the window width would snap the pager to the wrong offset.
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== page) setPage(next);
  };

  const tiles = (
    <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
      <MacroTile
        value={protein.value}
        goal={protein.goal}
        label="Protein"
        color={PROTEIN}
        icon="food-drumstick"
      />
      <MacroTile value={carbs.value} goal={carbs.goal} label="Carbs" color={CARBS} icon="barley" />
      <MacroTile value={fat.value} goal={fat.goal} label="Fat" color={FAT} icon="peanut" />
    </View>
  );

  return (
    <View style={{ gap: theme.spacing.md }}>
      {/* Calories — the headline. */}
      <Pressable
        onPress={onEditGoal}
        style={{
          backgroundColor: c.surface,
          borderRadius: theme.radius["2xl"],
          borderWidth: 1,
          borderColor: c.border,
          padding: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            variant="caption"
            color="textMuted"
            style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.6 }}
          >
            CALORIES
          </Text>
          <Text
            style={{
              fontSize: 46,
              fontWeight: "800",
              color: c.text,
              letterSpacing: -2,
              lineHeight: 52,
              marginTop: 2,
            }}
          >
            {Math.round(eaten)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text variant="body" color="textMuted">
              of {Math.round(goalKcal)} eaten
            </Text>
            <MaterialCommunityIcons name="pencil-outline" size={13} color={c.textFaint} />
          </View>
        </View>

        <Gauge
          size={112}
          strokeWidth={10}
          pct={pct}
          // Over goal isn't a failure, just worth noticing.
          color={over ? CARBS : CALORIES}
          track={c.surfaceAlt}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: c.text, letterSpacing: -1 }}>
              {Math.abs(left)}
            </Text>
            <Text
              variant="caption"
              color="textMuted"
              style={{ fontSize: 10, letterSpacing: 0.5, fontWeight: "700" }}
            >
              {over ? "OVER" : "LEFT"}
            </Text>
          </View>
        </Gauge>
      </Pressable>

      {waterPage ? (
        <View style={{ gap: theme.spacing.sm }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
            onMomentumScrollEnd={onMomentumScrollEnd}
          >
            <View style={{ width: pageWidth || undefined }}>{tiles}</View>
            <View style={{ width: pageWidth || undefined, justifyContent: "center" }}>
              {waterPage}
            </View>
          </ScrollView>
          <Dots count={2} active={page} />
        </View>
      ) : (
        tiles
      )}
    </View>
  );
}
