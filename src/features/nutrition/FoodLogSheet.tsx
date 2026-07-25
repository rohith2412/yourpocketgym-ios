import { useEffect, useState } from "react";
import { View, TextInput, Alert } from "react-native";
import { BottomSheet, Text, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { newFoodId, toISODay, type FoodEntry } from "./storage";
import { useAddFood } from "./hooks";

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

  useEffect(() => {
    if (visible) {
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
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
    const entry: FoodEntry = {
      id: newFoodId(),
      date: toISODay(now),
      loggedAt: now.toISOString(),
      name: name.trim(),
      calories: cal,
      protein: asNum(protein),
      carbs: asNum(carbs),
      fat: asNum(fat),
    };
    await add.mutateAsync(entry);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        <Text variant="title">Log food</Text>
        <Text variant="body" color="textMuted">
          Fill in what you ate — takes 5 seconds.
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
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
        <MacroInput label="Protein" value={protein} onChange={setProtein} />
        <MacroInput label="Carbs" value={carbs} onChange={setCarbs} />
        <MacroInput label="Fat" value={fat} onChange={setFat} />
      </View>

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
