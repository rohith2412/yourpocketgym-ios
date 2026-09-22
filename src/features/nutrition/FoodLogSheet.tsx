import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { BottomSheet, Button, Text } from "../../ui";
import { useAddFood } from "./hooks";
import { newFoodId, toISODay, type FoodEntry } from "./storage";

const asNum = (v: string) => Number(v.replace(/[^0-9.]/g, "")) || 0;

function MacroInput({
  label,
  value,
  onChange,
  unit = "g",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flex: 1, gap: theme.spacing.xs }}>
      <Text variant="caption" color="textMuted" weight="bold">
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 46,
          backgroundColor: c.surface,
          borderWidth: 1.5,
          borderColor: c.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            color: c.text,
          }}
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          placeholderTextColor={c.textFaint}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <Text variant="caption" color="textFaint">
          {unit}
        </Text>
      </View>
    </View>
  );
}

export function FoodLogSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const add = useAddFood();

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  // Tier-1 essentials — collapsed by default so the sheet stays quick to fill.
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [sodium, setSodium] = useState("");
  const [satFat, setSatFat] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setAdvancedOpen(false);
      setFiber("");
      setSugar("");
      setSodium("");
      setSatFat("");
    }
  }, [visible]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Add a name for this food.");
      return;
    }
    const cal = asNum(calories);
    if (cal <= 0) {
      Alert.alert("Enter calories.");
      return;
    }
    const now = new Date();
    // Only include the Tier-1 fields when the user actually typed a value —
    // an empty input stays `undefined` (rather than 0) so the totals card
    // shows nothing on the row instead of falsely claiming "0g fiber".
    const opt = (v: string): number | undefined => (v.trim() === "" ? undefined : asNum(v));
    const entry: FoodEntry = {
      id: newFoodId(),
      date: toISODay(now),
      loggedAt: now.toISOString(),
      name: name.trim(),
      calories: cal,
      protein: asNum(protein),
      carbs: asNum(carbs),
      fat: asNum(fat),
      fiber: opt(fiber),
      sugar: opt(sugar),
      sodium: opt(sodium),
      satFat: opt(satFat),
    };
    await add.mutateAsync(entry);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        <Text variant="title">Log food</Text>
        <Text variant="body" color="textMuted">
          Fill in what you ate - takes 5 seconds.
        </Text>
      </View>

      {/* Name */}
      <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        <Text variant="caption" color="textMuted" weight="bold">
          FOOD
        </Text>
        <TextInput
          style={{
            height: 46,
            backgroundColor: c.surface,
            borderWidth: 1.5,
            borderColor: c.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            fontSize: 16,
            fontWeight: "600",
            color: c.text,
          }}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Grilled chicken breast"
          placeholderTextColor={c.textFaint}
          autoFocus
          returnKeyType="next"
        />
      </View>

      {/* Calories */}
      <View style={{ marginBottom: theme.spacing.md }}>
        <MacroInput label="Calories" value={calories} onChange={setCalories} unit="cal" />
      </View>

      {/* Macros row */}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <MacroInput label="Protein" value={protein} onChange={setProtein} />
        <MacroInput label="Carbs" value={carbs} onChange={setCarbs} />
        <MacroInput label="Fat" value={fat} onChange={setFat} />
      </View>

      {/* Advanced essentials — collapsed by default */}
      <Pressable
        onPress={() => setAdvancedOpen((v) => !v)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.55 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 36,
          marginBottom: theme.spacing.sm,
        })}
      >
        <Text variant="caption" weight="semibold" color="textMuted">
          {advancedOpen ? "Hide extras" : "Add fiber, sugar, sodium…"}
        </Text>
        <Ionicons
          name={advancedOpen ? "chevron-up" : "chevron-down"}
          size={14}
          color={c.textMuted}
        />
      </Pressable>

      {advancedOpen ? (
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
          <MacroInput label="Fiber" value={fiber} onChange={setFiber} />
          <MacroInput label="Sugar" value={sugar} onChange={setSugar} />
          <MacroInput label="Sodium" value={sodium} onChange={setSodium} unit="mg" />
          <MacroInput label="Sat fat" value={satFat} onChange={setSatFat} />
        </View>
      ) : (
        <View style={{ marginBottom: theme.spacing.md }} />
      )}

      <Button
        title={add.isPending ? "Saving…" : "Add food"}
        variant="primary"
        radius="full"
        size="lg"
        glow
        haptic="medium"
        loading={add.isPending}
        onPress={save}
      />
    </BottomSheet>
  );
}
