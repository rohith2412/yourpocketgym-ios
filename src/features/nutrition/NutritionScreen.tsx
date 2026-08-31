import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Pressable,
  Alert,
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LIST_LAYOUT_ANIM: Parameters<typeof LayoutAnimation.configureNext>[0] = {
  duration: 320,
  create: { type: "easeInEaseOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeInEaseOut", property: "opacity" },
};
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type MCIName = ComponentProps<typeof MaterialCommunityIcons>["name"];
import * as Haptics from "expo-haptics";
import { Screen, Text, Separator, FabMenu, useHideOnScroll } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useFoodEntries, useGoals, useDeleteFood } from "./hooks";
import { WeekStrip } from "./components/WeekStrip";
import { WaterCard } from "./components/WaterCard";
import AvatarButton from "../../../components/AvatarButton";
import { useTabNav } from "../../nav/tabNav";
import { LinearGradient } from "expo-linear-gradient";
import { FoodLogSheet } from "./FoodLogSheet";
import { GoalSheet } from "./GoalSheet";
import { PhotoLogSheet } from "./photoLog/PhotoLogSheet";
import { BarcodeLogSheet } from "./barcodeLog/BarcodeLogSheet";
import { VoiceNutritionSheet } from "./voiceLog/VoiceNutritionSheet";
import { useEntitlement } from "../subscription/useEntitlement";
import { CalorieSummary } from "./components/CalorieSummary";
import { DEFAULT_GOALS, toISODay, totalsForDay, type FoodEntry } from "./storage";

// ─── Flat food row ───────────────────────────────────────────────────────────
const FOOD_ICONS: [RegExp, MCIName][] = [
  [/pizza/i, "pizza"],
  [/burger|cheeseburger/i, "hamburger"],
  [/fries|chips/i, "french-fries"],
  [/hot ?dog/i, "food-hot-dog"],
  [/taco/i, "taco"],
  [/burrito|wrap/i, "food-takeout-box"],
  [/sushi|sashimi|maki/i, "rice"],
  [/noodle|ramen|pasta|spaghetti/i, "noodles"],
  [/rice/i, "rice"],
  [/salad|lettuce|greens|broccoli|spinach|kale/i, "leaf"],
  [/steak|beef|pork|bacon|lamb/i, "food-steak"],
  [/chicken|poultry|wing|turkey|drumstick/i, "food-drumstick"],
  [/fish|salmon|tuna|shrimp|prawn|seafood/i, "fish"],
  [/egg|omelet|omelette/i, "egg"],
  [/bread|toast|sandwich|bagel|croissant/i, "bread-slice"],
  [/pancake|waffle/i, "food-variant"],
  [/cheese/i, "cheese"],
  [/milk|latte|cappuccino/i, "cup"],
  [/coffee|espresso|americano/i, "coffee"],
  [/tea/i, "tea"],
  [/water/i, "cup-water"],
  [/beer/i, "beer"],
  [/wine/i, "glass-wine"],
  [/juice|smoothie|shake|protein|whey/i, "cup"],
  [/apple/i, "food-apple"],
  [/banana|grape|orange|mango|pineapple|strawberr|berry|watermelon|melon|peach|pear|kiwi|fruit/i, "fruit-cherries"],
  [/avocado|tomato|carrot|potato|onion|pepper|cucumber|vegetable|veggie|corn/i, "carrot"],
  [/nuts|almond|peanut|cashew|walnut/i, "peanut"],
  [/chocolate|cocoa|candy|sweet/i, "candycane"],
  [/cookie|biscuit/i, "cookie"],
  [/cake|donut|doughnut|muffin|cupcake|dessert/i, "cupcake"],
  [/ice ?cream|gelato/i, "ice-cream"],
  [/honey|jam/i, "beehive-outline"],
  [/yogurt|yoghurt|oat|cereal|granola|porridge|oatmeal/i, "bowl-mix"],
  [/soup|stew|curry|chili/i, "pot-steam"],
];

const iconFor = (name: string): MCIName => {
  for (const [re, icon] of FOOD_ICONS) if (re.test(name)) return icon;
  return "silverware-fork-knife";
};

function FoodRow({ entry, onDelete }: { entry: FoodEntry; onDelete: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const time = new Date(entry.loggedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const Chip = ({ label, value }: { label: string; value: number }) => (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: c.surfaceAlt,
      }}
    >
      <Text variant="caption" color="textMuted" weight="semibold" style={{ fontSize: 10 }}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.lg,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {entry.photoUri ? (
          <Image source={{ uri: entry.photoUri }} style={{ width: 44, height: 44 }} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name={iconFor(entry.name)} size={24} color={c.text} />
        )}
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
            {entry.name}
          </Text>
          <Text variant="caption" color="textFaint">
            {time}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Chip label="P" value={entry.protein} />
          <Chip label="C" value={entry.carbs} />
          <Chip label="F" value={entry.fat} />
        </View>
      </View>

      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text variant="body" weight="bold">
          {Math.round(entry.calories)}
        </Text>
        <Text variant="caption" color="textFaint" style={{ fontSize: 9 }}>
          cal
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={16} color={c.textMuted} />
      </Pressable>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export function NutritionScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { goToProfile } = useTabNav();
  const [showLog, setShowLog] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const { hidden: fabHidden, onScroll } = useHideOnScroll();
  const { isPremium } = useEntitlement();


  const [selectedDay, setSelectedDay] = useState<string>(() => toISODay());
  const { data: allFood = [] } = useFoodEntries();
  const { data: g } = useGoals();
  const goals = g ?? DEFAULT_GOALS;
  const del = useDeleteFood();

  const items = allFood.filter((e) => e.date === selectedDay);
  const totals = totalsForDay(allFood, selectedDay);

  const sortedItems = [...items].sort((a, b) =>
    a.loggedAt > b.loggedAt ? -1 : 1,
  );

  const isToday = selectedDay === toISODay();

  // Consecutive days with something logged, counting back from today. Today not
  // being logged yet doesn't break a streak — it just hasn't been extended, so
  // the count starts from yesterday in that case.
  const logStreak = (() => {
    const logged = new Set(allFood.map((e) => e.date));
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (!logged.has(toISODay(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (logged.has(toISODay(d))) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  // Fade the whole screen in on mount
  const mount = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(mount, {
      toValue: 1,
      duration: 480,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, []);
  const mountTranslate = mount.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  // Smooth list add/remove
  const prevCount = useRef(sortedItems.length);
  useEffect(() => {
    if (prevCount.current !== sortedItems.length) {
      LayoutAnimation.configureNext(LIST_LAYOUT_ANIM);
      prevCount.current = sortedItems.length;
    }
  }, [sortedItems.length]);

  const removeEntry = (id: string, name: string) => {
    Alert.alert(`Delete ${name}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          LayoutAnimation.configureNext(LIST_LAYOUT_ANIM);
          del.mutate(id);
        },
      },
    ]);
  };

  const openLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowLog(true);
  };

  const headerLabel = isToday
    ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    : new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

  const onSelectDay = (iso: string) => {
    LayoutAnimation.configureNext(LIST_LAYOUT_ANIM);
    setSelectedDay(iso);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Moody backdrop — soft violet-to-amber wash bleeding out of the top */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(139, 92, 246, 0.22)", // violet
          "rgba(34, 197, 94, 0.10)",  // hint of green (nutrition accent)
          "rgba(0, 0, 0, 0)",
        ]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 420,
        }}
      />
      <Screen padded={false}>
        <Animated.ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: 140,
            gap: theme.spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
          style={{ opacity: mount, transform: [{ translateY: mountTranslate }] }}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: theme.spacing.lg,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text variant="caption" color="textMuted">
                {headerLabel}
              </Text>
              <Text variant="title" style={{ marginTop: 2 }}>
                Nutrition
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
              {/* Days in a row with something logged — the one number worth
                  carrying in the header, because it's the one people chase. */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <MaterialCommunityIcons name="fire" size={15} color="#F59E0B" />
                <Text variant="body" weight="bold" style={{ fontSize: 14 }}>
                  {logStreak}
                </Text>
              </View>
              <AvatarButton size={40} onPress={goToProfile} />
            </View>
          </View>

          {/* Week calendar */}
          <WeekStrip selected={selectedDay} onSelect={onSelectDay} />

          {/* Calories headline + the three macros under it */}
          <CalorieSummary
            eaten={totals.calories}
            goalKcal={goals.calories}
            protein={{ value: totals.protein, goal: goals.protein }}
            carbs={{ value: totals.carbs, goal: goals.carbs }}
            fat={{ value: totals.fat, goal: goals.fat }}
            onEditGoal={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowGoal(true);
            }}
            // Water is Pro-only, so free users get the macros with no pager at
            // all rather than a second page that isn't theirs.
            waterPage={isPremium ? <WaterCard /> : undefined}
          />

          {/* Flat food list */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="heading" style={{ marginBottom: 2 }}>
              {isToday ? "Today's food" : "Food"}
            </Text>

            {sortedItems.length === 0 ? (
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius["2xl"],
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: theme.spacing.xl,
                  alignItems: "center",
                  gap: theme.spacing.md,
                }}
              >
                <Ionicons name="restaurant-outline" size={28} color={c.textMuted} />
                <Text variant="body" color="textMuted" center>
                  Nothing logged yet.{"\n"}Tap + to add a food.
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: theme.radius["2xl"],
                  borderWidth: 1,
                  borderColor: c.border,
                  overflow: "hidden",
                }}
              >
                {sortedItems.map((entry, i) => (
                  <View key={entry.id}>
                    {i > 0 ? <Separator inset={theme.spacing.lg} /> : null}
                    <FoodRow entry={entry} onDelete={() => removeEntry(entry.id, entry.name)} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </Screen>

      {/* Kept mounted while a sheet is open, hidden rather than unmounted, so
          the menu-close animation plays out instead of being ripped mid-flight. */}
      <View
        // Must fill the screen: FabMenu's backdrop is absolutely positioned
        // against this View, so a zero-height wrapper leaves it nothing to
        // cover and the blur never appears. box-none so only the button and
        // menu take touches — the content behind stays interactive.
        pointerEvents={showLog ? "none" : "box-none"}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: showLog ? 0 : 1,
        }}
      >
        <FabMenu
          hidden={fabHidden}
          items={[
            ...(isPremium
              ? [
                  {
                    icon: "mic" as const,
                    label: "Voice log",
                    sublabel: "Say your meal and water",
                    onPress: () => setShowVoice(true),
                  },
                  {
                    icon: "camera" as const,
                    label: "Photo log",
                    sublabel: "AI reads your meal",
                    onPress: () => setShowPhoto(true),
                  },
                  {
                    icon: "barcode-outline" as const,
                    label: "Barcode",
                    sublabel: "Scan a packaged food",
                    onPress: () => setShowBarcode(true),
                  },
                ]
              : []),
            {
              icon: "create-outline" as const,
              label: "Write it",
              sublabel: "Log a meal manually",
              onPress: openLog,
            },
          ]}
        />
      </View>

      <FoodLogSheet visible={showLog} onClose={() => setShowLog(false)} />
      <GoalSheet visible={showGoal} onClose={() => setShowGoal(false)} />
      {isPremium ? (
        <>
          <PhotoLogSheet visible={showPhoto} onClose={() => setShowPhoto(false)} />
          <BarcodeLogSheet visible={showBarcode} onClose={() => setShowBarcode(false)} />
          <VoiceNutritionSheet visible={showVoice} onClose={() => setShowVoice(false)} />
        </>
      ) : null}
    </View>
  );
}
