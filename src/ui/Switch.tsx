import { Switch as RNSwitch, type SwitchProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/** Themed toggle. */
export function Switch({ value, onValueChange, ...rest }: SwitchProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: c.surfaceAlt, true: c.primary }}
      thumbColor="#ffffff"
      ios_backgroundColor={c.surfaceAlt}
      {...rest}
    />
  );
}
