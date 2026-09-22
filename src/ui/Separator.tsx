import { View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function Separator({
  vertical = false,
  inset = 0,
}: {
  vertical?: boolean;
  inset?: number;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={
        vertical
          ? { width: 1, alignSelf: "stretch", backgroundColor: theme.colors.border, marginVertical: inset }
          : { height: 1, backgroundColor: theme.colors.border, marginHorizontal: inset }
      }
    />
  );
}
