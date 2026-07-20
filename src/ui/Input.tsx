import { useState } from "react";
import { View, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";

type InputProps = TextInputProps & {
  label?: string;
  /** Renders a show/hide eye toggle and starts obscured. */
  password?: boolean;
};

export function Input({ label, password, style, ...rest }: InputProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {label ? (
        <Text variant="label" color="text">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 48,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: c.surface,
          borderWidth: 1.5,
          borderColor: focused ? c.text : c.border,
        }}
      >
        <TextInput
          style={[{ flex: 1, fontSize: theme.fontSize.md, color: c.text }, style]}
          placeholderTextColor={c.textFaint}
          secureTextEntry={password && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {password ? (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}>
            <Ionicons
              name={show ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={c.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
