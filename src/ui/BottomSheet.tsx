import { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  Animated,
  View,
  StyleSheet,
  Dimensions,
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
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slide, { toValue: H, duration: 220, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
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

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radius["2xl"],
          borderTopRightRadius: theme.radius["2xl"],
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing.xl,
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
        {children}
      </Animated.View>
    </Modal>
  );
}
