import { useRouter } from "expo-router";
import { Image, Pressable } from "react-native";
import { useCurrentUser } from "../src/features/auth/useCurrentUser";
import { resolveProfilePhoto } from "../src/features/profile/photoStorage";
import { useTheme } from "../src/theme/ThemeProvider";
import { DefaultAvatar } from "../src/ui/DefaultAvatar";

/**
 * The header avatar. Every screen has one in the top-right; tap goes to the
 * settings page.
 *
 * Previous version was a full-screen animated SVG cartoon - same face for
 * everyone, ignored `size` and `onPress`, and pushed to `/profile` (a route
 * that no longer exists). Nothing about it read as "this is me".
 *
 * Now it's the user's own photo when we have one, initials when we don't. The
 * fallback is a real fallback rather than a placeholder character.
 */
export default function AvatarButton({
  size = 40,
  onPress,
}: {
  size?: number;
  /** Overrides the default navigation to `/profile-detail`. */
  onPress?: () => void;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const { data: user } = useCurrentUser();

  const photoUri = resolveProfilePhoto(user?.photo);
  const handlePress = onPress ?? (() => router.push("/profile-detail" as never));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        // A hairline ring keeps the avatar visually contained even against
        // headers that share its colour (dark photo on a dark background).
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
        backgroundColor: c.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={{ width: size, height: size }} />
      ) : (
        <DefaultAvatar
          seed={user?.name || user?.email || "PocketGym"}
          size={size}
        />
      )}
    </Pressable>
  );
}
