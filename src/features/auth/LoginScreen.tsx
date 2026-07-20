import { View, Image, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Text, Button } from "../../ui";
import { useTheme } from "../../theme/ThemeProvider";
import GoogleGLogo from "../../../components/GoogleGLogo";
import { useGoogleLogin } from "./useGoogleLogin";
import { ApiError } from "../../api/client";

const TERMS_URL = "https://yourpocketgym.com/legal/terms";
const PRIVACY_URL = "https://yourpocketgym.com/legal/privacy";

export function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const { mutate: login, isPending } = useGoogleLogin({
    onSuccess: (user) => {
      router.replace(user.hasIntro ? "/(tabs)/tracking" : "/startersIntro");
    },
  });

  const handleGoogle = () => {
    login(undefined, {
      onError: (err) => {
        // Cancellation is swallowed in the hook; only real errors reach here.
        const msg =
          err instanceof ApiError
            ? err.message
            : "Google sign-in failed. Please try again.";
        Alert.alert("Sign-in failed", msg);
      },
    });
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.xl }}>
        {/* Brand */}
        <View style={{ alignItems: "center", gap: theme.spacing.md }}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
          />
          <Text variant="title" center>
            PocketGym
          </Text>
          <Text variant="body" color="textMuted" center>
            Your pocket-sized personal gym.
          </Text>
        </View>

        {/* Google-only sign in */}
        <Button
          title={isPending ? "Signing in…" : "Continue with Google"}
          variant="secondary"
          loading={isPending}
          onPress={handleGoogle}
          left={<GoogleGLogo size={20} />}
        />
      </View>

      {/* Terms footer */}
      <Text
        variant="caption"
        color="textFaint"
        center
        style={{ paddingBottom: theme.spacing.xl, lineHeight: 18 }}
      >
        By continuing you agree to our{" "}
        <Text
          variant="caption"
          color="textMuted"
          onPress={() => Linking.openURL(TERMS_URL)}
          style={{ textDecorationLine: "underline" }}
        >
          Terms
        </Text>{" "}
        &{" "}
        <Text
          variant="caption"
          color="textMuted"
          onPress={() => Linking.openURL(PRIVACY_URL)}
          style={{ textDecorationLine: "underline" }}
        >
          Privacy Policy
        </Text>
      </Text>
    </Screen>
  );
}
