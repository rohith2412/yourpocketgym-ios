import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  View,
  Pressable,
  Animated,
  Easing,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "react-native-bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { useTheme } from "../theme/ThemeProvider";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type FabMenuItem = {
  icon: IoniconName;
  label: string;
  sublabel: string;
  onPress: () => void;
};

const CARD_W = 268;
const BTN = 60;

/**
 * The floating action button and its menu.
 *
 * The menu is a single grouped card rather than a row of separate floating
 * pills — one surface reads as a menu, where scattered pills read as loose
 * buttons. It scales up from the button it belongs to, the way a native
 * context menu does.
 *
 * The open menu lives in a Modal so its backdrop covers the tab bar too. The
 * tab bar is rendered by the navigator, above every screen, so a backdrop
 * drawn inside a screen can never reach it.
 *
 * With only one item there's no menu at all: tapping the button fires it
 * directly, since a menu of one is just a slower button.
 */
export function FabMenu({
  items,
  hidden = false,
}: {
  items: FabMenuItem[];
  /** Fade the resting button out — used while scrolling down. */
  hidden?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width: winW, height: winH } = useWindowDimensions();
  // Scenes run full-height under the translucent tab bar now, so a fixed offset
  // from the screen bottom puts the button *behind* the glass — where it both
  // gets clipped and blows the blur out to white.
  const tabBarH = useBottomTabBarHeight();
  const [open, setOpen] = useState(false);
  // Kept mounted through the closing animation, then torn down.
  const [mounted, setMounted] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const restVis = useRef(new Animated.Value(1)).current;

  // Where the resting button sits in window coordinates. The modal is
  // full-window while the screen is inset above the tab bar, so the same
  // bottom/right offsets land in different places. Measuring the real button
  // and pinning the modal's copy to it keeps them on the same pixel.
  const restRef = useRef<View>(null);
  // The action picked from the menu, held until this modal has gone away.
  const pending = useRef<(() => void) | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number } | null>(null);

  const single = items.length === 1;

  useEffect(() => {
    if (open) setMounted(true);
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 160,
      easing: open
        ? Easing.bezier(0.16, 1, 0.3, 1) // snappy ease-out
        : Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!open && finished) setMounted(false);
    });
  }, [open]);

  // Only fades the resting button. While the menu is open the button lives in
  // the modal, where scroll position is irrelevant.
  useEffect(() => {
    Animated.timing(restVis, {
      toValue: hidden ? 0 : 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [hidden]);

  const onToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (single) {
      items[0].onPress();
      return;
    }
    if (open) {
      setOpen(false);
      return;
    }
    // Measure first so the modal's button opens exactly where this one is.
    if (typeof restRef.current?.measureInWindow === "function") {
      restRef.current.measureInWindow((x, y) => {
        setRect({ x, y });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  };

  // Every menu action opens a sheet, and a sheet is a Modal too. iOS silently
  // drops a modal presentation made while another modal is still dismissing —
  // the menu would close and the sheet would never appear. So the action waits
  // until this modal is off screen. (Free users never saw this: a one-item menu
  // skips the modal and calls the action directly.)
  const pick = (item: FabMenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    pending.current = item.onPress;
    setOpen(false);
  };

  useEffect(() => {
    if (mounted) return;
    const run = pending.current;
    if (!run) return;
    pending.current = null;
    // One beat past unmount, so UIKit has finished tearing the modal down.
    const t = setTimeout(run, 60);
    return () => clearTimeout(t);
  }, [mounted]);

  // Grow from the button's corner rather than the card's centre, so the menu
  // reads as coming *out of* the button.
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  const button = (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        width: BTN,
        height: BTN,
        borderRadius: BTN / 2,
        backgroundColor: c.inverseBg,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.9 : 1,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      })}
    >
      <Ionicons name="add" size={30} color={c.inverseText} />
    </Pressable>
  );

  const restAnchor = {
    position: "absolute",
    bottom: tabBarH + theme.spacing.md,
    right: theme.spacing.lg,
    alignItems: "flex-end",
  } as const;

  // Same visual spot, expressed against the window instead of the screen.
  const modalAnchor = rect
    ? ({
        position: "absolute",
        right: winW - (rect.x + BTN),
        bottom: winH - (rect.y + BTN),
        alignItems: "flex-end",
      } as const)
    : restAnchor;

  return (
    <>
      {/* Resting button, in-screen. Hidden while the modal owns it so the two
          never overlap — they sit at identical coordinates, so the handover
          isn't visible. */}
      {!mounted ? (
        <Animated.View
          style={{
            ...restAnchor,
            opacity: restVis,
            // Untappable once faded out, so it can't swallow a tap on content
            // showing through where it used to be. This belongs in `style`,
            // not the legacy prop of the same name — the prop is ignored on
            // Animated components under the New Architecture.
            pointerEvents: hidden ? "none" : "auto",
            transform: [
              {
                translateY: restVis.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          {/* The ref must sit on a plain host View: measureInWindow is what
              positions the modal's copy of the button, and an Animated wrapper
              is not guaranteed to expose it. */}
          <View ref={restRef} collapsable={false}>
            {button}
          </View>
        </Animated.View>
      ) : null}

      <Modal
        visible={mounted}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop — tap anywhere to dismiss */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: anim,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
              <BlurView
                intensity={24}
                tint={theme.mode === "dark" ? "dark" : "light"}
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.22)" }}
              />
            </Pressable>
          </Animated.View>

          <View style={modalAnchor}>
            <Animated.View
              style={{
                width: CARD_W,
                marginBottom: 14,
                borderRadius: 20,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                overflow: "hidden",
                opacity: anim,
                transform: [{ translateX }, { translateY }, { scale }],
                shadowColor: "#000",
                shadowOpacity: 0.22,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
                elevation: 12,
              }}
            >
              {items.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => pick(item)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    backgroundColor: pressed ? c.surfaceAlt : "transparent",
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: c.border,
                  })}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: c.surfaceAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={item.icon} size={18} color={c.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="body"
                      weight="semibold"
                      numberOfLines={1}
                      style={{ fontSize: 15 }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      variant="caption"
                      color="textMuted"
                      numberOfLines={1}
                      style={{ fontSize: 12, marginTop: 1 }}
                    >
                      {item.sublabel}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>

            <Animated.View style={{ transform: [{ rotate }] }}>{button}</Animated.View>
          </View>
        </View>
      </Modal>
    </>
  );
}
