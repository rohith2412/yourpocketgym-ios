import { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  Animated,
  Easing,
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";

const H = Dimensions.get("window").height;

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/** A themed bottom sheet that slides up over a dimmed backdrop. */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(H);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 380,
          easing: Easing.bezier(0.22, 1, 0.36, 1), // smooth ease-out
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: H,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 1, 1), // smooth ease-in
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay, opacity: backdrop },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      {/* Sheet — wrapped in KAV so text inputs lift above the keyboard */}
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <Animated.View
          style={{
            // Cap the sheet so a tall form pushed up by the keyboard can never
            // run its header off the top of the screen — the ScrollView below
            // takes over once content exceeds the cap.
            maxHeight: H * 0.9,
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius["2xl"],
            borderTopRightRadius: theme.radius["2xl"],
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderColor: theme.colors.border,
            transform: [{ translateY: slide }],
          }}
        >
          {/* Grabber */}
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 99,
              backgroundColor: theme.colors.border,
              alignSelf: "center",
              marginBottom: theme.spacing.lg,
            }}
          />

          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingBottom: insets.bottom + theme.spacing.xl,
            }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
