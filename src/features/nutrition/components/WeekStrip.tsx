import { useRef } from "react";
import { View, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "../../../ui";
import { useTheme } from "../../../theme/ThemeProvider";
import { useFoodEntries, useGoals } from "../hooks";
import { DEFAULT_GOALS, toISODay, totalsForDay } from "../storage";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  selected: string;
  onSelect: (iso: string) => void;
};

const CELL = 42;
/** Column width, wide enough that "Wed" never wraps against its neighbour. */
const COL = 52;
/** A month back, so the strip covers a full logging cycle. */
const DAYS = 30;

/**
 * A scrollable month of days, ending at tomorrow so today isn't jammed against
 * the edge. It opens scrolled to the end — today is what you almost always
 * want, and the past is one flick away rather than a screen away.
 *
 * Days are rounded squares and the state lives in the fill rather than the
 * border: a logged day is filled, one that hit its goal is filled solid, an
 * empty one is an outline, and the day ahead is dimmed. Selection is the accent
 * underline, so it never competes with the logged/not-logged read.
 */
export function WeekStrip({ selected, onSelect }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: foods = [] } = useFoodEntries();
  const { data: g } = useGoals();
  const goalKcal = (g ?? DEFAULT_GOALS).calories;
  const scrollRef = useRef<ScrollView>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toISODay(today);

  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    // Last slot is tomorrow, so today sits one in from the right edge.
    d.setDate(today.getDate() - (DAYS - 2) + i);
    const iso = toISODay(d);
    const kcal = totalsForDay(foods, iso).calories;
    return {
      iso,
      dayNum: d.getDate(),
      label: DAY_LABELS[d.getDay()],
      isToday: iso === todayIso,
      isFuture: d > today,
      isSelected: iso === selected,
      logged: kcal > 0,
      hitGoal: goalKcal > 0 && kcal >= goalKcal,
    };
  });

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      // Jump, don't animate: an opening screen that slides itself sideways
      // reads as a glitch.
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
    >
      {days.map((d) => {
        const filled = d.logged && !d.isFuture;
        return (
          <Pressable
            key={d.iso}
            disabled={d.isFuture}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelect(d.iso);
            }}
            style={{ width: COL, alignItems: "center", gap: 7 }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.3,
                color: d.isFuture ? c.textFaint : d.isSelected ? c.text : c.textMuted,
              }}
            >
              {d.label}
            </Text>

            <View
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 13,
                borderWidth: filled ? 0 : 1,
                borderColor: c.border,
                backgroundColor: filled ? (d.hitGoal ? c.text : c.surfaceAlt) : "transparent",
                alignItems: "center",
                justifyContent: "center",
                opacity: d.isFuture ? 0.4 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: d.isToday ? "800" : "600",
                  color:
                    filled && d.hitGoal ? c.inverseText : d.isFuture ? c.textMuted : c.text,
                }}
              >
                {d.dayNum}
              </Text>
            </View>

            {/* Selection lives here so it can't be confused with a logged day. */}
            <View
              style={{
                width: 18,
                height: 3,
                borderRadius: 2,
                backgroundColor: d.isSelected ? c.text : "transparent",
              }}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
