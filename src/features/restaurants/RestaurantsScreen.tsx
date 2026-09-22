import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { Screen, Text } from "../../ui";
import { useAddFood } from "../nutrition/hooks";
import { newFoodId, toISODay, type FoodEntry } from "../nutrition/storage";
import {
  iconForCategory,
  itemsForRestaurant,
  RESTAURANTS,
  searchItems,
  searchRestaurants,
  type MenuItem,
  type Restaurant,
} from "./data";

type SortMode = "calories" | "protein";

/**
 * Full-page restaurant search.
 *
 * Two internal states:
 *  - Root: search bar + list of chains (empty query) or flat item results
 *    across every chain (non-empty query).
 *  - Detail: user tapped a chain → its menu, sortable by calories or protein.
 *
 * The dataset is bundled (see `data.ts`), so everything is offline and
 * instant. Tapping an item confirms and drops it into today's food log.
 */
export function RestaurantsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const add = useAddFood();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState<Restaurant | null>(null);
  const [sort, setSort] = useState<SortMode>("calories");

  const results = useMemo(() => {
    if (focused) return null;
    if (query.trim()) return searchItems(query);
    return null;
  }, [query, focused]);

  const restaurantsToShow = useMemo(() => {
    if (focused || query.trim()) return [];
    return searchRestaurants("");
  }, [focused, query]);

  const focusedMenu = useMemo(() => {
    if (!focused) return [];
    const items = itemsForRestaurant(focused.slug);
    return [...items].sort((a, b) =>
      sort === "calories" ? a.calories - b.calories : b.protein - a.protein,
    );
  }, [focused, sort]);

  const logItem = (item: MenuItem) => {
    Alert.alert(
      item.name,
      `${item.restaurantName} · ${item.calories} kcal\nP ${item.protein}g · C ${item.carbs}g · F ${item.fat}g`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log to today",
          onPress: async () => {
            const now = new Date();
            const entry: FoodEntry = {
              id: newFoodId(),
              date: toISODay(now),
              loggedAt: now.toISOString(),
              name: `${item.name} (${item.restaurantName})`,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            };
            await add.mutateAsync(entry);
            router.back();
          },
        },
      ],
    );
  };

  const renderItemRow = ({ item }: { item: MenuItem }) => (
    <Pressable
      onPress={() => logItem(item)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.55 : 1,
        paddingVertical: 14,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {focused ? "" : `${item.restaurantName} · `}P {item.protein}g · C {item.carbs}g · F {item.fat}g
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", minWidth: 64 }}>
        <Text variant="body" weight="bold">
          {item.calories}
        </Text>
        <Text variant="caption" color="textMuted">
          kcal
        </Text>
      </View>
    </Pressable>
  );

  const renderRestaurantRow = ({ item }: { item: Restaurant }) => {
    const iconName = iconForCategory(item.category) as React.ComponentProps<typeof Ionicons>["name"];
    return (
      <Pressable
        onPress={() => {
          setFocused(item);
          setQuery("");
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.55 : 1,
          paddingVertical: 14,
          paddingHorizontal: theme.spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={18} color={c.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" weight="semibold">
            {item.name}
          </Text>
          <Text variant="caption" color="textMuted" style={{ textTransform: "capitalize" }}>
            {item.category}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      </Pressable>
    );
  };

  const headerTitle = focused ? focused.name : "Restaurants";
  const headerSub = focused
    ? `${focusedMenu.length} items · sorted ${sort === "calories" ? "lowest calories" : "most protein"}`
    : "Search chains or specific foods";

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* Header — sticky at the top, doubles as sub-nav in detail view */}
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => (focused ? setFocused(null) : router.back())}
            hitSlop={12}
            style={{ padding: 4 }}
          >
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ fontSize: 22 }}>
              {headerTitle}
            </Text>
            <Text variant="caption" color="textMuted">
              {headerSub}
            </Text>
          </View>
        </View>

        {/* Toolbar: search bar in root, sort chips in detail */}
        {!focused ? (
          <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: c.surfaceAlt,
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 44,
              }}
            >
              <Ionicons name="search" size={18} color={c.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search burrito, McDonald's..."
                placeholderTextColor={c.textFaint}
                style={{ flex: 1, color: c.text, fontSize: 15 }}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} hitSlop={12}>
                  <Ionicons name="close-circle" size={18} color={c.textFaint} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
              gap: 8,
            }}
          >
            <SortChip
              label="Fewest calories"
              active={sort === "calories"}
              onPress={() => setSort("calories")}
            />
            <SortChip
              label="Most protein"
              active={sort === "protein"}
              onPress={() => setSort("protein")}
            />
          </View>
        )}

        {/* Body */}
        {focused ? (
          <FlatList
            data={focusedMenu}
            keyExtractor={(i) => `${i.restaurantSlug}:${i.name}`}
            renderItem={renderItemRow}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 96 }}
          />
        ) : results ? (
          <FlatList
            data={results}
            keyExtractor={(i, idx) => `${i.restaurantSlug}:${i.name}:${idx}`}
            renderItem={renderItemRow}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 96 }}
            ListEmptyComponent={
              <View style={{ padding: 32, alignItems: "center" }}>
                <Text variant="body" color="textMuted">
                  No matches for "{query}"
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={restaurantsToShow}
            keyExtractor={(r) => r.slug}
            renderItem={renderRestaurantRow}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 96 }}
          />
        )}
      </View>
    </Screen>
  );
}

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? c.text : c.surfaceAlt,
      })}
    >
      <Text
        variant="caption"
        weight="semibold"
        style={{ color: active ? c.bg : c.textMuted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
