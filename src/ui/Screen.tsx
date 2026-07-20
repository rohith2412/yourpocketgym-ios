import React from "react";
import { View, ScrollView, StatusBar, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";

type ScreenProps = {
  children: React.ReactNode;
  /** Wrap content in a ScrollView. Default: false. */
  scroll?: boolean;
  /** Horizontal padding using the theme spacing scale. Default: "xl" (24). */
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
};

/**
 * Every screen's root. Handles safe-area, themed background, and status-bar
 * style automatically — so no screen ever hardcodes the page color again.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { theme } = useTheme();
  const pad = padded ? { paddingHorizontal: theme.spacing.xl } : null;

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.bg }, style]}
      edges={["top"]}
    >
      <StatusBar barStyle={theme.statusBar} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
