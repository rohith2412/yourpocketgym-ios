import { View, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useFoodEntries, useGoals } from "../hooks";
import { DEFAULT_GOALS, toISODay, totalsForDay } from "../storage";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  selected: string;
  onSelect: (iso: string) => void;
};

function startOfWeek(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay()); // Sunday start
  return out;
}

const CIRCLE = 40;
const STROKE = 3;
const RADIUS = (CIRCLE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function DayRing({
  pct,
  color,
  track,
}: {
  pct: number;
  color: string;
  track: string;
}) {
  const dashoffset = CIRC * (1 - Math.min(1, Math.max(0, pct)));
  return (
    <Svg
      width={CIRCLE}
      height={CIRCLE}
      style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
    >
      <Circle cx={CIRCLE / 2} cy={CIRCLE / 2} r={RADIUS} stroke={track} strokeWidth={STROKE} fill="none" />
      {pct > 0 ? (
        <Circle
          cx={CIRCLE / 2}
          cy={CIRCLE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={dashoffset}
        />
      ) : null}
    </Svg>
  );
}

export function WeekCalendar({ selected, onSelect }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: foods = [] } = useFoodEntries();
  const { data: g } = useGoals();
  const goalKcal = (g ?? DEFAULT_GOALS).calories;

  const today = new Date();
  const todayIso = toISODay(today);
  const start = startOfWeek(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toISODay(d);
    const kcal = totalsForDay(foods, iso).calories;
    return {
      iso,
      dayNum: d.getDate(),
      label: DAY_LABELS[d.getDay()],
      isToday: iso === todayIso,
      isFuture: d > today && iso !== todayIso,
      isSelected: iso === selected,
      pct: goalKcal > 0 ? kcal / goalKcal : 0,
    };
  });

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {days.map((d) => {
        const disabled = d.isFuture;
        // Ring colour: on the selected filled dark cell we need to invert.
        const ringColor = d.isSelected ? c.inverseText : c.text;
        const trackColor = d.isSelected ? "rgba(255,255,255,0.2)" : c.border;
        return (
          <Pressable
            key={d.iso}
            disabled={disabled}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelect(d.iso);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              opacity: disabled ? 0.35 : 1,
              gap: 6,
            }}
          >
            <Text
              variant="caption"
              style={{
                color: c.textMuted,
                fontSize: 10,
                letterSpacing: 0.5,
                fontWeight: "700",
              }}
            >
              {d.label}
            </Text>
            <View
              style={{
                width: CIRCLE,
                height: CIRCLE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Fill background for selected day */}
              <View
                style={{
                  position: "absolute",
                  width: CIRCLE - STROKE * 2,
                  height: CIRCLE - STROKE * 2,
                  borderRadius: (CIRCLE - STROKE * 2) / 2,
                  backgroundColor: d.isSelected ? c.inverseBg : "transparent",
                }}
              />
              {/* Calorie ring */}
              <DayRing pct={d.pct} color={ringColor} track={trackColor} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: d.isSelected ? c.inverseText : c.text,
                }}
              >
                {d.dayNum}
              </Text>
            </View>
            {d.isToday && !d.isSelected ? (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c.text,
                  marginTop: -2,
                }}
              />
            ) : (
              <View style={{ height: 4, marginTop: -2 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
