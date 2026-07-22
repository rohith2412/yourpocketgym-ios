import { View, Image } from "react-native";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Avatar({
  uri,
  name,
  size = 44,
}: {
  uri?: string | null;
  name?: string;
  size?: number;
}) {
  const { theme } = useTheme();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        color="textMuted"
        weight="semibold"
        style={{ fontSize: size * 0.4, textTransform: "uppercase" }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
