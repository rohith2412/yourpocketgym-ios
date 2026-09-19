import { View, Image } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { DefaultAvatar } from "./DefaultAvatar";

/**
 * Fallback when a user has no profile photo — a deterministic DiceBear
 * cartoon seeded on the user's name (or email if no name). Same input →
 * same avatar, so people recognise "themselves" across sessions.
 */
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
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
      }}
    >
      <DefaultAvatar seed={name ?? "PocketGym"} size={size} />
    </View>
  );
}
