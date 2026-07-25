import { useEffect, useState } from "react";
import { View, TextInput } from "react-native";
import { Text as RNText } from "react-native";
import { BottomSheet, Button, Text } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import { useAddWeight, useWeightLog } from "./hooks";
import { latestWeight } from "./storage";

type Props = { visible: boolean; onClose: () => void };

export function WeightLogSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: log = [] } = useWeightLog();
  const add = useAddWeight();

  const [val, setVal] = useState("");

  useEffect(() => {
    if (!visible) return;
    const last = latestWeight(log);
    setVal(last ? String(last.lb) : "");
  }, [visible, log.length]);

  const onSave = () => {
    const lb = parseFloat(val);
    if (!isFinite(lb) || lb <= 0) return;
    add.mutate({ lb }, { onSuccess: onClose });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ gap: 4 }}>
          <RNText style={{ fontSize: 24, fontWeight: "800", color: c.text }}>
            Log weight
          </RNText>
          <Text variant="caption" color="textMuted">
            One entry per day — this replaces today's value.
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="caption" color="textMuted" weight="bold" style={{ letterSpacing: 0.5 }}>
            TODAY
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.md,
              height: 60,
            }}
          >
            <TextInput
              value={val}
              onChangeText={(t) => setVal(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              selectTextOnFocus
              autoFocus
              placeholder="0"
              placeholderTextColor={c.textFaint}
              style={{
                flex: 1,
                fontSize: 32,
                fontWeight: "800",
                color: c.text,
                paddingVertical: 0,
              }}
            />
            <Text variant="body" color="textMuted">
              lb
            </Text>
          </View>
        </View>

        <Button title="Save weight" onPress={onSave} size="lg" haptic="medium" />
      </View>
    </BottomSheet>
  );
}
