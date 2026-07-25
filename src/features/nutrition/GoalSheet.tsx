import { useEffect, useState } from "react";
import { View, TextInput } from "react-native";
import { BottomSheet, Button } from "../../ui";
import { Text as RNText } from "react-native";
import { Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useGoals, useSaveGoals } from "./hooks";
import { DEFAULT_GOALS, type MacroGoals } from "./storage";

type Props = { visible: boolean; onClose: () => void };

function NumField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: c.surfaceAlt,
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.md,
          height: 52,
        }}
      >
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          selectTextOnFocus
          style={{
            flex: 1,
            fontSize: 22,
            fontWeight: "800",
            color: c.text,
            paddingVertical: 0,
          }}
        />
        <Text variant="body" color="textMuted">
          {unit}
        </Text>
      </View>
    </View>
  );
}

export function GoalSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const { data } = useGoals();
  const save = useSaveGoals();

  const start = data ?? DEFAULT_GOALS;
  const [cal, setCal] = useState(String(start.calories));
  const [p, setP] = useState(String(start.protein));
  const [carb, setCarb] = useState(String(start.carbs));
  const [f, setF] = useState(String(start.fat));

  useEffect(() => {
    if (!visible) return;
    const g = data ?? DEFAULT_GOALS;
    setCal(String(g.calories));
    setP(String(g.protein));
    setCarb(String(g.carbs));
    setF(String(g.fat));
  }, [visible, data]);

  const onSave = () => {
    const goals: MacroGoals = {
      calories: Math.max(0, parseInt(cal || "0", 10)),
      protein: Math.max(0, parseInt(p || "0", 10)),
      carbs: Math.max(0, parseInt(carb || "0", 10)),
      fat: Math.max(0, parseInt(f || "0", 10)),
    };
    save.mutate(goals, { onSuccess: onClose });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ gap: 4 }}>
          <RNText style={{ fontSize: 24, fontWeight: "800", color: theme.colors.text }}>
            Daily target
          </RNText>
          <Text variant="caption" color="textMuted">
            Set your calorie and macro goals.
          </Text>
        </View>

        <NumField label="Calories" unit="cal" value={cal} onChange={setCal} />

        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <NumField label="Protein" unit="g" value={p} onChange={setP} />
          </View>
          <View style={{ flex: 1 }}>
            <NumField label="Carbs" unit="g" value={carb} onChange={setCarb} />
          </View>
          <View style={{ flex: 1 }}>
            <NumField label="Fat" unit="g" value={f} onChange={setF} />
          </View>
        </View>

        <Button title="Save target" onPress={onSave} size="lg" haptic="medium" />
      </View>
    </BottomSheet>
  );
}
