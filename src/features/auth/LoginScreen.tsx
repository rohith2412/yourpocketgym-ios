import { View, Image, Alert, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
    onSuccess: (user) =>
      router.replace(user.hasIntro ? "/(tabs)/tracking" : "/startersIntro"),
  });

  const handleGoogle = () => {
    login(undefined, {
      onError: (err) => {
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
      <View style={{ flex: 1 }}>
        {/* ── Back ── */}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: theme.spacing.sm,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>

        {/* ── Heading ── */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            gap: theme.spacing.xl,
          }}
        >
          <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: theme.radius["2xl"],
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../../assets/images/logo-v2.png")}
                style={{ width: 42, height: 42, tintColor: theme.colors.text }}
                resizeMode="contain"
              />
            </View>
            <View style={{ gap: theme.spacing.xs, alignItems: "center" }}>
              <Text variant="title" center>
                Log in
              </Text>
              <Text variant="body" color="textMuted" center>
                Continue with your Google account.
              </Text>
            </View>
          </View>

          <Button
            title={isPending ? "Signing in…" : "Continue with Google"}
            variant="secondary"
            loading={isPending}
            onPress={handleGoogle}
            left={<GoogleGLogo size={20} />}
          />
        </View>

        {/* ── Terms ── */}
        <Text
          variant="caption"
          color="textFaint"
          center
          style={{ lineHeight: 18, paddingBottom: theme.spacing.xl }}
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
      </View>
    </Screen>
  );
}
